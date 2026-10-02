import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  clientContacts,
  clientFirstOperations,
  clients,
  diagnostics,
  equiUnits,
  motors,
  quoteContactRecipients,
  quoteLines,
  quotePriceRevisions,
  quotes,
  serviceAttentions,
  workOrders,
} from "@/db/schema";
import { formatQuoteFolio, nextFolioValue } from "@/server/masters/folios";
import { computeQuoteTotals } from "@/server/commercial/money";
import { createEquipmentSaleFromQuoteLines } from "@/server/commercial/sales";
import { syncIntercompanyDecision } from "@/server/commercial/intercompany";
import { recordClientFirstOperationIfNeeded } from "@/server/commercial/goals";

export type QuoteLineInput = {
  concept: string;
  quantity: number;
  unitPriceMxn?: number;
};

async function insertQuoteLines(quoteId: string, lines: QuoteLineInput[]) {
  const db = getDb();
  if (lines.length === 0) {
    await db.insert(quoteLines).values({
      quoteId,
      sortOrder: 0,
      concept: "Servicio / concepto por definir",
      quantity: 1,
    });
    return;
  }
  await db.insert(quoteLines).values(
    lines.map((l, i) => ({
      quoteId,
      sortOrder: i,
      concept: l.concept.trim(),
      quantity: Math.max(1, l.quantity),
      unitPriceMxn: l.unitPriceMxn ?? null,
    })),
  );
}

async function syncContactRecipients(quoteId: string, contactIds: string[]) {
  const db = getDb();
  await db
    .delete(quoteContactRecipients)
    .where(eq(quoteContactRecipients.quoteId, quoteId));
  if (contactIds.length === 0) return;
  await db.insert(quoteContactRecipients).values(
    contactIds.map((contactId) => ({ quoteId, contactId })),
  );
}

export async function listQuotes(params: {
  companyId: string;
  status?: (typeof quotes.$inferSelect)["status"][];
  vendorUserId?: string | null;
  pendingPricingOnly?: boolean;
}) {
  const db = getDb();
  const conditions = [eq(quotes.companyId, params.companyId)];
  if (params.pendingPricingOnly) {
    conditions.push(eq(quotes.status, "PENDIENTE_COTIZAR"));
  } else if (params.status?.length) {
    conditions.push(inArray(quotes.status, params.status));
  }
  if (params.vendorUserId) {
    conditions.push(eq(quotes.vendorUserId, params.vendorUserId));
  }

  const rows = await db
    .select({
      quote: quotes,
      clientName: clients.legalName,
    })
    .from(quotes)
    .innerJoin(clients, eq(clients.id, quotes.clientId))
    .where(and(...conditions))
    .orderBy(desc(quotes.updatedAt));

  return rows.map(({ quote, clientName }) => ({
    ...quote,
    folio: formatQuoteFolio(quote.folioNumber),
    clientName,
  }));
}

export async function getQuoteDetail(companyId: string, quoteId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, quoteId), eq(quotes.companyId, companyId)))
    .limit(1);
  if (!row) return null;

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, row.clientId))
    .limit(1);

  const lines = await db
    .select()
    .from(quoteLines)
    .where(eq(quoteLines.quoteId, quoteId))
    .orderBy(quoteLines.sortOrder);

  const recipients = await db
    .select({
      contactId: quoteContactRecipients.contactId,
      name: clientContacts.name,
      email: clientContacts.email,
    })
    .from(quoteContactRecipients)
    .innerJoin(clientContacts, eq(clientContacts.id, quoteContactRecipients.contactId))
    .where(eq(quoteContactRecipients.quoteId, quoteId));

  const revisions = await db
    .select()
    .from(quotePriceRevisions)
    .where(eq(quotePriceRevisions.quoteId, quoteId))
    .orderBy(desc(quotePriceRevisions.createdAt));

  let assetLabel: string | null = null;
  if (row.equiId) {
    const [e] = await db
      .select({ folioNumber: equiUnits.folioNumber })
      .from(equiUnits)
      .where(eq(equiUnits.id, row.equiId))
      .limit(1);
    if (e) assetLabel = `EQUI-${e.folioNumber}`;
  }
  if (row.motorId) {
    const [m] = await db
      .select({ folioNumber: motors.folioNumber })
      .from(motors)
      .where(eq(motors.id, row.motorId))
      .limit(1);
    if (m) assetLabel = `MOT-${m.folioNumber}`;
  }

  let linkedQuote: { id: string; folio: string; totalMxn: number | null } | null =
    null;
  if (row.linkedQuoteId) {
    const [peer] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, row.linkedQuoteId))
      .limit(1);
    if (peer) {
      linkedQuote = {
        id: peer.id,
        folio: formatQuoteFolio(peer.folioNumber),
        totalMxn: peer.totalMxn,
      };
    }
  }

  return {
    quote: { ...row, folio: formatQuoteFolio(row.folioNumber) },
    client,
    lines,
    recipients,
    revisions,
    assetLabel,
    linkedQuote,
  };
}

