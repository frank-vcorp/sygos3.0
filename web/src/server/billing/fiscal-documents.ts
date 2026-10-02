import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getDb } from "@/db/client";
import {
  accountsReceivable,
  clients,
  fiscalDocumentLines,
  fiscalDocuments,
  quotes,
  quoteLines,
} from "@/db/schema";
import { resolveCompanyIds } from "@/server/assets/context";
import { splitTotalsFromSubtotal } from "@/server/billing/money";
import {
  cancelInvoiceWithFacturapi,
  emitInvoiceWithFacturapi,
} from "@/server/billing/facturapi-client";
import {
  applyPaymentToReceivable,
  createPayableMirror,
  createReceivableFromFiscalDocument,
} from "@/server/billing/ar-ap";
import { ensureServomotoresSystronClient } from "@/server/commercial/intercompany-clients";
import { ensureSystronServomotoresSupplier } from "@/server/masters/suppliers";
import {
  formatFiscalFolio,
  nextFolioValue,
} from "@/server/masters/folios";

export async function getQuotePendingInvoiceMxn(quoteId: string) {
  const db = getDb();
  const [quote] = await db
    .select({ totalMxn: quotes.totalMxn })
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .limit(1);
  const invoiced = await sumInvoicedForQuote(quoteId);
  return Math.max(0, (quote?.totalMxn ?? 0) - invoiced);
}

async function sumInvoicedForQuote(quoteId: string) {
  const db = getDb();
  const rows = await db
    .select({ total: fiscalDocuments.totalMxn })
    .from(fiscalDocuments)
    .where(
      and(
        eq(fiscalDocuments.quoteId, quoteId),
        inArray(fiscalDocuments.status, ["EMITIDA", "PENDIENTE_EMISION"]),
        eq(fiscalDocuments.docKind, "FACTURA"),
      ),
    );
  return rows.reduce((a, r) => a + r.total, 0);
}

function clientTaxSnapshot(client: typeof clients.$inferSelect) {
  return {
    taxLegalNameSnapshot: client.taxLegalName ?? client.legalName,
    taxRfcSnapshot: client.taxRfc,
    taxRegimeSnapshot: client.taxRegime,
    taxZipSnapshot: client.taxZip,
  };
}

export async function listFiscalDocuments(params: {
  companyId: string;
  pendingOnly?: boolean;
  status?: (typeof fiscalDocuments.$inferSelect)["status"][];
}) {
  const db = getDb();
  const conditions = [eq(fiscalDocuments.companyId, params.companyId)];
  if (params.pendingOnly) {
    conditions.push(
      inArray(fiscalDocuments.status, [
        "SOLICITUD_PENDIENTE",
        "PENDIENTE_EMISION",
        "ERROR_FISCAL",
      ]),
    );
  } else if (params.status?.length) {
    conditions.push(inArray(fiscalDocuments.status, params.status));
  }

  const rows = await db
    .select({
      doc: fiscalDocuments,
      clientName: clients.legalName,
    })
    .from(fiscalDocuments)
    .innerJoin(clients, eq(clients.id, fiscalDocuments.clientId))
    .where(and(...conditions))
    .orderBy(desc(fiscalDocuments.updatedAt));

  return rows.map(({ doc, clientName }) => ({
    ...doc,
    folio: formatFiscalFolio(doc.docKind, doc.folioNumber),
    clientName,
  }));
}

export async function getFiscalDocumentDetail(companyId: string, id: string) {
  const db = getDb();
  const [doc] = await db
    .select()
    .from(fiscalDocuments)
    .where(and(eq(fiscalDocuments.id, id), eq(fiscalDocuments.companyId, companyId)))
    .limit(1);
  if (!doc) return null;
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, doc.clientId))
    .limit(1);
  const lines = await db
    .select()
    .from(fiscalDocumentLines)
    .where(eq(fiscalDocumentLines.fiscalDocumentId, id))
    .orderBy(fiscalDocumentLines.sortOrder);
  return {
    doc: { ...doc, folio: formatFiscalFolio(doc.docKind, doc.folioNumber) },
    client,
    lines,
  };
}

