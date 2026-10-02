import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { purchaseOrders, suppliers, users } from "@/db/schema";
import { createPayableFromPurchase } from "@/server/finance/payables";
import { ensureDefaultFinancialAccounts } from "@/server/finance/accounts";
import { recordExpense } from "@/server/finance/movements";
import {
  formatPurchaseOrderFolio,
  nextFolioValue,
} from "@/server/masters/folios";
import type { UserRole } from "@/db/schema";

function initialPoStatus(creatorRole: UserRole) {
  return creatorRole === "CEO" ? "PENDIENTE_PROCESAR" : "PENDIENTE_AUTORIZACION";
}

export async function listPurchaseOrders(
  companyId: string,
  opts?: { pendingCeoOnly?: boolean },
) {
  const db = getDb();
  const conditions = [eq(purchaseOrders.companyId, companyId)];
  if (opts?.pendingCeoOnly) {
    conditions.push(eq(purchaseOrders.status, "PENDIENTE_AUTORIZACION"));
  }
  return db
    .select({
      order: purchaseOrders,
      supplierName: suppliers.legalName,
      requesterName: users.displayName,
    })
    .from(purchaseOrders)
    .leftJoin(suppliers, eq(suppliers.id, purchaseOrders.supplierId))
    .innerJoin(users, eq(users.id, purchaseOrders.requestedByUserId))
    .where(and(...conditions))
    .orderBy(desc(purchaseOrders.createdAt));
}

export async function getPurchaseOrder(companyId: string, id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(purchaseOrders)
    .where(
      and(eq(purchaseOrders.id, id), eq(purchaseOrders.companyId, companyId)),
    )
    .limit(1);
  return row ?? null;
}

export async function createPurchaseOrder(params: {
  companyId: string;
  requestedByUserId: string;
  creatorRole: UserRole;
  supplierId?: string;
  concept: string;
  authorizedAmountMxn: number;
  paymentTerms: (typeof purchaseOrders.$inferSelect)["paymentTerms"];
  destinationKind: (typeof purchaseOrders.$inferSelect)["destinationKind"];
  workOrderId?: string;
  motorId?: string;
  shippingReference?: string;
}) {
  const status = initialPoStatus(params.creatorRole);
  const folioNumber = await nextFolioValue(params.companyId, "OC");
  const db = getDb();
  const [row] = await db
    .insert(purchaseOrders)
    .values({
      companyId: params.companyId,
      folioNumber,
      status,
      supplierId: params.supplierId ?? null,
      concept: params.concept.trim(),
      authorizedAmountMxn: params.authorizedAmountMxn,
      paymentTerms: params.paymentTerms,
      destinationKind: params.destinationKind,
      workOrderId: params.workOrderId ?? null,
      motorId: params.motorId ?? null,
      shippingReference: params.shippingReference?.trim() ?? null,
      requestedByUserId: params.requestedByUserId,
      authorizedByUserId:
        status === "PENDIENTE_PROCESAR" ? params.requestedByUserId : null,
      authorizedAt: status === "PENDIENTE_PROCESAR" ? new Date() : null,
    })
    .returning();
  return { ...row, folio: formatPurchaseOrderFolio(folioNumber) };
}

export async function authorizePurchaseOrder(params: {
  companyId: string;
  orderId: string;
  approverUserId: string;
}) {
  const db = getDb();
  const [updated] = await db
    .update(purchaseOrders)
    .set({
      status: "PENDIENTE_PROCESAR",
      authorizedByUserId: params.approverUserId,
      authorizedAt: new Date(),
      rejectionReason: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(purchaseOrders.id, params.orderId),
        eq(purchaseOrders.companyId, params.companyId),
        eq(purchaseOrders.status, "PENDIENTE_AUTORIZACION"),
      ),
    )
    .returning();
  if (!updated) throw new Error("INVALID_STATUS");
  return updated;
}

