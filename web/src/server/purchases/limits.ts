import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  companySettings,
  directPurchases,
  users,
} from "@/db/schema";

export function currentBudgetMonthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function getManagerPurchaseLimits(params: {
  companyId: string;
  userId: string;
}) {
  const db = getDb();
  const [settings] = await db
    .select()
    .from(companySettings)
    .where(eq(companySettings.companyId, params.companyId))
    .limit(1);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, params.userId))
    .limit(1);
  return {
    monthlyMxn:
      user?.directPurchaseMonthlyLimitMxn ??
      settings?.directPurchaseMonthlyLimitMxn ??
      5000,
    individualMxn:
      user?.directPurchaseIndividualLimitMxn ??
      settings?.directPurchaseIndividualLimitMxn ??
      2000,
  };
}

export async function getDirectPurchaseMonthConsumed(params: {
  companyId: string;
  userId: string;
  monthKey: string;
  excludePurchaseId?: string;
}) {
  const db = getDb();
  const conditions = [
    eq(directPurchases.companyId, params.companyId),
    eq(directPurchases.registeredByUserId, params.userId),
    eq(directPurchases.budgetMonthKey, params.monthKey),
    inArray(directPurchases.status, [
      "REGISTRADA",
      "PENDIENTE_VALIDAR",
      "PROCESADA",
    ]),
  ];
  const rows = await db
    .select({ total: sql<number>`coalesce(sum(${directPurchases.amountMxn}), 0)` })
    .from(directPurchases)
    .where(and(...conditions));
  let total = Number(rows[0]?.total ?? 0);
  if (params.excludePurchaseId) {
    const [ex] = await db
      .select({ amountMxn: directPurchases.amountMxn })
      .from(directPurchases)
      .where(eq(directPurchases.id, params.excludePurchaseId))
      .limit(1);
    if (ex) total -= ex.amountMxn;
  }
  return Math.max(0, total);
}

export async function assertDirectPurchaseWithinLimits(params: {
  companyId: string;
  userId: string;
  amountMxn: number;
  excludePurchaseId?: string;
}) {
  const limits = await getManagerPurchaseLimits(params);
  if (params.amountMxn > limits.individualMxn) {
    throw new Error("INDIVIDUAL_LIMIT");
  }
  const monthKey = currentBudgetMonthKey();
  const consumed = await getDirectPurchaseMonthConsumed({
    companyId: params.companyId,
    userId: params.userId,
    monthKey,
    excludePurchaseId: params.excludePurchaseId,
  });
  if (consumed + params.amountMxn > limits.monthlyMxn) {
    throw new Error("MONTHLY_LIMIT");
  }
}
