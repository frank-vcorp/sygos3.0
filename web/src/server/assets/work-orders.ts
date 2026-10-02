import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  equiUnits,
  motors,
  sparePartRequests,
  users,
  workOrders,
} from "@/db/schema";
import { formatOsFolio, nextFolioValue } from "@/server/masters/folios";

const ACTIVE_REPAIR_STATUSES: (typeof workOrders.$inferSelect)["repairStatus"][] =
  ["EN_ESPERA", "EN_REPARACION", "EN_ESPERA_REFACCIONES"];

export async function listWorkOrdersForPanel(params: {
  companyId: string;
  assignedUserId?: string;
  unassignedOnly?: boolean;
  repairStatus?: (typeof workOrders.$inferSelect)["repairStatus"][];
  activeOnly?: boolean;
  limit?: number;
}) {
  const db = getDb();
  const conditions = [eq(workOrders.companyId, params.companyId)];
  if (params.assignedUserId) {
    conditions.push(eq(workOrders.assignedUserId, params.assignedUserId));
  }
  if (params.unassignedOnly) {
    conditions.push(isNull(workOrders.assignedUserId));
  }
  if (params.repairStatus?.length) {
    conditions.push(inArray(workOrders.repairStatus, params.repairStatus));
  }
  if (params.activeOnly) {
    conditions.push(inArray(workOrders.repairStatus, ACTIVE_REPAIR_STATUSES));
  }

  const rows = await db
    .select({
      id: workOrders.id,
      folioNumber: workOrders.folioNumber,
      repairStatus: workOrders.repairStatus,
      summary: workOrders.summary,
      assignedName: users.displayName,
    })
    .from(workOrders)
    .leftJoin(users, eq(users.id, workOrders.assignedUserId))
    .where(and(...conditions))
    .orderBy(desc(workOrders.updatedAt))
    .limit(params.limit ?? 80);

  return rows.map((r) => ({
    ...r,
    folio: formatOsFolio(r.folioNumber),
  }));
}

export async function listWorkOrders(companyId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.companyId, companyId))
    .orderBy(desc(workOrders.createdAt));
  return rows.map((r) => ({
    ...r,
    folio: formatOsFolio(r.folioNumber),
    repairStatus: r.repairStatus,
  }));
}

export async function updateWorkOrderRepair(params: {
  companyId: string;
  workOrderId: string;
  patch: Partial<{
    repairStatus: (typeof workOrders.$inferSelect)["repairStatus"];
    assignedUserId: string;
    technicalResult: string;
  }>;
}) {
  const db = getDb();
  const [updated] = await db
    .update(workOrders)
    .set({ ...params.patch, updatedAt: new Date() })
    .where(
      and(
        eq(workOrders.id, params.workOrderId),
        eq(workOrders.companyId, params.companyId),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function getWorkOrder(companyId: string, workOrderId: string) {
  const db = getDb();
  const [wo] = await db
    .select()
    .from(workOrders)
    .where(
      and(eq(workOrders.id, workOrderId), eq(workOrders.companyId, companyId)),
    )
    .limit(1);
  if (!wo) return null;
  const requests = await db
    .select()
    .from(sparePartRequests)
    .where(eq(sparePartRequests.workOrderId, workOrderId))
    .orderBy(desc(sparePartRequests.createdAt));
  return { workOrder: { ...wo, folio: formatOsFolio(wo.folioNumber) }, requests };
}

export async function createWorkOrder(params: {
  companyId: string;
  actorUserId: string;
  equiId?: string;
  motorId?: string;
  summary?: string;
}) {
  if (!params.equiId && !params.motorId) {
    throw new Error("ASSET_REQUIRED");
  }
  const db = getDb();
  if (params.equiId) {
    const [e] = await db
      .select()
      .from(equiUnits)
      .where(
        and(eq(equiUnits.id, params.equiId), eq(equiUnits.companyId, params.companyId)),
      )
      .limit(1);
    if (!e) throw new Error("EQUI_INVALID");
  }
  const folioNumber = await nextFolioValue(params.companyId, "OS");
  const [inserted] = await db
    .insert(workOrders)
    .values({
      companyId: params.companyId,
      folioNumber,
      equiId: params.equiId ?? null,
      motorId: params.motorId ?? null,
      summary: params.summary?.trim() || null,
      createdByActorUserId: params.actorUserId,
    })
    .returning();
  return { ...inserted, folio: formatOsFolio(folioNumber) };
}

export async function createSparePartRequest(params: {
  companyId: string;
  workOrderId: string;
  actorUserId: string;
  partNumber: string;
  description: string;
  quantityRequested: number;
  linkUrl?: string;
}) {
  const db = getDb();
  const [wo] = await db
    .select()
    .from(workOrders)
    .where(
      and(
        eq(workOrders.id, params.workOrderId),
        eq(workOrders.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!wo) return null;

  await db
    .update(workOrders)
    .set({ repairStatus: "EN_ESPERA_REFACCIONES", updatedAt: new Date() })
    .where(eq(workOrders.id, params.workOrderId));

  const [inserted] = await db
    .insert(sparePartRequests)
    .values({
      companyId: params.companyId,
      workOrderId: params.workOrderId,
      partNumber: params.partNumber.trim(),
      description: params.description.trim(),
      quantityRequested: params.quantityRequested,
      linkUrl: params.linkUrl?.trim() || null,
      createdByActorUserId: params.actorUserId,
    })
    .returning();
  return inserted;
}

export async function fulfillSparePartRequest(params: {
  companyId: string;
  requestId: string;
  quantity: number;
}) {
  const db = getDb();
  const [req] = await db
    .select()
    .from(sparePartRequests)
    .where(
      and(
        eq(sparePartRequests.id, params.requestId),
        eq(sparePartRequests.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!req) return null;
  const newFulfilled = req.quantityFulfilled + params.quantity;
  let status = req.status;
  if (newFulfilled >= req.quantityRequested) status = "SURTIDA";
  else if (newFulfilled > 0) status = "EN_ALMACEN";

  const [updated] = await db
    .update(sparePartRequests)
    .set({
      quantityFulfilled: newFulfilled,
      status,
      updatedAt: new Date(),
    })
    .where(eq(sparePartRequests.id, params.requestId))
    .returning();

  if (updated) {
    const pending = await db
      .select()
      .from(sparePartRequests)
      .where(eq(sparePartRequests.workOrderId, req.workOrderId));
    const allServed = pending.every((p) => p.status === "SURTIDA");
    if (allServed) {
      await db
        .update(workOrders)
        .set({ repairStatus: "EN_REPARACION", updatedAt: new Date() })
        .where(eq(workOrders.id, req.workOrderId));
    }
  }
  return updated;
}

export async function resolveWorkOrderId(
  companyId: string,
  ref: string,
): Promise<string | null> {
  const trimmed = ref.trim();
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRe.test(trimmed)) return trimmed;
  const m = trimmed.match(/^OS-(\d+)$/i);
  if (!m) return null;
  const folioNumber = Number(m[1]);
  const db = getDb();
  const [wo] = await db
    .select({ id: workOrders.id })
    .from(workOrders)
    .where(
      and(
        eq(workOrders.companyId, companyId),
        eq(workOrders.folioNumber, folioNumber),
      ),
    )
    .limit(1);
  return wo?.id ?? null;
}
