import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  companies,
  diagnostics,
  quotes,
  serviceAttentions,
  workOrders,
} from "@/db/schema";
import { formatOsFolio, nextFolioValue } from "@/server/masters/folios";
import { getQuoteDetail } from "@/server/commercial/quotes";
import { createServiceAttention } from "@/server/ops/attentions";
import type { CompanySlug } from "@/lib/company";
import { resolveCompanyIds } from "@/server/assets/context";
import type { JourneyHint } from "@/server/journey/types";

/** Tras autorización comercial: abrir OS o atención técnica según tipo (discovery §4–5). */
export async function continueJourneyAfterQuoteAuthorized(params: {
  companyId: string;
  quoteId: string;
  actorUserId: string;
}) {
  const detail = await getQuoteDetail(params.companyId, params.quoteId);
  if (!detail) return null;
  const q = detail.quote;

  if (q.status !== "AUTORIZADA") return null;
  if (q.quoteType === "VENTA_EQUIPO" || q.quoteType === "SERVICIO_CAMPO") {
    return { kind: "COMMERCIAL_ONLY" as const };
  }

  const ids = await resolveCompanyIds();
  if (q.quoteOrigin === "MOT_BASE_SERVOMOTORES" && q.linkedQuoteId) {
    return { kind: "INTERCOMPANY_SYSTRON_MIRROR" as const };
  }
  if (
    q.quoteOrigin === "MOT_BASE_SERVOMOTORES" &&
    params.companyId === ids.servomotoresId
  ) {
    return { kind: "INTERCOMPANY_SM_BASE" as const };
  }
  if (q.motorId && params.companyId === ids.systronId && q.diagnosticId) {
    const [diag] = await getDb()
      .select({ companyId: diagnostics.companyId })
      .from(diagnostics)
      .where(eq(diagnostics.id, q.diagnosticId))
      .limit(1);
    if (diag?.companyId === ids.servomotoresId) {
      return { kind: "INTERCOMPANY_SYSTRON_READ_ONLY" as const };
    }
  }

  if (q.diagnosticId) {
    return ensureRepairWorkOrderAfterDiagnosticQuote({
      companyId: params.companyId,
      quoteId: q.id,
      diagnosticId: q.diagnosticId,
      actorUserId: params.actorUserId,
      frozenIncrementPct: q.frozenIncrementPct,
    });
  }

  if (!q.equiId && !q.motorId) {
    return { kind: "MISSING_ASSET" as const };
  }

  return ensureTechnicalEpisodeFromStandaloneQuote({
    companyId: params.companyId,
    quoteId: q.id,
    clientId: q.clientId,
    quoteType: q.quoteType,
    equiId: q.equiId,
    motorId: q.motorId,
    actorUserId: params.actorUserId,
  });
}

/** Cotización sin equipo: tras ingreso físico (custodia) promover y abrir técnica. */
export async function continueJourneyAfterPhysicalIntake(params: {
  equiId?: string;
  motorId?: string;
  actorUserId: string;
}) {
  const db = getDb();
  const conditions = [eq(quotes.status, "AUTORIZADA_PENDIENTE_INGRESO")];
  if (params.equiId) {
    conditions.push(eq(quotes.equiId, params.equiId));
  } else if (params.motorId) {
    conditions.push(eq(quotes.motorId, params.motorId));
  } else {
    return [];
  }

  const pending = await db.select().from(quotes).where(and(...conditions));
  const results = [];
  for (const q of pending) {
    const [updated] = await db
      .update(quotes)
      .set({ status: "AUTORIZADA", updatedAt: new Date() })
      .where(eq(quotes.id, q.id))
      .returning();
    if (!updated) continue;
    const handoff = await continueJourneyAfterQuoteAuthorized({
      companyId: q.companyId,
      quoteId: q.id,
      actorUserId: params.actorUserId,
    });
    results.push({ quoteId: q.id, handoff });
  }
  return results;
}

