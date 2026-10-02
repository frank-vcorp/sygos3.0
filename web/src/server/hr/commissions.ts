import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { commissionAccruals, quotes } from "@/db/schema";

export async function accrueCommissionFromQuote(params: {
  companyId: string;
  quoteId: string;
  vendorUserId: string;
  amountMxn: number;
  quoteTotalMxn: number;
  ratePercent?: number;
  periodKey?: string;
}) {
  const periodKey = params.periodKey ?? new Date().toISOString().slice(0, 7);
  const ratePercent = params.ratePercent ?? 3;
  const db = getDb();
  const [existing] = await db
    .select({ id: commissionAccruals.id })
    .from(commissionAccruals)
    .where(eq(commissionAccruals.quoteId, params.quoteId))
    .limit(1);
  if (existing) return existing;

  const [row] = await db
    .insert(commissionAccruals)
    .values({
      companyId: params.companyId,
      vendorUserId: params.vendorUserId,
      quoteId: params.quoteId,
      periodKey,
      amountMxn: params.amountMxn,
      quoteTotalMxn: params.quoteTotalMxn,
      ratePercent,
      status: "DEVENGADA",
    })
    .returning();
  return row;
}

export async function syncCommissionsForAuthorizedQuotes(companyId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(quotes)
    .where(
      and(
        eq(quotes.companyId, companyId),
        eq(quotes.status, "AUTORIZADA"),
      ),
    );
  for (const q of rows) {
    if (!q.vendorUserId || !q.totalMxn) continue;
    const ratePercent = 3;
    const commission = Math.round((q.totalMxn * ratePercent) / 100);
    if (commission <= 0) continue;
    const periodKey =
      q.authorizedAt?.toISOString().slice(0, 7) ??
      new Date().toISOString().slice(0, 7);
    await accrueCommissionFromQuote({
      companyId,
      quoteId: q.id,
      vendorUserId: q.vendorUserId,
      amountMxn: commission,
      quoteTotalMxn: q.totalMxn,
      ratePercent,
      periodKey,
    });
  }
}

export async function listCommissions(companyId: string) {
  const db = getDb();
  return db
    .select()
    .from(commissionAccruals)
    .where(eq(commissionAccruals.companyId, companyId));
}

export async function markCommissionsPaid(companyId: string, periodKey: string) {
  const db = getDb();
  await db
    .update(commissionAccruals)
    .set({ status: "PAGADA" })
    .where(
      and(
        eq(commissionAccruals.companyId, companyId),
        eq(commissionAccruals.periodKey, periodKey),
        eq(commissionAccruals.status, "DEVENGADA"),
      ),
    );
}
