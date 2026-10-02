import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  employees,
  payrollFiscalReceipts,
  payrollLines,
  payrollRuns,
  type UserRole,
} from "@/db/schema";
import { emitPayrollReceiptWithFacturapi } from "@/server/billing/facturapi-client";

export type PayrollStampIssue = {
  employeeId: string;
  legalName: string;
  reason: string;
};

export function stampedAmountFromLines(
  emp: typeof employees.$inferSelect,
  lineTotalMxn: number,
) {
  const dailyTotal = emp.dailySalaryStampedMxn + emp.dailySalaryCashMxn;
  if (dailyTotal <= 0 || lineTotalMxn <= 0) return 0;
  return Math.round(lineTotalMxn * (emp.dailySalaryStampedMxn / dailyTotal));
}

export async function validatePayrollStampReadiness(payrollRunId: string) {
  const db = getDb();
  const lines = await db
    .select()
    .from(payrollLines)
    .where(eq(payrollLines.payrollRunId, payrollRunId));

  const byEmployee = new Map<string, number>();
  for (const l of lines) {
    byEmployee.set(l.employeeId, (byEmployee.get(l.employeeId) ?? 0) + l.amountMxn);
  }

  const issues: PayrollStampIssue[] = [];
  for (const [employeeId, total] of byEmployee) {
    const [emp] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);
    if (!emp) continue;
    const stamped = stampedAmountFromLines(emp, total);
    if (stamped <= 0) continue;
    if (!emp.taxRfc?.trim()) {
      issues.push({
        employeeId,
        legalName: emp.legalName,
        reason: "Falta RFC fiscal del colaborador.",
      });
    }
  }
  return issues;
}

export async function stampPayrollRun(params: {
  companyId: string;
  payrollRunId: string;
  actorUserId: string;
  actorRole: UserRole;
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
  if (!run) throw new Error("NOT_FOUND");

  const issues = await validatePayrollStampReadiness(params.payrollRunId);
  if (issues.length) throw new Error("PAYROLL_FISCAL_DATA_MISSING");

  const lines = await db
    .select()
    .from(payrollLines)
    .where(eq(payrollLines.payrollRunId, params.payrollRunId));

  const byEmployee = new Map<string, number>();
  for (const l of lines) {
    byEmployee.set(l.employeeId, (byEmployee.get(l.employeeId) ?? 0) + l.amountMxn);
  }

  const stampTargets: { emp: typeof employees.$inferSelect; stamped: number }[] =
    [];
  for (const [employeeId, total] of byEmployee) {
    const [emp] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);
    if (!emp) continue;
    const stamped = stampedAmountFromLines(emp, total);
    if (stamped > 0) stampTargets.push({ emp, stamped });
  }

  if (stampTargets.length === 0) {
    await db
      .update(payrollRuns)
      .set({ fiscalStatus: "NO_APLICA", lastFiscalError: null })
      .where(eq(payrollRuns.id, params.payrollRunId));
    return { fiscalStatus: "NO_APLICA" as const, simulated: false };
  }

  const idempotencyKey = run.stampIdempotencyKey ?? randomUUID();
  if (!run.stampIdempotencyKey) {
    await db
      .update(payrollRuns)
      .set({ stampIdempotencyKey: idempotencyKey })
      .where(eq(payrollRuns.id, params.payrollRunId));
  }

  await db
    .delete(payrollFiscalReceipts)
    .where(
      and(
        eq(payrollFiscalReceipts.payrollRunId, params.payrollRunId),
        eq(payrollFiscalReceipts.status, "ERROR"),
      ),
    );

  let simulated = false;
  let hadError = false;
  let lastError: string | null = null;

  for (const { emp, stamped } of stampTargets) {
    try {
      const result = await emitPayrollReceiptWithFacturapi({
        companyId: params.companyId,
        actorUserId: params.actorUserId,
        actorRole: params.actorRole,
        idempotencyKey: `${idempotencyKey}-${emp.id}`,
        employee: {
          legal_name: emp.legalName,
          tax_id: emp.taxRfc!.trim(),
          tax_system: "605",
        },
        amountMxn: stamped,
        periodLabel: run.weekKey,
      });
      if (result.simulated) simulated = true;
      await db.insert(payrollFiscalReceipts).values({
        payrollRunId: params.payrollRunId,
        employeeId: emp.id,
        amountStampedMxn: stamped,
        status: result.simulated ? "SIMULADA" : "TIMBRADA",
        facturapiReceiptId: result.receiptId,
        facturapiUuid: result.uuid,
      });
    } catch (e) {
      hadError = true;
      lastError = e instanceof Error ? e.message : "Error timbrado";
      await db.insert(payrollFiscalReceipts).values({
        payrollRunId: params.payrollRunId,
        employeeId: emp.id,
        amountStampedMxn: stamped,
        status: "ERROR",
        lastError,
      });
    }
  }

  const fiscalStatus =
    hadError ? "ERROR"
    : simulated ? "SIMULADA"
    : "TIMBRADA";

  await db
    .update(payrollRuns)
    .set({
      fiscalStatus,
      lastFiscalError: lastError,
    })
    .where(eq(payrollRuns.id, params.payrollRunId));

  if (hadError) {
    const err = new Error("PAYROLL_STAMP_FAILED");
    (err as Error & { detail?: string }).detail = lastError ?? undefined;
    throw err;
  }
  return { fiscalStatus, simulated };
}

export async function listPayrollFiscalReceipts(payrollRunId: string) {
  const db = getDb();
  return db
    .select({
      receipt: payrollFiscalReceipts,
      legalName: employees.legalName,
    })
    .from(payrollFiscalReceipts)
    .innerJoin(employees, eq(employees.id, payrollFiscalReceipts.employeeId))
    .where(eq(payrollFiscalReceipts.payrollRunId, payrollRunId));
}
