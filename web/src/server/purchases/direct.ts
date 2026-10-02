import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { directPurchases, suppliers } from "@/db/schema";
import { createPayableFromPurchase } from "@/server/finance/payables";
import { ensureDefaultFinancialAccounts } from "@/server/finance/accounts";
import { recordExpense } from "@/server/finance/movements";
import {
  assertDirectPurchaseWithinLimits,
  currentBudgetMonthKey,
} from "@/server/purchases/limits";
import {
  formatDirectPurchaseFolio,
  nextFolioValue,
} from "@/server/masters/folios";

export async function listDirectPurchases(companyId: string) {
  const db = getDb();
  return db
    .select({
      purchase: directPurchases,
      supplierName: suppliers.legalName,
    })
    .from(directPurchases)
    .leftJoin(suppliers, eq(suppliers.id, directPurchases.supplierId))
    .where(eq(directPurchases.companyId, companyId))
    .orderBy(desc(directPurchases.createdAt));
}

export async function getDirectPurchase(companyId: string, id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(directPurchases)
    .where(
      and(eq(directPurchases.id, id), eq(directPurchases.companyId, companyId)),
    )
    .limit(1);
  return row ?? null;
}

export async function registerDirectPurchase(params: {
  companyId: string;
  registeredByUserId: string;
  supplierId?: string;
  concept: string;
  amountMxn: number;
  paymentTerms: (typeof directPurchases.$inferSelect)["paymentTerms"];
  destinationKind: (typeof directPurchases.$inferSelect)["destinationKind"];
  workOrderId?: string;
  motorId?: string;
  shippingReference?: string;
}) {
  await assertDirectPurchaseWithinLimits({
    companyId: params.companyId,
    userId: params.registeredByUserId,
    amountMxn: params.amountMxn,
  });
  const folioNumber = await nextFolioValue(params.companyId, "CD");
  const db = getDb();
  const [row] = await db
    .insert(directPurchases)
    .values({
      companyId: params.companyId,
      folioNumber,
      status: "PENDIENTE_VALIDAR",
      supplierId: params.supplierId ?? null,
      concept: params.concept.trim(),
      amountMxn: params.amountMxn,
      paymentTerms: params.paymentTerms,
      destinationKind: params.destinationKind,
      workOrderId: params.workOrderId ?? null,
      motorId: params.motorId ?? null,
      shippingReference: params.shippingReference?.trim() ?? null,
      budgetMonthKey: currentBudgetMonthKey(),
      registeredByUserId: params.registeredByUserId,
    })
    .returning();
  return { ...row, folio: formatDirectPurchaseFolio(folioNumber) };
}

export async function updateDirectPurchase(params: {
  companyId: string;
  purchaseId: string;
  editorUserId: string;
  supplierId?: string;
  concept?: string;
  amountMxn?: number;
  paymentTerms?: (typeof directPurchases.$inferSelect)["paymentTerms"];
}) {
  const existing = await getDirectPurchase(params.companyId, params.purchaseId);
  if (!existing || existing.status === "PROCESADA") {
    throw new Error("INVALID_STATUS");
  }
  const amountMxn = params.amountMxn ?? existing.amountMxn;
  await assertDirectPurchaseWithinLimits({
    companyId: params.companyId,
    userId: existing.registeredByUserId,
    amountMxn,
    excludePurchaseId: existing.id,
  });
  const db = getDb();
  const [updated] = await db
    .update(directPurchases)
    .set({
      supplierId: params.supplierId ?? existing.supplierId,
      concept: params.concept?.trim() ?? existing.concept,
      amountMxn,
      paymentTerms: params.paymentTerms ?? existing.paymentTerms,
      updatedAt: new Date(),
    })
    .where(eq(directPurchases.id, params.purchaseId))
    .returning();
  return updated;
}

export async function deleteDirectPurchase(params: {
  companyId: string;
  purchaseId: string;
}) {
  const existing = await getDirectPurchase(params.companyId, params.purchaseId);
  if (!existing || existing.status === "PROCESADA") {
    throw new Error("INVALID_STATUS");
  }
  const db = getDb();
  await db
    .delete(directPurchases)
    .where(eq(directPurchases.id, params.purchaseId));
}

export async function processDirectPurchase(params: {
  companyId: string;
  purchaseId: string;
  processorUserId: string;
  accountId: string;
}) {
  const existing = await getDirectPurchase(params.companyId, params.purchaseId);
  if (!existing || existing.status !== "PENDIENTE_VALIDAR") {
    throw new Error("INVALID_STATUS");
  }
  if (!existing.supplierId) throw new Error("MISSING_SUPPLIER");

  const db = getDb();
  await ensureDefaultFinancialAccounts(params.companyId);

  if (existing.paymentTerms === "CREDITO") {
    const ap = await createPayableFromPurchase({
      companyId: params.companyId,
      supplierId: existing.supplierId,
      amountMxn: existing.amountMxn,
      description: existing.concept,
      directPurchaseId: existing.id,
      motorId: existing.motorId,
    });
    const [updated] = await db
      .update(directPurchases)
      .set({
        status: "PROCESADA",
        accountsPayableId: ap.id,
        processedByUserId: params.processorUserId,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(directPurchases.id, existing.id))
      .returning();
    return updated;
  }

  const movement = await recordExpense({
    companyId: params.companyId,
    accountId: params.accountId,
    amountMxn: existing.amountMxn,
    description: `Compra directa: ${existing.concept}`,
    category: "Compra directa",
    createdByUserId: params.processorUserId,
    directPurchaseId: existing.id,
  });

  const [updated] = await db
    .update(directPurchases)
    .set({
      status: "PROCESADA",
      financialMovementId: movement.id,
      processedByUserId: params.processorUserId,
      processedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(directPurchases.id, existing.id))
    .returning();
  return updated;
}
