import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { accountsPayable, suppliers } from "@/db/schema";

export async function createPayableFromPurchase(params: {
  companyId: string;
  supplierId: string;
  amountMxn: number;
  description: string;
  directPurchaseId?: string;
  purchaseOrderId?: string;
  motorId?: string | null;
  pendingVerification?: boolean;
}) {
  const db = getDb();
  const [supplier] = await db
    .select({ creditDays: suppliers.creditDays })
    .from(suppliers)
    .where(eq(suppliers.id, params.supplierId))
    .limit(1);
  let dueDate: Date | null = null;
  if (supplier?.creditDays != null) {
    dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + supplier.creditDays);
  }
  const [ap] = await db
    .insert(accountsPayable)
    .values({
      companyId: params.companyId,
      supplierId: params.supplierId,
      originalMxn: params.amountMxn,
      balanceMxn: params.amountMxn,
      dueDate,
      status: "ABIERTA",
      directPurchaseId: params.directPurchaseId ?? null,
      purchaseOrderId: params.purchaseOrderId ?? null,
      motorId: params.motorId ?? null,
      description: params.description,
      pendingVerification: params.pendingVerification ?? false,
    })
    .returning();
  return ap;
}

export async function payAccountsPayable(params: {
  companyId: string;
  apEntryId: string;
  amountMxn: number;
  accountId: string;
  actorUserId: string;
  description: string;
}) {
  const { applyPaymentToPayable } = await import("@/server/billing/ar-ap");
  const { recordExpense } = await import("@/server/finance/movements");
  const ap = await applyPaymentToPayable({
    apEntryId: params.apEntryId,
    amountMxn: params.amountMxn,
  });
  if (!ap) throw new Error("AP_NOT_FOUND");
  await recordExpense({
    companyId: params.companyId,
    accountId: params.accountId,
    amountMxn: params.amountMxn,
    description: params.description,
    category: "CxP",
    createdByUserId: params.actorUserId,
    accountsPayableId: params.apEntryId,
  });
  return ap;
}
