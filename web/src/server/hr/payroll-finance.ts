import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { financialAccounts, payrollLines, payrollRuns } from "@/db/schema";
import { ensureDefaultFinancialAccounts } from "@/server/finance/accounts";
import { recordExpense } from "@/server/finance/movements";

export async function recordPayrollEgress(params: {
  companyId: string;
  payrollRunId: string;
  authorizerUserId: string;
  testSessionId?: string | null;
}) {
  const db = getDb();
  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(
      and(
        eq(payrollRuns.id, params.payrollRunId),
        eq(payrollRuns.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!run) throw new Error("PAYROLL_NOT_FOUND");

  const [totals] = await db
    .select({
      total: sql<number>`coalesce(sum(${payrollLines.amountMxn}), 0)::int`,
    })
    .from(payrollLines)
    .where(eq(payrollLines.payrollRunId, params.payrollRunId));

  const amountMxn = totals?.total ?? 0;
  if (amountMxn <= 0) return null;

  await ensureDefaultFinancialAccounts(params.companyId);
  const [cash] = await db
    .select()
    .from(financialAccounts)
    .where(
      and(
        eq(financialAccounts.companyId, params.companyId),
        eq(financialAccounts.kind, "EFECTIVO"),
      ),
    )
    .limit(1);
  if (!cash) throw new Error("NO_CASH_ACCOUNT");

  return recordExpense({
    companyId: params.companyId,
    accountId: cash.id,
    amountMxn,
    description: `Nómina ${run.weekKey} · ${run.folioNumber}`,
    category: "NOMINA",
    createdByUserId: params.authorizerUserId,
    payrollRunId: params.payrollRunId,
    testSessionId: params.testSessionId ?? null,
  });
}
