import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  equiUnits,
  motors,
  physicalMovements,
  workOrders,
} from "@/db/schema";
import { startSlaForAttentionAsset } from "@/server/ops/diagnostics";

export async function listPhysicalMovements(params: {
  companyId: string;
  entityType?: "EQUI" | "MOT";
  entityId?: string;
}) {
  const db = getDb();
  const conditions = [eq(physicalMovements.companyId, params.companyId)];
  if (params.entityType) {
    conditions.push(eq(physicalMovements.entityType, params.entityType));
  }
  if (params.entityId) {
    conditions.push(eq(physicalMovements.entityId, params.entityId));
  }
  return db
    .select()
    .from(physicalMovements)
    .where(and(...conditions))
    .orderBy(desc(physicalMovements.occurredAt));
}

export async function confirmEquiMovement(params: {
  companyId: string;
  equiId: string;
  actorUserId: string;
  movementType: "ENTRY" | "EXIT" | "TRIAL_OUT" | "TRIAL_RETURN" | "DEFINITIVE_EXIT";
  motive?: string;
  receiverName?: string;
  receiverNotes?: string;
  enablingDocumentRef?: string;
}) {
  const db = getDb();
  const [equi] = await db
    .select()
    .from(equiUnits)
    .where(and(eq(equiUnits.id, params.equiId), eq(equiUnits.companyId, params.companyId)))
    .limit(1);
  if (!equi) return { error: "EQUI no encontrado." as const };

  let nextStatus = equi.custodyStatus;
  if (params.movementType === "ENTRY" || params.movementType === "TRIAL_RETURN") {
    nextStatus = "IN_CUSTODY";
  } else if (params.movementType === "TRIAL_OUT") {
    nextStatus = "TRIAL_OUT";
  } else if (
    params.movementType === "EXIT" ||
    params.movementType === "DEFINITIVE_EXIT"
  ) {
    nextStatus = "OUT";
  }

  await db.insert(physicalMovements).values({
    companyId: params.companyId,
    entityType: "EQUI",
    entityId: params.equiId,
    movementType: params.movementType,
    motive: params.motive?.trim() || null,
    receiverName: params.receiverName?.trim() || null,
    receiverNotes: params.receiverNotes?.trim() || null,
    enablingDocumentRef: params.enablingDocumentRef?.trim() || null,
    performedByActorUserId: params.actorUserId,
  });

  await db
    .update(equiUnits)
    .set({ custodyStatus: nextStatus, updatedAt: new Date() })
    .where(eq(equiUnits.id, params.equiId));

  if (params.movementType === "ENTRY" || params.movementType === "TRIAL_RETURN") {
    await startSlaForAttentionAsset({ equiId: params.equiId });
  }

  if (params.movementType === "DEFINITIVE_EXIT") {
    const now = new Date();
    await db
      .update(workOrders)
      .set({ paidPhysicalExitAt: now, updatedAt: now })
      .where(
        and(
          eq(workOrders.companyId, params.companyId),
          eq(workOrders.equiId, params.equiId),
        ),
      );
  }

  return { ok: true as const };
}

export async function confirmMotorCustodyMovement(params: {
  servomotoresCompanyId: string;
  motorId: string;
  actorUserId: string;
  movementType: "INGRESO" | "EGRESO" | "TRIAL_OUT" | "TRIAL_RETURN" | "DEFINITIVE_EXIT";
  motive?: string;
  receiverName?: string;
  receiverNotes?: string;
  enablingDocumentRef?: string;
}) {
  const db = getDb();
  const [motor] = await db
    .select()
    .from(motors)
    .where(eq(motors.id, params.motorId))
    .limit(1);
  if (!motor) return { error: "MOT no encontrado." as const };

  let nextStatus = motor.servomotoresIntakeStatus;
  if (params.movementType === "INGRESO" || params.movementType === "TRIAL_RETURN") {
    nextStatus = "IN_CUSTODY";
  } else if (params.movementType === "TRIAL_OUT") {
    nextStatus = "TRIAL_OUT";
  } else if (
    params.movementType === "EGRESO" ||
    params.movementType === "DEFINITIVE_EXIT"
  ) {
    nextStatus = "OUT";
  }

  await db.insert(physicalMovements).values({
    companyId: params.servomotoresCompanyId,
    entityType: "MOT",
    entityId: params.motorId,
    movementType: params.movementType,
    motive: params.motive?.trim() || null,
    receiverName: params.receiverName?.trim() || null,
    receiverNotes: params.receiverNotes?.trim() || null,
    enablingDocumentRef: params.enablingDocumentRef?.trim() || null,
    performedByActorUserId: params.actorUserId,
  });

  await db
    .update(motors)
    .set({ servomotoresIntakeStatus: nextStatus, updatedAt: new Date() })
    .where(eq(motors.id, params.motorId));

  if (params.movementType === "INGRESO" || params.movementType === "TRIAL_RETURN") {
    await startSlaForAttentionAsset({ motorId: params.motorId });
  }

  return { ok: true as const };
}
