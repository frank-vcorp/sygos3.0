import { and, desc, eq, inArray, isNull, lt, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  clients,
  diagnostics,
  equiUnits,
  motors,
  serviceAttentions,
  users,
} from "@/db/schema";
import { formatMotFolio, nextFolioValue } from "@/server/masters/folios";
import { getPrioritySnapshot } from "@/server/ops/priorities";
import { addBusinessDays } from "@/server/ops/sla";
import { resolveCompanyIds } from "@/server/assets/context";
import type { CompanySlug } from "@/lib/company";

export function formatDiagFolio(n: number): string {
  return `DIAG-${n}`;
}

export async function createDiagnosticForAttention(params: {
  companyId: string;
  attentionId: string;
  attentionType: "DIAGNOSTICO" | "DIAGNOSTICO_GARANTIA";
  priorityCode: string;
}) {
  const snap = await getPrioritySnapshot({
    companyId: params.companyId,
    catalog: "DIAGNOSTICO",
    code: params.priorityCode,
  });
  if (!snap) throw new Error("PRIORITY_INVALID");

  const db = getDb();
  const folioNumber = await nextFolioValue(params.companyId, "DIAG");
  const [inserted] = await db
    .insert(diagnostics)
    .values({
      companyId: params.companyId,
      attentionId: params.attentionId,
      folioNumber,
      frozenPriorityLabel: snap.label,
      frozenPriceMxn: snap.priceMxn,
      frozenIncrementPct: snap.incrementPct,
      frozenSlaMaxDays: snap.slaMaxDays,
    })
    .returning();
  return { ...inserted, folio: formatDiagFolio(folioNumber) };
}

export async function startSlaForAttentionAsset(params: {
  equiId?: string;
  motorId?: string;
}) {
  const db = getDb();
  const attentions = await db
    .select({ id: serviceAttentions.id })
    .from(serviceAttentions)
    .where(
      params.equiId
        ? eq(serviceAttentions.equiId, params.equiId)
        : eq(serviceAttentions.motorId, params.motorId!),
    );

  if (attentions.length === 0) return;

  const attentionIds = attentions.map((a) => a.id);
  const now = new Date();

  const openDiagnostics = await db
    .select()
    .from(diagnostics)
    .where(
      and(
        inArray(diagnostics.attentionId, attentionIds),
        eq(diagnostics.status, "EN_ESPERA"),
      ),
    );

  for (const d of openDiagnostics) {
    if (d.slaStartedAt) continue;
    await db
      .update(diagnostics)
      .set({
        slaStartedAt: now,
        slaDueAt: addBusinessDays(now, d.frozenSlaMaxDays),
        updatedAt: now,
      })
      .where(eq(diagnostics.id, d.id));
  }

  const { workOrders } = await import("@/db/schema");
  const openOrders = await db
    .select()
    .from(workOrders)
    .where(
      and(
        inArray(workOrders.attentionId, attentionIds),
        eq(workOrders.repairStatus, "EN_ESPERA"),
      ),
    );

  for (const wo of openOrders) {
    if (wo.slaStartedAt) continue;
    await db
      .update(workOrders)
      .set({
        slaStartedAt: now,
        updatedAt: now,
      })
      .where(eq(workOrders.id, wo.id));
  }
}

function systronVisibility(systronId: string, smId: string) {
  return or(
    eq(diagnostics.companyId, systronId),
    and(eq(diagnostics.companyId, smId), eq(motors.origin, "SYSTRON")),
  )!;
}

const ACTIVE_DIAGNOSTIC_STATUSES: (typeof diagnostics.$inferSelect)["status"][] =
  [
    "EN_ESPERA",
    "EN_DIAGNOSTICO",
    "DIAGNOSTICO_TERMINADO",
    "PENDIENTE_VALIDACION_GERENTE",
    "DEVUELTO_CORRECCION",
  ];

export async function listDiagnostics(params: {
  activeSlug: CompanySlug;
  companyId: string;
  status?: string;
  validationQueue?: boolean;
  assignedUserId?: string;
  unassignedOnly?: boolean;
  activeOnly?: boolean;
  overdueOnly?: boolean;
  limit?: number;
}) {
  const db = getDb();
  const ids = await resolveCompanyIds();
  const conditions = [
    params.activeSlug === "SYSTRON"
      ? systronVisibility(ids.systronId, ids.servomotoresId)
      : eq(diagnostics.companyId, ids.servomotoresId),
  ];
  if (params.status) {
    conditions.push(
      eq(
        diagnostics.status,
        params.status as (typeof diagnostics.$inferSelect)["status"],
      ),
    );
  }
  if (params.validationQueue) {
    conditions.push(
      eq(diagnostics.status, "PENDIENTE_VALIDACION_GERENTE"),
    );
  }
  if (params.assignedUserId) {
    conditions.push(eq(diagnostics.assignedUserId, params.assignedUserId));
  }
  if (params.unassignedOnly) {
    conditions.push(isNull(diagnostics.assignedUserId));
  }
  if (params.activeOnly) {
    conditions.push(inArray(diagnostics.status, ACTIVE_DIAGNOSTIC_STATUSES));
  }
  if (params.overdueOnly) {
    conditions.push(lt(diagnostics.slaDueAt, new Date()));
    conditions.push(inArray(diagnostics.status, ACTIVE_DIAGNOSTIC_STATUSES));
  }

  const rows = await db
    .select({
      id: diagnostics.id,
      folioNumber: diagnostics.folioNumber,
      status: diagnostics.status,
      frozenPriorityLabel: diagnostics.frozenPriorityLabel,
      slaDueAt: diagnostics.slaDueAt,
      assignedName: users.displayName,
      attentionType: serviceAttentions.attentionType,
      reportedFailure: serviceAttentions.reportedFailure,
      companyId: diagnostics.companyId,
    })
    .from(diagnostics)
    .innerJoin(
      serviceAttentions,
      eq(serviceAttentions.id, diagnostics.attentionId),
    )
    .leftJoin(motors, eq(motors.id, serviceAttentions.motorId))
    .leftJoin(users, eq(users.id, diagnostics.assignedUserId))
    .where(and(...conditions))
    .orderBy(desc(diagnostics.createdAt))
    .limit(params.limit ?? 500);

  return rows.map((r) => ({
    ...r,
    folio: formatDiagFolio(r.folioNumber),
  }));
}

