import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { motors, serviceAttentions, workOrders } from "@/db/schema";
import { resolveCompanyIds } from "@/server/assets/context";
import type { CompanySlug } from "@/lib/company";
import { nextFolioValue, formatOsFolio } from "@/server/masters/folios";
import { getPrioritySnapshot } from "@/server/ops/priorities";
import { createDiagnosticForAttention } from "@/server/ops/diagnostics";
import { validateWarrantySourceWorkOrder } from "@/server/ops/warranty";
import { getTestSessionIdForRequest } from "@/server/test-mode/context";

export async function createServiceAttention(params: {
  activeSlug: CompanySlug;
  activeCompanyId: string;
  actorUserId: string;
  clientId: string;
  equiId?: string;
  motorId?: string;
  attentionType: "DIAGNOSTICO" | "REPARACION" | "DIAGNOSTICO_GARANTIA";
  reportedFailure: string;
  priorityCode: string;
  warrantySourceWorkOrderId?: string;
}) {
  if (!params.equiId && !params.motorId) {
    throw new Error("ASSET_REQUIRED");
  }
  if (
    params.attentionType === "DIAGNOSTICO_GARANTIA" &&
    params.warrantySourceWorkOrderId
  ) {
    await validateWarrantySourceWorkOrder({
      companyId: params.activeCompanyId,
      sourceWorkOrderId: params.warrantySourceWorkOrderId,
    });
  }

  const db = getDb();
  const testSessionId = await getTestSessionIdForRequest();
  const ids = await resolveCompanyIds();

  let executionCompanyId = params.activeCompanyId;
  let peerAttentionId: string | undefined;

  if (params.motorId && params.activeSlug === "SYSTRON") {
    const [motor] = await db
      .select()
      .from(motors)
      .where(eq(motors.id, params.motorId))
      .limit(1);
    if (motor?.origin === "SYSTRON") {
      executionCompanyId = ids.servomotoresId;
    }
  }

  const [systronAttention] = await db
    .insert(serviceAttentions)
    .values({
      companyId: params.activeCompanyId,
      clientId: params.clientId,
      equiId: params.equiId ?? null,
      motorId: params.motorId ?? null,
      attentionType: params.attentionType,
      reportedFailure: params.reportedFailure.trim(),
      priorityCode: params.priorityCode,
      warrantySourceWorkOrderId: params.warrantySourceWorkOrderId ?? null,
      testSessionId,
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  if (executionCompanyId !== params.activeCompanyId) {
    const [smAttention] = await db
      .insert(serviceAttentions)
      .values({
        companyId: executionCompanyId,
        clientId: params.clientId,
        equiId: null,
        motorId: params.motorId ?? null,
        attentionType: params.attentionType,
        reportedFailure: params.reportedFailure.trim(),
        priorityCode: params.priorityCode,
        warrantySourceWorkOrderId: params.warrantySourceWorkOrderId ?? null,
        peerAttentionId: systronAttention.id,
        testSessionId,
        createdByActorUserId: params.actorUserId,
      })
      .returning();
    await db
      .update(serviceAttentions)
      .set({ peerAttentionId: smAttention.id })
      .where(eq(serviceAttentions.id, systronAttention.id));
    peerAttentionId = smAttention.id;
  }

  const execAttentionId = peerAttentionId ?? systronAttention.id;

  if (
    params.attentionType === "DIAGNOSTICO" ||
    params.attentionType === "DIAGNOSTICO_GARANTIA"
  ) {
    const diagnostic = await createDiagnosticForAttention({
      companyId: executionCompanyId,
      attentionId: execAttentionId,
      attentionType: params.attentionType,
      priorityCode: params.priorityCode,
    });
    return { attention: systronAttention, diagnostic, executionCompanyId };
  }

  const catalog = "REPARACION" as const;
  const snap = await getPrioritySnapshot({
    companyId: executionCompanyId,
    catalog,
    code: params.priorityCode,
  });
  if (!snap) throw new Error("PRIORITY_INVALID");

  const folioNumber = await nextFolioValue(executionCompanyId, "OS");
  const [wo] = await db
    .insert(workOrders)
    .values({
      companyId: executionCompanyId,
      folioNumber,
      attentionId: execAttentionId,
      equiId: params.equiId ?? null,
      motorId: params.motorId ?? null,
      repairStatus: "EN_ESPERA",
      status: "OPEN",
      frozenPriorityLabel: snap.label,
      frozenIncrementPct: snap.incrementPct,
      frozenSlaMaxDays: snap.slaMaxDays,
      summary: params.reportedFailure.trim(),
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  return {
    attention: systronAttention,
    workOrder: { ...wo, folio: formatOsFolio(folioNumber) },
    executionCompanyId,
  };
}

export async function listAttentions(companyId: string, limit = 50) {
  const db = getDb();
  return db
    .select()
    .from(serviceAttentions)
    .where(eq(serviceAttentions.companyId, companyId))
    .orderBy(desc(serviceAttentions.createdAt))
    .limit(limit);
}
