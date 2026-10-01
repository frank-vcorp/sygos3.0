import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  equiUnits,
  motors,
  sparePartRequests,
  workOrders,
} from "@/db/schema";
import { formatOsFolio, nextFolioValue } from "@/server/masters/folios";

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
  }));
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
  return updated;
}