export async function rejectPurchaseOrder(params: {
  companyId: string;
  orderId: string;
  reason: string;
}) {
  const db = getDb();
  const [updated] = await db
    .update(purchaseOrders)
    .set({
      status: "RECHAZADA",
      rejectionReason: params.reason.trim(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(purchaseOrders.id, params.orderId),
        eq(purchaseOrders.companyId, params.companyId),
        eq(purchaseOrders.status, "PENDIENTE_AUTORIZACION"),
      ),
    )
    .returning();
  if (!updated) throw new Error("INVALID_STATUS");
  return updated;
}

export async function cancelPurchaseOrder(params: {
  companyId: string;
  orderId: string;
  reason: string;
}) {
  const db = getDb();
  const [updated] = await db
    .update(purchaseOrders)
    .set({
      status: "CANCELADA",
      cancellationReason: params.reason.trim(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(purchaseOrders.id, params.orderId),
        eq(purchaseOrders.companyId, params.companyId),
        eq(purchaseOrders.status, "PENDIENTE_PROCESAR"),
      ),
    )
    .returning();
  if (!updated) throw new Error("INVALID_STATUS");
  return updated;
}

export async function requestReauthorization(params: {
  companyId: string;
  orderId: string;
  authorizedAmountMxn?: number;
  supplierId?: string;
  concept?: string;
}) {
  const existing = await getPurchaseOrder(params.companyId, params.orderId);
  if (
    !existing ||
    !["PENDIENTE_PROCESAR", "AUTORIZADA"].includes(existing.status)
  ) {
    throw new Error("INVALID_STATUS");
  }
  const db = getDb();
  const [updated] = await db
    .update(purchaseOrders)
    .set({
      status: "PENDIENTE_AUTORIZACION",
      authorizedAmountMxn:
        params.authorizedAmountMxn ?? existing.authorizedAmountMxn,
      supplierId: params.supplierId ?? existing.supplierId,
      concept: params.concept?.trim() ?? existing.concept,
      authorizedByUserId: null,
      authorizedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(purchaseOrders.id, params.orderId))
    .returning();
  return updated;
}

export async function processPurchaseOrder(params: {
  companyId: string;
  orderId: string;
  processorUserId: string;
  accountId: string;
  actualAmountMxn: number;
}) {
  const existing = await getPurchaseOrder(params.companyId, params.orderId);
  if (!existing || existing.status !== "PENDIENTE_PROCESAR") {
    throw new Error("INVALID_STATUS");
  }
  if (!existing.supplierId) throw new Error("MISSING_SUPPLIER");

  const db = getDb();
  await ensureDefaultFinancialAccounts(params.companyId);

  if (existing.paymentTerms === "CREDITO") {
    const ap = await createPayableFromPurchase({
      companyId: params.companyId,
      supplierId: existing.supplierId,
      amountMxn: params.actualAmountMxn,
      description: existing.concept,
      purchaseOrderId: existing.id,
      motorId: existing.motorId,
    });
    const [updated] = await db
      .update(purchaseOrders)
      .set({
        status: "PROCESADA",
        accountsPayableId: ap.id,
        processedByUserId: params.processorUserId,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrders.id, existing.id))
      .returning();
    return updated;
  }

  const movement = await recordExpense({
    companyId: params.companyId,
    accountId: params.accountId,
    amountMxn: params.actualAmountMxn,
    description: `O.C.: ${existing.concept}`,
    category: "Orden de compra",
    createdByUserId: params.processorUserId,
    purchaseOrderId: existing.id,
  });

  const [updated] = await db
    .update(purchaseOrders)
    .set({
      status: "PROCESADA",
      financialMovementId: movement.id,
      processedByUserId: params.processorUserId,
      processedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(purchaseOrders.id, existing.id))
    .returning();
  return updated;
}

export async function listCeoPendingPurchaseOrders(companyId: string) {
  const db = getDb();
  return db
    .select()
    .from(purchaseOrders)
    .where(
      and(
        eq(purchaseOrders.companyId, companyId),
        eq(purchaseOrders.status, "PENDIENTE_AUTORIZACION"),
      ),
    )
    .orderBy(desc(purchaseOrders.createdAt));
}
