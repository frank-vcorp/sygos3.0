import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { financialMovements } from "@/db/schema";
import { adjustAccountBalance } from "@/server/finance/accounts";
import { formatMovementFolio, nextFolioValue } from "@/server/masters/folios";

export async function listFinancialMovements(companyId: string, limit = 100) {
  const db = getDb();
  return db
    .select()
    .from(financialMovements)
    .where(eq(financialMovements.companyId, companyId))
    .orderBy(desc(financialMovements.occurredAt))
    .limit(limit);
}

export async function listPendingVerification(companyId: string) {
  const db = getDb();
  return db
    .select()
    .from(financialMovements)
    .where(
      and(
        eq(financialMovements.companyId, companyId),
        eq(financialMovements.pendingVerification, true),
      ),
    )
    .orderBy(desc(financialMovements.occurredAt));
}

async function insertMovement(params: {
  companyId: string;
  kind: (typeof financialMovements.$inferSelect)["kind"];
  accountId: string;
  counterAccountId?: string | null;
  amountMxn: number;
  category?: string;
  description: string;
  createdByUserId: string;
  paymentId?: string;
  directPurchaseId?: string;
  purchaseOrderId?: string;
  accountsPayableId?: string;
  pendingVerification?: boolean;
}) {
  const db = getDb();
  const folioNumber = await nextFolioValue(params.companyId, "MOV");
  const [row] = await db
    .insert(financialMovements)
    .values({
      companyId: params.companyId,
      folioNumber,
      kind: params.kind,
      accountId: params.accountId,
      counterAccountId: params.counterAccountId ?? null,
      amountMxn: params.amountMxn,
      category: params.category ?? null,
      description: params.description,
      paymentId: params.paymentId ?? null,
      directPurchaseId: params.directPurchaseId ?? null,
      purchaseOrderId: params.purchaseOrderId ?? null,
      accountsPayableId: params.accountsPayableId ?? null,
      pendingVerification: params.pendingVerification ?? false,
      createdByUserId: params.createdByUserId,
    })
    .returning();
  return { ...row, folio: formatMovementFolio(folioNumber) };
}

export async function recordIncome(params: {
  companyId: string;
  accountId: string;
  amountMxn: number;
  description: string;
  category?: string;
  createdByUserId: string;
  paymentId?: string;
}) {
  await adjustAccountBalance({
    accountId: params.accountId,
    companyId: params.companyId,
    deltaMxn: params.amountMxn,
  });
  return insertMovement({
    ...params,
    kind: "INGRESO",
  });
}

export async function recordExpense(params: {
  companyId: string;
  accountId: string;
  amountMxn: number;
  description: string;
  category?: string;
  createdByUserId: string;
  directPurchaseId?: string;
  purchaseOrderId?: string;
  accountsPayableId?: string;
  pendingVerification?: boolean;
}) {
  await adjustAccountBalance({
    accountId: params.accountId,
    companyId: params.companyId,
    deltaMxn: -params.amountMxn,
  });
  return insertMovement({
    ...params,
    kind: "EGRESO",
  });
}

export async function recordTransfer(params: {
  companyId: string;
  fromAccountId: string;
  toAccountId: string;
  amountMxn: number;
  description: string;
  createdByUserId: string;
}) {
  await adjustAccountBalance({
    accountId: params.fromAccountId,
    companyId: params.companyId,
    deltaMxn: -params.amountMxn,
  });
  await adjustAccountBalance({
    accountId: params.toAccountId,
    companyId: params.companyId,
    deltaMxn: params.amountMxn,
  });
  return insertMovement({
    companyId: params.companyId,
    kind: "TRANSFERENCIA",
    accountId: params.fromAccountId,
    counterAccountId: params.toAccountId,
    amountMxn: params.amountMxn,
    description: params.description,
    createdByUserId: params.createdByUserId,
  });
}

export async function regularizePendingVerification(params: {
  companyId: string;
  movementId: string;
  fiscalDocumentId: string;
}) {
  const db = getDb();
  const [updated] = await db
    .update(financialMovements)
    .set({
      pendingVerification: false,
      regularizedFiscalDocumentId: params.fiscalDocumentId,
    })
    .where(
      and(
        eq(financialMovements.id, params.movementId),
        eq(financialMovements.companyId, params.companyId),
      ),
    )
    .returning();
  return updated ?? null;
}