export async function getDiagnosticDetail(diagnosticId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(diagnostics)
    .where(eq(diagnostics.id, diagnosticId))
    .limit(1);
  if (!row) return null;

  const [attention] = await db
    .select()
    .from(serviceAttentions)
    .where(eq(serviceAttentions.id, row.attentionId))
    .limit(1);

  let assetLabel = "—";
  if (attention?.equiId) {
    const [e] = await db
      .select()
      .from(equiUnits)
      .where(eq(equiUnits.id, attention.equiId))
      .limit(1);
    if (e) assetLabel = `EQUI-${e.folioNumber}`;
  }
  if (attention?.motorId) {
    const [m] = await db
      .select()
      .from(motors)
      .where(eq(motors.id, attention.motorId))
      .limit(1);
    if (m) assetLabel = formatMotFolio(m.folioNumber);
  }

  const [client] = attention
    ? await db
        .select({ legalName: clients.legalName })
        .from(clients)
        .where(eq(clients.id, attention.clientId))
        .limit(1)
    : [];

  return {
    diagnostic: row,
    folio: formatDiagFolio(row.folioNumber),
    attention,
    assetLabel,
    clientName: client?.legalName ?? "—",
  };
}

export async function updateDiagnostic(params: {
  diagnosticId: string;
  companyId: string;
  actorUserId: string;
  actorRole: string;
  patch: Partial<{
    status: (typeof diagnostics.$inferSelect)["status"];
    assignedUserId: string;
    technicalResult: string;
    warrantyDecision: "GARANTIA_VALIDA" | "GARANTIA_NO_PROCEDENTE";
    validationReturnReason: string;
  }>;
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(diagnostics)
    .where(
      and(
        eq(diagnostics.id, params.diagnosticId),
        eq(diagnostics.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!existing) return null;

  const values: Record<string, unknown> = { updatedAt: new Date() };

  if (params.patch.assignedUserId) {
    values.assignedUserId = params.patch.assignedUserId;
  }
  if (params.patch.technicalResult !== undefined) {
    values.technicalResult = params.patch.technicalResult;
  }
  if (params.patch.warrantyDecision) {
    values.warrantyDecision = params.patch.warrantyDecision;
  }

  if (params.patch.status) {
    values.status = params.patch.status;
    if (params.patch.status === "DIAGNOSTICO_TERMINADO") {
      values.status = "PENDIENTE_VALIDACION_GERENTE";
    }
    if (params.patch.status === "VALIDADO") {
      values.validatedAt = new Date();
      values.validatedByUserId = params.actorUserId;
    }
    if (params.patch.status === "DEVUELTO_CORRECCION") {
      values.validationReturnReason = params.patch.validationReturnReason ?? null;
      values.status = "EN_DIAGNOSTICO";
    }
  }

  const [updated] = await db
    .update(diagnostics)
    .set(values)
    .where(eq(diagnostics.id, params.diagnosticId))
    .returning();

  return updated;
}

/** Bitácora reflejada: SYSTRON lee entradas del diagnóstico en Servomotores por MOT. */
export async function listBitacoraForMotorReadonly(motorId: string) {
  const db = getDb();
  const ids = await resolveCompanyIds();
  const attentions = await db
    .select({ id: serviceAttentions.id })
    .from(serviceAttentions)
    .where(eq(serviceAttentions.motorId, motorId));

  if (attentions.length === 0) return [];

  const diagRows = await db
    .select({ id: diagnostics.id })
    .from(diagnostics)
    .where(
      and(
        inArray(
          diagnostics.attentionId,
          attentions.map((a) => a.id),
        ),
        eq(diagnostics.companyId, ids.servomotoresId),
      ),
    );

  if (diagRows.length === 0) return [];

  const { technicalLogEntries } = await import("@/db/schema");
  return db
    .select({
      body: technicalLogEntries.body,
      createdAt: technicalLogEntries.createdAt,
      authorName: users.displayName,
    })
    .from(technicalLogEntries)
    .innerJoin(users, eq(users.id, technicalLogEntries.authorUserId))
    .where(
      inArray(
        technicalLogEntries.diagnosticId,
        diagRows.map((d) => d.id),
      ),
    )
    .orderBy(desc(technicalLogEntries.createdAt));
}