async function ensureRepairWorkOrderAfterDiagnosticQuote(params: {
  companyId: string;
  quoteId: string;
  diagnosticId: string;
  actorUserId: string;
  frozenIncrementPct: number | null;
}) {
  const db = getDb();
  const [existing] = await db
    .select({ id: workOrders.id })
    .from(workOrders)
    .where(
      and(
        eq(workOrders.diagnosticId, params.diagnosticId),
        eq(workOrders.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (existing) {
    return { kind: "WORK_ORDER_EXISTS" as const, workOrderId: existing.id };
  }

  const [diag] = await db
    .select()
    .from(diagnostics)
    .where(eq(diagnostics.id, params.diagnosticId))
    .limit(1);
  if (!diag) return { kind: "DIAGNOSTIC_MISSING" as const };

  const [attention] = await db
    .select()
    .from(serviceAttentions)
    .where(eq(serviceAttentions.id, diag.attentionId))
    .limit(1);

  const folioNumber = await nextFolioValue(params.companyId, "OS");
  const [wo] = await db
    .insert(workOrders)
    .values({
      companyId: params.companyId,
      folioNumber,
      attentionId: diag.attentionId,
      diagnosticId: diag.id,
      equiId: attention?.equiId ?? null,
      motorId: attention?.motorId ?? null,
      repairStatus: "EN_ESPERA",
      status: "OPEN",
      frozenPriorityLabel: diag.frozenPriorityLabel,
      frozenIncrementPct:
        params.frozenIncrementPct ?? diag.frozenIncrementPct ?? null,
      frozenSlaMaxDays: diag.frozenSlaMaxDays,
      slaStartedAt: diag.slaStartedAt,
      summary: "Reparación / servicio post-cotización autorizada",
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  return {
    kind: "WORK_ORDER_CREATED" as const,
    workOrderId: wo.id,
    folio: formatOsFolio(folioNumber),
  };
}

async function ensureTechnicalEpisodeFromStandaloneQuote(params: {
  companyId: string;
  quoteId: string;
  clientId: string;
  quoteType: (typeof quotes.$inferSelect)["quoteType"];
  equiId: string | null;
  motorId: string | null;
  actorUserId: string;
}) {
  const db = getDb();
  const [company] = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.id, params.companyId))
    .limit(1);
  const activeSlug = (company?.slug ?? "SYSTRON") as CompanySlug;
  const priorityCode = "NORMAL";
  const failure =
    "Cotización autorizada e ingreso físico confirmado (recorrido comercial → técnica)";

  if (params.quoteType === "DIAGNOSTICO") {
    const result = await createServiceAttention({
      activeSlug,
      activeCompanyId: params.companyId,
      actorUserId: params.actorUserId,
      clientId: params.clientId,
      equiId: params.equiId ?? undefined,
      motorId: params.motorId ?? undefined,
      attentionType: "DIAGNOSTICO",
      reportedFailure: failure,
      priorityCode,
    });
    if (result.diagnostic) {
      await db
        .update(quotes)
        .set({ diagnosticId: result.diagnostic.id, updatedAt: new Date() })
        .where(eq(quotes.id, params.quoteId));
      return {
        kind: "DIAGNOSTIC_CREATED" as const,
        diagnosticId: result.diagnostic.id,
        folio: result.diagnostic.folio,
      };
    }
    return { kind: "DIAGNOSTIC_FAILED" as const };
  }

  if (params.quoteType === "REPARACION_SERVICIO") {
    const result = await createServiceAttention({
      activeSlug,
      activeCompanyId: params.companyId,
      actorUserId: params.actorUserId,
      clientId: params.clientId,
      equiId: params.equiId ?? undefined,
      motorId: params.motorId ?? undefined,
      attentionType: "REPARACION",
      reportedFailure: failure,
      priorityCode,
    });
    if (result.workOrder) {
      return {
        kind: "WORK_ORDER_CREATED" as const,
        workOrderId: result.workOrder.id,
        folio: result.workOrder.folio,
      };
    }
    return { kind: "WORK_ORDER_FAILED" as const };
  }

  return { kind: "NO_TECHNICAL_STEP" as const };
}

export async function getQuoteJourneyHint(params: {
  companyId: string;
  quoteId: string;
}): Promise<JourneyHint | null> {
  const detail = await getQuoteDetail(params.companyId, params.quoteId);
  if (!detail) return null;
  const q = detail.quote;
  const db = getDb();
  const ids = await resolveCompanyIds();

  if (q.quoteOrigin === "MOT_BASE_SERVOMOTORES" && q.status === "PENDIENTE_COTIZAR") {
    return {
      message: "Gerente SM / CEO SM: precio base hacia SYSTRON (intercompañía).",
      href: "/comercial/cotizaciones?vista=pendientes-cotizar",
    };
  }
  if (q.linkedQuoteId && q.status === "PENDIENTE_COTIZAR") {
    return {
      message: "CEO SYSTRON: precio final al cliente (base SM ya capturada).",
      href: `/comercial/cotizaciones/${q.id}`,
    };
  }

  if (q.status === "PENDIENTE_COTIZAR") {
    return {
      message: "Falta precio: CEO/Administrador en Pendientes de cotizar.",
      href: "/comercial/cotizaciones?vista=pendientes-cotizar",
    };
  }
  if (q.status === "PENDIENTE_DECISION") {
    return {
      message: "Falta decisión del cliente (vendedor / seguimiento comercial).",
      href: "/comercial/panel",
    };
  }
  if (q.status === "AUTORIZADA_PENDIENTE_INGRESO") {
    return {
      message:
        "Falta equipo e ingreso físico: crear o vincular EQUI/MOT y confirmar entrada en Almacén.",
      href: "/activos/almacen",
    };
  }
  if (q.status === "AUTORIZADA" && q.quoteType === "SERVICIO_CAMPO") {
    return {
      message: "Servicio en campo autorizado — solicitar factura/remisión.",
      href: "/administracion/facturacion/pendientes",
    };
  }
  if (q.status === "AUTORIZADA" && q.quoteType === "VENTA_EQUIPO") {
    const { equipmentSales } = await import("@/db/schema");
    const [sale] = await db
      .select({ id: equipmentSales.id })
      .from(equipmentSales)
      .where(eq(equipmentSales.quoteId, q.id))
      .limit(1);
    return {
      message: sale
        ? "Venta generada — recepción/entrega de líneas."
        : "Autorice líneas para crear la Venta.",
      href: sale ? `/comercial/ventas/${sale.id}` : null,
    };
  }
  if (q.status === "AUTORIZADA" && q.quoteOrigin === "MOT_BASE_SERVOMOTORES") {
    return {
      message:
        params.companyId === ids.systronId
          ? "Decisión propagada a SM — factura intercompañía si aplica."
          : "Operación técnica continúa en SM; SYSTRON fija precio final.",
      href:
        params.companyId === ids.systronId
          ? "/administracion/cxp"
          : "/paneles/gerente-sm",
    };
  }
  if (q.status === "AUTORIZADA" && q.diagnosticId) {
    const [wo] = await db
      .select({ id: workOrders.id })
      .from(workOrders)
      .where(eq(workOrders.diagnosticId, q.diagnosticId))
      .limit(1);
    if (wo) {
      return {
        message: "Reparación/OS ligada — ejecutar y facturar al cierre.",
        href: `/operacion/os/${wo.id}`,
      };
    }
    return {
      message: "Cotización autorizada — OS de reparación en curso.",
      href: `/operacion/diagnosticos/${q.diagnosticId}`,
    };
  }
  if (q.status === "AUTORIZADA") {
    if (q.equiId || q.motorId) {
      const [wo] = await db
        .select({ id: workOrders.id })
        .from(workOrders)
        .where(
          and(
            eq(workOrders.companyId, params.companyId),
            q.equiId ? eq(workOrders.equiId, q.equiId) : eq(workOrders.motorId, q.motorId!),
          ),
        )
        .limit(1);
      return {
        message: "Autorizada — técnica/fiscal según tipo.",
        href: wo ? `/operacion/os/${wo.id}` : "/operacion/tecnica",
      };
    }
    return {
      message: "Autorizada — solicitar factura/remisión.",
      href: "/administracion/facturacion/pendientes",
    };
  }
  if (q.status === "NO_AUTORIZADA") {
    return { message: "Cotización no autorizada — solo consulta histórica.", href: null };
  }
  return null;
}