async function insertDocLines(
  fiscalDocumentId: string,
  lines: { concept: string; quantity: number; unitPriceMxn: number }[],
) {
  const db = getDb();
  await db.insert(fiscalDocumentLines).values(
    lines.map((l, i) => ({
      fiscalDocumentId,
      sortOrder: i,
      concept: l.concept,
      quantity: l.quantity,
      unitPriceMxn: l.unitPriceMxn,
    })),
  );
}

export async function requestDocumentFromQuote(params: {
  companyId: string;
  quoteId: string;
  actorUserId: string;
  docKind: "FACTURA" | "REMISION";
  amountMxn?: number;
}) {
  const db = getDb();
  const [quote] = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, params.quoteId), eq(quotes.companyId, params.companyId)))
    .limit(1);
  if (!quote) throw new Error("QUOTE_NOT_FOUND");
  if (!["AUTORIZADA", "AUTORIZADA_PENDIENTE_INGRESO"].includes(quote.status)) {
    throw new Error("QUOTE_NOT_AUTHORIZED");
  }

  const lines = await db
    .select()
    .from(quoteLines)
    .where(eq(quoteLines.quoteId, params.quoteId));

  let subtotal =
    params.amountMxn ??
    quote.priceBeforeIvaMxn ??
    quote.subtotalMxn ??
    0;

  if (params.docKind === "REMISION" && subtotal === 0) {
    subtotal = 0;
  }

  const totals =
    subtotal === 0 ?
      { subtotalMxn: 0, discountMxn: 0, ivaMxn: 0, totalMxn: 0 }
    : splitTotalsFromSubtotal(subtotal, quote.discountMxn ?? 0);

  if (params.docKind === "FACTURA") {
    const invoiced = await sumInvoicedForQuote(params.quoteId);
    const cap = quote.totalMxn ?? 0;
    if (invoiced + totals.totalMxn > cap && cap > 0) {
      throw new Error("OVER_INVOICE");
    }
  }

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, quote.clientId))
    .limit(1);
  if (!client) throw new Error("CLIENT_NOT_FOUND");

  const folioType = params.docKind === "REMISION" ? "REM" : "FAC";
  const folioNumber = await nextFolioValue(params.companyId, folioType);
  const idempotencyKey = randomUUID();

  const [inserted] = await db
    .insert(fiscalDocuments)
    .values({
      companyId: params.companyId,
      folioNumber,
      docKind: params.docKind,
      docOrigin: "QUOTE",
      status: "SOLICITUD_PENDIENTE",
      clientId: quote.clientId,
      quoteId: quote.id,
      diagnosticId: quote.diagnosticId,
      workOrderId: quote.workOrderId,
      motorId: quote.motorId,
      commercialReference: quote.commercialReference,
      ...clientTaxSnapshot(client),
      subtotalMxn: totals.subtotalMxn,
      discountMxn: totals.discountMxn,
      ivaMxn: totals.ivaMxn,
      totalMxn: totals.totalMxn,
      creditDays: quote.creditDays ?? client.creditDays,
      idempotencyKey,
      requestedByUserId: params.actorUserId,
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  const docLines =
    lines.length ?
      lines.map((l) => ({
        concept: l.concept,
        quantity: l.quantity,
        unitPriceMxn: l.unitPriceMxn ?? Math.round(subtotal / Math.max(1, l.quantity)),
      }))
    : [{ concept: "Servicio según cotización", quantity: 1, unitPriceMxn: subtotal }];

  await insertDocLines(inserted.id, docLines);
  return { ...inserted, folio: formatFiscalFolio(inserted.docKind, folioNumber) };
}

export async function createFreeInvoice(params: {
  companyId: string;
  actorUserId: string;
  clientId: string;
  lines: { concept: string; quantity: number; unitPriceMxn: number }[];
  discountMxn?: number;
}) {
  const db = getDb();
  const [client] = await db
    .select()
    .from(clients)
    .where(
      and(eq(clients.id, params.clientId), eq(clients.companyId, params.companyId)),
    )
    .limit(1);
  if (!client) throw new Error("CLIENT_NOT_FOUND");

  const subtotal = params.lines.reduce(
    (a, l) => a + l.unitPriceMxn * l.quantity,
    0,
  );
  const totals = splitTotalsFromSubtotal(subtotal, params.discountMxn ?? 0);
  const folioNumber = await nextFolioValue(params.companyId, "FAC");

  const [inserted] = await db
    .insert(fiscalDocuments)
    .values({
      companyId: params.companyId,
      folioNumber,
      docKind: "FACTURA",
      docOrigin: "FREE",
      status: "PENDIENTE_EMISION",
      clientId: client.id,
      ...clientTaxSnapshot(client),
      subtotalMxn: totals.subtotalMxn,
      discountMxn: totals.discountMxn,
      ivaMxn: totals.ivaMxn,
      totalMxn: totals.totalMxn,
      creditDays: client.creditDays,
      idempotencyKey: randomUUID(),
      requestedByUserId: params.actorUserId,
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  await insertDocLines(inserted.id, params.lines);
  return inserted;
}

export async function emitFiscalDocument(params: {
  companyId: string;
  fiscalDocumentId: string;
  actorUserId: string;
  actorRole: import("@/db/schema").UserRole;
}) {
  const db = getDb();
  const detail = await getFiscalDocumentDetail(
    params.companyId,
    params.fiscalDocumentId,
  );
  if (!detail) throw new Error("NOT_FOUND");
  if (
    !["SOLICITUD_PENDIENTE", "PENDIENTE_EMISION", "ERROR_FISCAL"].includes(
      detail.doc.status,
    )
  ) {
    throw new Error("INVALID_STATUS");
  }

  if (detail.doc.docKind === "REMISION") {
    const [updated] = await db
      .update(fiscalDocuments)
      .set({
        status: "EMITIDA",
        issuedByUserId: params.actorUserId,
        issuedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(fiscalDocuments.id, params.fiscalDocumentId))
      .returning();
    return updated;
  }

  const isCreditNote = detail.doc.docKind === "NOTA_CREDITO";

  if (!detail.client?.taxRfc && !isCreditNote && detail.doc.docKind === "FACTURA") {
    throw new Error("MISSING_TAX_DATA");
  }

  try {
    const result = await emitInvoiceWithFacturapi({
      companyId: params.companyId,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      idempotencyKey: detail.doc.idempotencyKey,
      customer: {
        legal_name: detail.doc.taxLegalNameSnapshot ?? detail.client!.legalName,
        tax_id: detail.doc.taxRfcSnapshot ?? "XAXX010101000",
        tax_system: detail.doc.taxRegimeSnapshot ?? undefined,
      },
      items: detail.lines.map((l) => ({
        description: l.concept,
        quantity: l.quantity,
        product: { price: l.unitPriceMxn * 100 },
      })),
      totalMxn: detail.doc.totalMxn,
    });

    const [updated] = await db
      .update(fiscalDocuments)
      .set({
        status: "EMITIDA",
        facturapiInvoiceId: result.invoiceId,
        facturapiUuid: result.uuid,
        fiscalSimulated: result.simulated,
        lastFiscalError: null,
        issuedByUserId: params.actorUserId,
        issuedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(fiscalDocuments.id, params.fiscalDocumentId))
      .returning();

    if (isCreditNote && updated.linkedMirrorDocumentId) {
      const [parentAr] = await db
        .select({ id: accountsReceivable.id })
        .from(accountsReceivable)
        .where(
          eq(accountsReceivable.fiscalDocumentId, updated.linkedMirrorDocumentId),
        )
        .limit(1);
      if (parentAr) {
        await applyPaymentToReceivable({
          arEntryId: parentAr.id,
          amountMxn: updated.totalMxn,
        });
      }
    } else {
      const ar = await createReceivableFromFiscalDocument(updated.id);
      if (updated.docOrigin === "INTERCOMPANY" && ar) {
        await createIntercompanyApMirror(updated.id, ar.id, params.actorUserId);
      }
    }
    return updated;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error fiscal";
    await db
      .update(fiscalDocuments)
      .set({
        status: "ERROR_FISCAL",
        lastFiscalError: message,
        fiscalRetryCount: sql`${fiscalDocuments.fiscalRetryCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(fiscalDocuments.id, params.fiscalDocumentId));
    throw e;
  }
}

async function createIntercompanyApMirror(
  servomotoresDocId: string,
  arEntryId: string,
  actorUserId: string,
) {
  const db = getDb();
  const ids = await resolveCompanyIds();
  const [doc] = await db
    .select()
    .from(fiscalDocuments)
    .where(eq(fiscalDocuments.id, servomotoresDocId))
    .limit(1);
  if (!doc || doc.companyId !== ids.servomotoresId) return;

  const supplier = await ensureSystronServomotoresSupplier({
    systronCompanyId: ids.systronId,
    actorUserId,
  });

  await createPayableMirror({
    systronCompanyId: ids.systronId,
    supplierId: supplier.id,
    fiscalDocumentId: doc.id,
    motorId: doc.motorId,
    totalMxn: doc.totalMxn,
    creditDays: doc.creditDays,
    linkedArEntryId: arEntryId,
  });
}

export async function retryFiscalEmit(params: {
  companyId: string;
  fiscalDocumentId: string;
  actorUserId: string;
  actorRole: import("@/db/schema").UserRole;
}) {
  const db = getDb();
  const [doc] = await db
    .select()
    .from(fiscalDocuments)
    .where(
      and(
        eq(fiscalDocuments.id, params.fiscalDocumentId),
        eq(fiscalDocuments.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!doc || doc.status !== "ERROR_FISCAL") throw new Error("INVALID_STATUS");

  await db
    .update(fiscalDocuments)
    .set({ status: "PENDIENTE_EMISION", updatedAt: new Date() })
    .where(eq(fiscalDocuments.id, params.fiscalDocumentId));

  return emitFiscalDocument(params);
}

export async function requestCancellation(params: {
  companyId: string;
  fiscalDocumentId: string;
  actorUserId: string;
}) {
  const db = getDb();
  const [updated] = await db
    .update(fiscalDocuments)
    .set({
      status: "CANCELACION_SOLICITADA",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(fiscalDocuments.id, params.fiscalDocumentId),
        eq(fiscalDocuments.companyId, params.companyId),
        eq(fiscalDocuments.status, "EMITIDA"),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function approveAndExecuteCancellation(params: {
  companyId: string;
  fiscalDocumentId: string;
  approverUserId: string;
  executorUserId: string;
  executorRole: import("@/db/schema").UserRole;
}) {
  const db = getDb();
  const [doc] = await db
    .select()
    .from(fiscalDocuments)
    .where(
      and(
        eq(fiscalDocuments.id, params.fiscalDocumentId),
        eq(fiscalDocuments.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!doc || doc.status !== "CANCELACION_SOLICITADA") {
    throw new Error("INVALID_STATUS");
  }

  if (doc.facturapiInvoiceId && doc.docKind === "FACTURA") {
    await cancelInvoiceWithFacturapi({
      companyId: params.companyId,
      actorUserId: params.executorUserId,
      actorRole: params.executorRole,
      facturapiInvoiceId: doc.facturapiInvoiceId,
    });
  }

  const [updated] = await db
    .update(fiscalDocuments)
    .set({
      status: "CANCELADA",
      cancellationApprovedByUserId: params.approverUserId,
      issuedByUserId: params.executorUserId,
      updatedAt: new Date(),
    })
    .where(eq(fiscalDocuments.id, params.fiscalDocumentId))
    .returning();
  return updated;
}

export async function prepareCreditNoteFromInvoice(params: {
  companyId: string;
  fiscalDocumentId: string;
  actorUserId: string;
}) {
  const detail = await getFiscalDocumentDetail(
    params.companyId,
    params.fiscalDocumentId,
  );
  if (!detail) throw new Error("NOT_FOUND");
  if (detail.doc.docKind !== "FACTURA" || detail.doc.status !== "EMITIDA") {
    throw new Error("INVALID_STATUS");
  }

  const folioNumber = await nextFolioValue(params.companyId, "NC");
  const db = getDb();
  const [inserted] = await db
    .insert(fiscalDocuments)
    .values({
      companyId: params.companyId,
      folioNumber,
      docKind: "NOTA_CREDITO",
      docOrigin: detail.doc.docOrigin,
      status: "SOLICITUD_PENDIENTE",
      clientId: detail.doc.clientId,
      quoteId: detail.doc.quoteId,
      diagnosticId: detail.doc.diagnosticId,
      workOrderId: detail.doc.workOrderId,
      motorId: detail.doc.motorId,
      commercialReference: detail.doc.commercialReference,
      taxLegalNameSnapshot: detail.doc.taxLegalNameSnapshot,
      taxRfcSnapshot: detail.doc.taxRfcSnapshot,
      taxRegimeSnapshot: detail.doc.taxRegimeSnapshot,
      taxZipSnapshot: detail.doc.taxZipSnapshot,
      subtotalMxn: detail.doc.subtotalMxn,
      discountMxn: detail.doc.discountMxn,
      ivaMxn: detail.doc.ivaMxn,
      totalMxn: detail.doc.totalMxn,
      creditDays: detail.doc.creditDays,
      linkedMirrorDocumentId: detail.doc.id,
      idempotencyKey: randomUUID(),
      requestedByUserId: params.actorUserId,
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  await db.insert(fiscalDocumentLines).values(
    detail.lines.map((l, i) => ({
      fiscalDocumentId: inserted.id,
      sortOrder: i,
      concept: l.concept,
      quantity: l.quantity,
      unitPriceMxn: l.unitPriceMxn,
    })),
  );

  return { ...inserted, folio: formatFiscalFolio("NOTA_CREDITO", folioNumber) };
}

export async function approveCreditNoteForEmit(params: {
  companyId: string;
  fiscalDocumentId: string;
}) {
  const db = getDb();
  const [updated] = await db
    .update(fiscalDocuments)
    .set({ status: "PENDIENTE_EMISION", updatedAt: new Date() })
    .where(
      and(
        eq(fiscalDocuments.id, params.fiscalDocumentId),
        eq(fiscalDocuments.companyId, params.companyId),
        eq(fiscalDocuments.docKind, "NOTA_CREDITO"),
        eq(fiscalDocuments.status, "SOLICITUD_PENDIENTE"),
      ),
    )
    .returning();
  if (!updated) throw new Error("INVALID_STATUS");
  return updated;
}

export async function createIntercompanyInvoice(params: {
  actorUserId: string;
  motorId: string;
  subtotalMxn: number;
  lines: { concept: string; quantity: number; unitPriceMxn: number }[];
}) {
  const ids = await resolveCompanyIds();
  const systronClient = await ensureServomotoresSystronClient(params.actorUserId);
  const totals = splitTotalsFromSubtotal(params.subtotalMxn);
  const folioNumber = await nextFolioValue(ids.servomotoresId, "FAC");
  const db = getDb();

  const [inserted] = await db
    .insert(fiscalDocuments)
    .values({
      companyId: ids.servomotoresId,
      folioNumber,
      docKind: "FACTURA",
      docOrigin: "INTERCOMPANY",
      status: "PENDIENTE_EMISION",
      clientId: systronClient.id,
      motorId: params.motorId,
      subtotalMxn: totals.subtotalMxn,
      discountMxn: totals.discountMxn,
      ivaMxn: totals.ivaMxn,
      totalMxn: totals.totalMxn,
      idempotencyKey: randomUUID(),
      requestedByUserId: params.actorUserId,
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  await insertDocLines(inserted.id, params.lines);
  return inserted;
}

export async function getMotIntercompanySubtotalHint(motorId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      beforeIva: quotes.priceBeforeIvaMxn,
      base: quotes.intercompanyBaseTotalMxn,
    })
    .from(quotes)
    .where(eq(quotes.motorId, motorId))
    .orderBy(desc(quotes.updatedAt))
    .limit(1);
  return row?.beforeIva ?? row?.base ?? null;
}

export async function listBillingPendingForClients(params: {
  companyId: string;
  vendorUserId?: string;
}) {
  const db = getDb();
  const conditions = [
    eq(quotes.companyId, params.companyId),
    inArray(quotes.status, ["AUTORIZADA", "AUTORIZADA_PENDIENTE_INGRESO"]),
    eq(clients.requiresInvoice, true),
  ];
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
    .where(and(...conditions));

  const pending: { label: string; href: string }[] = [];
  for (const { quote, clientName } of rows) {
    const invoiced = await sumInvoicedForQuote(quote.id);
    const total = quote.totalMxn ?? 0;
    if (total > invoiced) {
      pending.push({
        label: `${clientName} · COT-${quote.folioNumber} · pendiente ${total - invoiced} MXN`,
        href: `/comercial/cotizaciones/${quote.id}`,
      });
    }
  }
  return pending;
}