export async function createVendorQuote(params: {
  companyId: string;
  actorUserId: string;
  vendorUserId: string;
  clientId: string;
  quoteType: (typeof quotes.$inferSelect)["quoteType"];
  equiId?: string;
  motorId?: string;
  prelimEquipmentType?: string;
  prelimBrand?: string;
  prelimModel?: string;
  prelimSerial?: string;
  commercialReference?: string;
  complementNotes?: string;
  contactIds?: string[];
  lines: QuoteLineInput[];
  awaitingPhysicalAsset?: boolean;
}) {
  const db = getDb();
  const folioNumber = await nextFolioValue(params.companyId, "COT");
  const status =
    params.awaitingPhysicalAsset && !params.equiId && !params.motorId
      ? "PENDIENTE_COTIZAR"
      : "PENDIENTE_COTIZAR";

  const [inserted] = await db
    .insert(quotes)
    .values({
      companyId: params.companyId,
      folioNumber,
      clientId: params.clientId,
      vendorUserId: params.vendorUserId,
      quoteType: params.quoteType,
      quoteOrigin: "VENDEDOR",
      status,
      equiId: params.equiId ?? null,
      motorId: params.motorId ?? null,
      prelimEquipmentType: params.prelimEquipmentType?.trim() || null,
      prelimBrand: params.prelimBrand?.trim() || null,
      prelimModel: params.prelimModel?.trim() || null,
      prelimSerial: params.prelimSerial?.trim() || null,
      commercialReference: params.commercialReference?.trim() || null,
      complementNotes: params.complementNotes?.trim() || null,
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  await insertQuoteLines(inserted.id, params.lines);
  if (params.contactIds?.length) {
    await syncContactRecipients(inserted.id, params.contactIds);
  }

  return { ...inserted, folio: formatQuoteFolio(folioNumber) };
}

async function resolveVendorForClient(clientId: string) {
  const db = getDb();
  const [c] = await db
    .select({ commercialResponsibleUserId: clients.commercialResponsibleUserId })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  return c?.commercialResponsibleUserId ?? null;
}

export async function ensureQuoteFromDiagnostic(params: {
  diagnosticId: string;
  actorUserId: string;
}) {
  const db = getDb();
  const [existing] = await db
    .select({ id: quotes.id })
    .from(quotes)
    .where(eq(quotes.diagnosticId, params.diagnosticId))
    .limit(1);
  if (existing) return existing;

  const [diag] = await db
    .select()
    .from(diagnostics)
    .where(eq(diagnostics.id, params.diagnosticId))
    .limit(1);
  if (!diag || diag.status !== "VALIDADO") return null;

  const { effectiveWarrantyIsValid } = await import("@/server/ops/warranty");
  const [attention] = await db
    .select()
    .from(serviceAttentions)
    .where(eq(serviceAttentions.id, diag.attentionId))
    .limit(1);
  if (!attention) return null;

  if (
    attention.attentionType === "DIAGNOSTICO_GARANTIA" &&
    effectiveWarrantyIsValid(diag)
  ) {
    const { createWarrantyRepairWorkOrder } = await import(
      "@/server/ops/warranty"
    );
    await createWarrantyRepairWorkOrder({
      companyId: diag.companyId,
      diagnosticId: diag.id,
      actorUserId: params.actorUserId,
    });
    return null;
  }

  const vendorId =
    (await resolveVendorForClient(attention.clientId)) ?? params.actorUserId;

  const quoteType =
    attention.attentionType === "DIAGNOSTICO_GARANTIA"
      ? "DIAGNOSTICO"
      : attention.attentionType === "REPARACION"
        ? "REPARACION_SERVICIO"
        : "DIAGNOSTICO";

  const origin =
    attention.attentionType === "DIAGNOSTICO_GARANTIA" &&
    diag.warrantyDecision === "GARANTIA_NO_PROCEDENTE"
      ? "GARANTIA_COBRAR"
      : "DIAGNOSTICO_VALIDADO";

  const folioNumber = await nextFolioValue(diag.companyId, "COT");
  const concept =
    diag.technicalResult?.trim() ||
    attention.reportedFailure?.trim() ||
    "Diagnóstico validado";

  const [inserted] = await db
    .insert(quotes)
    .values({
      companyId: diag.companyId,
      folioNumber,
      clientId: attention.clientId,
      vendorUserId: vendorId,
      quoteType,
      quoteOrigin: origin,
      status: "PENDIENTE_COTIZAR",
      diagnosticId: diag.id,
      equiId: attention.equiId,
      motorId: attention.motorId,
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  await insertQuoteLines(inserted.id, [{ concept, quantity: 1 }]);
  return inserted;
}

export async function ensureQuoteFromWorkOrder(params: {
  workOrderId: string;
  actorUserId: string;
}) {
  const db = getDb();
  const [existing] = await db
    .select({ id: quotes.id })
    .from(quotes)
    .where(eq(quotes.workOrderId, params.workOrderId))
    .limit(1);
  if (existing) return existing;

  const [wo] = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.id, params.workOrderId))
    .limit(1);
  if (!wo || wo.repairStatus !== "REPARACION_TERMINADA") return null;

  let clientId: string | null = null;
  let vendorId = params.actorUserId;
  if (wo.attentionId) {
    const [att] = await db
      .select()
      .from(serviceAttentions)
      .where(eq(serviceAttentions.id, wo.attentionId))
      .limit(1);
    if (att) {
      clientId = att.clientId;
      vendorId =
        (await resolveVendorForClient(att.clientId)) ?? params.actorUserId;
    }
  }
  if (!clientId) return null;

  const folioNumber = await nextFolioValue(wo.companyId, "COT");
  const [inserted] = await db
    .insert(quotes)
    .values({
      companyId: wo.companyId,
      folioNumber,
      clientId,
      vendorUserId: vendorId,
      quoteType: "REPARACION_SERVICIO",
      quoteOrigin: "REPARACION_TERMINADA",
      status: "PENDIENTE_COTIZAR",
      workOrderId: wo.id,
      diagnosticId: wo.diagnosticId,
      equiId: wo.equiId,
      motorId: wo.motorId,
      frozenIncrementPct: wo.frozenIncrementPct,
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  const concept =
    wo.technicalResult?.trim() || wo.summary?.trim() || "Reparación terminada";
  await insertQuoteLines(inserted.id, [{ concept, quantity: 1 }]);
  return inserted;
}

export async function assignQuotePrice(params: {
  companyId: string;
  quoteId: string;
  actorUserId: string;
  subtotalMxn: number;
  discountPct?: number;
  repairBaseMxn?: number;
  note?: string;
}) {
  const db = getDb();
  const detail = await getQuoteDetail(params.companyId, params.quoteId);
  if (!detail) return null;
  if (detail.quote.status !== "PENDIENTE_COTIZAR") {
    throw new Error("INVALID_STATUS");
  }

  let subtotal = params.subtotalMxn;
  if (
    detail.quote.quoteOrigin === "REPARACION_TERMINADA" &&
    params.repairBaseMxn != null
  ) {
    const pct = detail.quote.frozenIncrementPct ?? 0;
    subtotal = Math.round(params.repairBaseMxn * (1 + pct / 100));
  }

  const totals = computeQuoteTotals({
    subtotalMxn: subtotal,
    discountPct: params.discountPct ?? detail.quote.discountPct,
  });

  const [updated] = await db
    .update(quotes)
    .set({
      subtotalMxn: totals.subtotalMxn,
      discountPct: params.discountPct ?? detail.quote.discountPct,
      discountMxn: totals.discountMxn,
      priceBeforeIvaMxn: totals.priceBeforeIvaMxn,
      ivaMxn: totals.ivaMxn,
      totalMxn: totals.totalMxn,
      repairBaseMxn: params.repairBaseMxn ?? detail.quote.repairBaseMxn,
      status: "PENDIENTE_DECISION",
      pricedByUserId: params.actorUserId,
      pricedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, params.quoteId))
    .returning();

  await db.insert(quotePriceRevisions).values({
    quoteId: params.quoteId,
    actorUserId: params.actorUserId,
    note: params.note?.trim() || "Asignación de precio",
    subtotalMxn: totals.subtotalMxn,
    totalMxn: totals.totalMxn,
  });

  const { ensureSystronMirrorFromServomotoresQuote } = await import(
    "@/server/commercial/intercompany"
  );
  if (detail.quote.quoteOrigin === "MOT_BASE_SERVOMOTORES") {
    const mirrorId = await ensureSystronMirrorFromServomotoresQuote({
      servomotoresQuoteId: params.quoteId,
      actorUserId: params.actorUserId,
    });
    const systronQuoteId = mirrorId ?? detail.quote.linkedQuoteId;
    if (systronQuoteId) {
      await mirrorIntercompanyBasePrice({
        systronQuoteId,
        baseTotalMxn: totals.totalMxn ?? 0,
      });
    }
  }

  return updated;
}

async function mirrorIntercompanyBasePrice(params: {
  systronQuoteId: string;
  baseTotalMxn: number;
}) {
  const db = getDb();
  await db
    .update(quotes)
    .set({
      intercompanyBaseTotalMxn: params.baseTotalMxn,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, params.systronQuoteId));
}

export async function applyVendorDiscount(params: {
  companyId: string;
  quoteId: string;
  actorUserId: string;
  discountPct: number;
  maxVendorPct: number | null;
  unlimited: boolean;
}) {
  if (!params.unlimited && params.maxVendorPct != null) {
    if (params.discountPct > params.maxVendorPct) {
      throw new Error("DISCOUNT_LIMIT");
    }
  }
  const detail = await getQuoteDetail(params.companyId, params.quoteId);
  if (!detail?.quote.subtotalMxn) throw new Error("NO_SUBTOTAL");
  if (detail.quote.status !== "PENDIENTE_DECISION") {
    throw new Error("INVALID_STATUS");
  }

  const totals = computeQuoteTotals({
    subtotalMxn: detail.quote.subtotalMxn,
    discountPct: params.discountPct,
  });

  const db = getDb();
  const [updated] = await db
    .update(quotes)
    .set({
      discountPct: params.discountPct,
      discountMxn: totals.discountMxn,
      priceBeforeIvaMxn: totals.priceBeforeIvaMxn,
      ivaMxn: totals.ivaMxn,
      totalMxn: totals.totalMxn,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, params.quoteId))
    .returning();
  return updated;
}

export async function markQuoteSent(params: {
  companyId: string;
  quoteId: string;
  contactIds: string[];
  nextFollowUpAt?: Date;
}) {
  const db = getDb();
  await syncContactRecipients(params.quoteId, params.contactIds);
  const [updated] = await db
    .update(quotes)
    .set({
      sentAt: new Date(),
      nextFollowUpAt: params.nextFollowUpAt ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(quotes.id, params.quoteId), eq(quotes.companyId, params.companyId)),
    )
    .returning();
  return updated ?? null;
}

export async function recordQuoteDecision(params: {
  companyId: string;
  quoteId: string;
  actorUserId: string;
  authorized: boolean;
  authorizedLineIds?: string[];
}) {
  const db = getDb();
  const detail = await getQuoteDetail(params.companyId, params.quoteId);
  if (!detail) return null;

  if (
    detail.quote.status === "AUTORIZADA" &&
    detail.quote.quoteType === "VENTA_EQUIPO" &&
    params.authorized &&
    params.authorizedLineIds?.length
  ) {
    await authorizeEquipmentLines({
      quoteId: params.quoteId,
      lineIds: params.authorizedLineIds,
      companyId: params.companyId,
      actorUserId: params.actorUserId,
      clientId: detail.quote.clientId,
    });
    const [row] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, params.quoteId))
      .limit(1);
    return row ?? null;
  }

  if (detail.quote.status !== "PENDIENTE_DECISION") {
    throw new Error("INVALID_STATUS");
  }

  const [client] = await db
    .select({ creditDays: clients.creditDays })
    .from(clients)
    .where(eq(clients.id, detail.quote.clientId))
    .limit(1);

  const awaitingAsset =
    !detail.quote.equiId &&
    !detail.quote.motorId &&
    (detail.quote.prelimEquipmentType ||
      detail.quote.prelimBrand ||
      detail.quote.prelimModel);

  let status: (typeof quotes.$inferSelect)["status"] = params.authorized
    ? awaitingAsset
      ? "AUTORIZADA_PENDIENTE_INGRESO"
      : "AUTORIZADA"
    : "NO_AUTORIZADA";

  if (params.authorized && detail.quote.quoteType === "VENTA_EQUIPO") {
    status = "AUTORIZADA";
  }

  const [updated] = await db
    .update(quotes)
    .set({
      status,
      decisionByUserId: params.actorUserId,
      decisionAt: new Date(),
      authorizedAt: params.authorized ? new Date() : null,
      creditDays: params.authorized ? (client?.creditDays ?? null) : null,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, params.quoteId))
    .returning();

  if (params.authorized && detail.quote.quoteType === "VENTA_EQUIPO") {
    await authorizeEquipmentLines({
      quoteId: params.quoteId,
      lineIds: params.authorizedLineIds,
      companyId: params.companyId,
      actorUserId: params.actorUserId,
      clientId: detail.quote.clientId,
    });
  }

  if (params.authorized) {
    await recordClientFirstOperationIfNeeded({
      companyId: params.companyId,
      clientId: detail.quote.clientId,
      attributedUserId: detail.quote.vendorUserId,
      quoteId: params.quoteId,
    });
  }

  await syncIntercompanyDecision({
    quoteId: params.quoteId,
    authorized: params.authorized,
    actorUserId: params.actorUserId,
  });

  if (params.authorized && status === "AUTORIZADA") {
    const { continueJourneyAfterQuoteAuthorized } = await import(
      "@/server/commercial/quote-handoffs"
    );
    await continueJourneyAfterQuoteAuthorized({
      companyId: params.companyId,
      quoteId: params.quoteId,
      actorUserId: params.actorUserId,
    });
  }

  return updated;
}

async function authorizeEquipmentLines(params: {
  quoteId: string;
  lineIds?: string[];
  companyId: string;
  actorUserId: string;
  clientId: string;
}) {
  const db = getDb();
  const lines = await db
    .select()
    .from(quoteLines)
    .where(eq(quoteLines.quoteId, params.quoteId));

  const selected =
    params.lineIds?.length ?
      lines.filter((l) => params.lineIds!.includes(l.id))
    : lines;

  for (const line of selected) {
    await db
      .update(quoteLines)
      .set({ lineAuthorized: true })
      .where(eq(quoteLines.id, line.id));
  }

  await createEquipmentSaleFromQuoteLines({
    companyId: params.companyId,
    quoteId: params.quoteId,
    clientId: params.clientId,
    actorUserId: params.actorUserId,
    lines: selected.map((l) => ({
      quoteLineId: l.id,
      quantity: l.quantity,
    })),
  });
}

export async function linkQuoteToAsset(params: {
  companyId: string;
  quoteId: string;
  equiId?: string;
  motorId?: string;
}) {
  const db = getDb();
  const [q] = await db
    .select()
    .from(quotes)
    .where(
      and(eq(quotes.id, params.quoteId), eq(quotes.companyId, params.companyId)),
    )
    .limit(1);
  if (!q || q.status !== "AUTORIZADA_PENDIENTE_INGRESO") return null;

  const [updated] = await db
    .update(quotes)
    .set({
      equiId: params.equiId ?? q.equiId,
      motorId: params.motorId ?? q.motorId,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, params.quoteId))
    .returning();
  return updated;
}

export async function reviseAuthorizedPrice(params: {
  companyId: string;
  quoteId: string;
  actorUserId: string;
  subtotalMxn: number;
  note: string;
}) {
  const db = getDb();
  const [q] = await db
    .select()
    .from(quotes)
    .where(
      and(eq(quotes.id, params.quoteId), eq(quotes.companyId, params.companyId)),
    )
    .limit(1);
  if (!q || !["AUTORIZADA", "AUTORIZADA_PENDIENTE_INGRESO"].includes(q.status)) {
    throw new Error("INVALID_STATUS");
  }
  if (q.diagnosticId) {
    throw new Error("HAS_DIAGNOSTIC");
  }

  const totals = computeQuoteTotals({
    subtotalMxn: params.subtotalMxn,
    discountPct: q.discountPct,
  });

  const [updated] = await db
    .update(quotes)
    .set({
      subtotalMxn: totals.subtotalMxn,
      discountMxn: totals.discountMxn,
      priceBeforeIvaMxn: totals.priceBeforeIvaMxn,
      ivaMxn: totals.ivaMxn,
      totalMxn: totals.totalMxn,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, params.quoteId))
    .returning();

  await db.insert(quotePriceRevisions).values({
    quoteId: params.quoteId,
    actorUserId: params.actorUserId,
    note: params.note.trim(),
    subtotalMxn: totals.subtotalMxn,
    totalMxn: totals.totalMxn,
  });

  return updated;
}
