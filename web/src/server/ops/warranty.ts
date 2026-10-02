import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  diagnostics,
  serviceAttentions,
  workOrders,
} from "@/db/schema";

const WARRANTY_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

export function isWithinWarrantyPeriod(exitAt: Date | null | undefined): boolean {
  if (!exitAt) return false;
  return Date.now() - exitAt.getTime() <= WARRANTY_MONTHS_MS;
}

export async function validateWarrantySourceWorkOrder(params: {
  companyId: string;
  sourceWorkOrderId: string;
}) {
  const db = getDb();
  const [wo] = await db
    .select()
    .from(workOrders)
    .where(
      and(
        eq(workOrders.id, params.sourceWorkOrderId),
        eq(workOrders.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!wo) throw new Error("WARRANTY_SOURCE_NOT_FOUND");
  if (!wo.paidPhysicalExitAt) {
    throw new Error("WARRANTY_SOURCE_NO_PAID_EXIT");
  }
  if (!isWithinWarrantyPeriod(wo.paidPhysicalExitAt)) {
    throw new Error("WARRANTY_EXPIRED");
  }
  return wo;
}

export function effectiveWarrantyIsValid(diag: typeof diagnostics.$inferSelect) {
  if (diag.warrantyDecision === "GARANTIA_VALIDA") return true;
  if (
    diag.warrantyDecision === "GARANTIA_NO_PROCEDENTE" &&
    diag.warrantyCommercialOverride
  ) {
    return true;
  }
  return false;
}

export async function applyCommercialWarrantyOverride(params: {
  companyId: string;
  diagnosticId: string;
  actorUserId: string;
}) {
  const db = getDb();
  const [diag] = await db
    .select()
    .from(diagnostics)
    .where(
      and(
        eq(diagnostics.id, params.diagnosticId),
        eq(diagnostics.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!diag || diag.warrantyDecision !== "GARANTIA_NO_PROCEDENTE") {
    throw new Error("INVALID_WARRANTY_STATE");
  }
  const [updated] = await db
    .update(diagnostics)
    .set({
      warrantyCommercialOverride: true,
      warrantyCommercialOverrideByUserId: params.actorUserId,
      warrantyCommercialOverrideAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(diagnostics.id, params.diagnosticId))
    .returning();
  if (updated) {
    const { logFunctionalHistory } = await import("@/server/history/functional");
    await logFunctionalHistory({
      companyId: params.companyId,
      entityType: "diagnostic",
      entityId: params.diagnosticId,
      action: "GARANTIA_OVERRIDE_CEO",
      actorUserId: params.actorUserId,
    });
  }
  return updated;
}

export async function syncWarrantyDecisionToPeer(params: {
  diagnosticId: string;
  companyId: string;
}) {
  const db = getDb();
  const [diag] = await db
    .select()
    .from(diagnostics)
    .where(eq(diagnostics.id, params.diagnosticId))
    .limit(1);
  if (!diag?.warrantyDecision) return;

  const [attention] = await db
    .select()
    .from(serviceAttentions)
    .where(eq(serviceAttentions.id, diag.attentionId))
    .limit(1);
  if (!attention?.peerAttentionId) return;

  const [peerAttention] = await db
    .select()
    .from(serviceAttentions)
    .where(eq(serviceAttentions.id, attention.peerAttentionId))
    .limit(1);
  if (!peerAttention) return;

  const [peerDiag] = await db
    .select()
    .from(diagnostics)
    .where(eq(diagnostics.attentionId, peerAttention.id))
    .limit(1);
  if (!peerDiag) return;

  await db
    .update(diagnostics)
    .set({
      warrantyDecision: diag.warrantyDecision,
      warrantyCommercialOverride: diag.warrantyCommercialOverride,
      warrantyCommercialOverrideByUserId: diag.warrantyCommercialOverrideByUserId,
      warrantyCommercialOverrideAt: diag.warrantyCommercialOverrideAt,
      updatedAt: new Date(),
    })
    .where(eq(diagnostics.id, peerDiag.id));
}

export async function createWarrantyRepairWorkOrder(params: {
  companyId: string;
  diagnosticId: string;
  actorUserId: string;
}) {
  const db = getDb();
  const [diag] = await db
    .select()
    .from(diagnostics)
    .where(
      and(
        eq(diagnostics.id, params.diagnosticId),
        eq(diagnostics.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!diag || diag.status !== "VALIDADO") throw new Error("INVALID_DIAGNOSTIC");
  const [attention] = await db
    .select()
    .from(serviceAttentions)
    .where(eq(serviceAttentions.id, diag.attentionId))
    .limit(1);
  if (attention?.attentionType !== "DIAGNOSTICO_GARANTIA") {
    throw new Error("NOT_WARRANTY");
  }
  if (!effectiveWarrantyIsValid(diag)) throw new Error("WARRANTY_NOT_VALID");

  const { nextFolioValue, formatOsFolio } = await import("@/server/masters/folios");
  const folioNumber = await nextFolioValue(params.companyId, "OS");
  const [wo] = await db
    .insert(workOrders)
    .values({
      companyId: params.companyId,
      folioNumber,
      attentionId: attention.id,
      diagnosticId: diag.id,
      equiId: attention.equiId,
      motorId: attention.motorId,
      repairStatus: "EN_ESPERA",
      status: "OPEN",
      isWarrantyRepair: true,
      frozenPriorityLabel: diag.frozenPriorityLabel,
      frozenIncrementPct: diag.frozenIncrementPct,
      frozenSlaMaxDays: diag.frozenSlaMaxDays,
      createdByActorUserId: params.actorUserId,
      summary: "Reparación en garantía",
    })
    .returning();
  return { ...wo, folio: formatOsFolio(folioNumber) };
}

export async function listWarrantyCeoPending(companyId: string) {
  const db = getDb();
  const rows = await db
    .select({
      diagnostic: diagnostics,
      attention: serviceAttentions,
    })
    .from(diagnostics)
    .innerJoin(
      serviceAttentions,
      eq(serviceAttentions.id, diagnostics.attentionId),
    )
    .where(
      and(
        eq(diagnostics.companyId, companyId),
        eq(serviceAttentions.attentionType, "DIAGNOSTICO_GARANTIA"),
        eq(diagnostics.status, "VALIDADO"),
        eq(diagnostics.warrantyDecision, "GARANTIA_NO_PROCEDENTE"),
        eq(diagnostics.warrantyCommercialOverride, false),
      ),
    );
  return rows;
}
