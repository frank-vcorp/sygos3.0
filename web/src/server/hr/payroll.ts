import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import type { UserRole } from "@/db/schema";
import { getDb } from "@/db/client";
import {
  employees,
  overtimeRequests,
  payrollLines,
  payrollRuns,
  vacationRequests,
} from "@/db/schema";
import { formatPayrollFolio, nextFolioValue } from "@/server/masters/folios";
import {
  buildMonthlyBonusLines,
  computeAguinaldoMxn,
} from "@/server/hr/payroll-bonuses";
import {
  stampPayrollRun,
  validatePayrollStampReadiness,
} from "@/server/hr/payroll-fiscal";

export function currentIsoWeekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export async function generatePayrollDraft(params: {
  companyId: string;
  weekKey?: string;
}) {
  const weekKey = params.weekKey ?? currentIsoWeekKey();
  const db = getDb();
  const [existing] = await db
    .select()
    .from(payrollRuns)
    .where(
      and(
        eq(payrollRuns.companyId, params.companyId),
        eq(payrollRuns.weekKey, weekKey),
        eq(payrollRuns.runKind, "SEMANAL"),
      ),
    )
    .limit(1);
  if (existing) return existing;

  const folioNumber = await nextFolioValue(params.companyId, "NOM");
  const [run] = await db
    .insert(payrollRuns)
    .values({
      companyId: params.companyId,
      weekKey,
      runKind: "SEMANAL",
      folioNumber,
      status: "BORRADOR",
      stampIdempotencyKey: randomUUID(),
    })
    .returning();

  const staff = await db
    .select()
    .from(employees)
    .where(
      and(eq(employees.companyId, params.companyId), eq(employees.status, "ACTIVO")),
    );

  const lines: (typeof payrollLines.$inferInsert)[] = [];
  for (const emp of staff) {
    if (emp.attendanceExempt) {
      lines.push({
        payrollRunId: run.id,
        employeeId: emp.id,
        concept: "Salario fijo semanal",
        amountMxn: (emp.dailySalaryStampedMxn + emp.dailySalaryCashMxn) * 7,
        lineKind: "SYSTEM",
      });
      continue;
    }
    const weeklyBase =
      (emp.dailySalaryStampedMxn + emp.dailySalaryCashMxn) * 7;
    lines.push({
      payrollRunId: run.id,
      employeeId: emp.id,
      concept: "Nómina semanal base",
      amountMxn: weeklyBase,
      lineKind: "SYSTEM",
    });
  }

  const vacations = await db
    .select()
    .from(vacationRequests)
    .where(
      and(
        eq(vacationRequests.companyId, params.companyId),
        eq(vacationRequests.status, "AUTORIZADA"),
      ),
    );
  for (const v of vacations) {
    const [emp] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, v.employeeId))
      .limit(1);
    if (!emp || emp.attendanceExempt) continue;
    const daily = emp.dailySalaryStampedMxn + emp.dailySalaryCashMxn;
    const prima = Math.round(daily * v.weekdayDays * 0.25);
    if (prima > 0) {
      lines.push({
        payrollRunId: run.id,
        employeeId: emp.id,
        concept: "Prima vacacional 25%",
        amountMxn: prima,
        lineKind: "SYSTEM",
        vacationRequestId: v.id,
      });
    }
  }

  const overtime = await db
    .select()
    .from(overtimeRequests)
    .where(
      and(
        eq(overtimeRequests.companyId, params.companyId),
        eq(overtimeRequests.status, "AUTORIZADA"),
      ),
    );
  for (const ot of overtime) {
    const [emp] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, ot.employeeId))
      .limit(1);
    if (!emp || emp.attendanceExempt) continue;
    lines.push({
      payrollRunId: run.id,
      employeeId: ot.employeeId,
      concept: `Horas extra ${ot.rateKind}`,
      amountMxn: ot.amountMxn ?? 0,
      lineKind: "SYSTEM",
      overtimeRequestId: ot.id,
    });
  }

  const bonusLines = await buildMonthlyBonusLines({
    companyId: params.companyId,
    weekKey,
    payrollRunId: run.id,
  });
  lines.push(...bonusLines);

  if (lines.length) await db.insert(payrollLines).values(lines);
  return run;
}

export async function generateAguinaldoDraft(params: {
  companyId: string;
  year?: number;
}) {
  const year = params.year ?? new Date().getFullYear();
  const weekKey = `${year}-AGUINALDO`;
  const db = getDb();
  const [existing] = await db
    .select()
    .from(payrollRuns)
    .where(
      and(
        eq(payrollRuns.companyId, params.companyId),
        eq(payrollRuns.weekKey, weekKey),
        eq(payrollRuns.runKind, "AGUINALDO"),
      ),
    )
    .limit(1);
  if (existing) return existing;

  const folioNumber = await nextFolioValue(params.companyId, "NOM");
  const [run] = await db
    .insert(payrollRuns)
    .values({
      companyId: params.companyId,
      weekKey,
      runKind: "AGUINALDO",
      folioNumber,
      status: "BORRADOR",
      stampIdempotencyKey: randomUUID(),
    })
    .returning();

  const staff = await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.companyId, params.companyId),
        eq(employees.status, "ACTIVO"),
        eq(employees.bonusesEligible, true),
      ),
    );

  const lines: (typeof payrollLines.$inferInsert)[] = staff.map((emp) => ({
    payrollRunId: run.id,
    employeeId: emp.id,
    concept: `Aguinaldo ${year}`,
    amountMxn: computeAguinaldoMxn({
      dailySalaryTotalMxn: emp.dailySalaryStampedMxn + emp.dailySalaryCashMxn,
      hireDate: emp.hireDate,
      year,
    }),
    lineKind: "AGUINALDO",
  }));

  if (lines.length) await db.insert(payrollLines).values(lines);
  return run;
}

export async function addPayrollAdjustment(params: {
  payrollRunId: string;
  companyId: string;
  employeeId: string;
  kind: "EXTRA_INGRESO" | "EXTRA_DESCUENTO";
  concept: string;
  amountMxn: number;
  actorUserId: string;
}) {
  const db = getDb();
  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(
      and(
        eq(payrollRuns.id, params.payrollRunId),
        eq(payrollRuns.companyId, params.companyId),
        eq(payrollRuns.status, "BORRADOR"),
      ),
    )
    .limit(1);
  if (!run) throw new Error("INVALID_STATUS");

  const amount =
    params.kind === "EXTRA_DESCUENTO" ?
      -Math.abs(params.amountMxn)
    : Math.abs(params.amountMxn);

  const [line] = await db
    .insert(payrollLines)
    .values({
      payrollRunId: params.payrollRunId,
      employeeId: params.employeeId,
      concept: params.concept.trim(),
      amountMxn: amount,
      lineKind: params.kind,
      createdByUserId: params.actorUserId,
    })
    .returning();
  return line;
}

export async function removePayrollLine(params: {
  lineId: string;
  companyId: string;
}) {
  const db = getDb();
  const [line] = await db
    .select({
      line: payrollLines,
      run: payrollRuns,
    })
    .from(payrollLines)
    .innerJoin(payrollRuns, eq(payrollRuns.id, payrollLines.payrollRunId))
    .where(eq(payrollLines.id, params.lineId))
    .limit(1);
  if (!line || line.run.companyId !== params.companyId) return false;
  if (line.run.status !== "BORRADOR") throw new Error("INVALID_STATUS");
  if (
    line.line.lineKind === "SYSTEM" ||
    line.line.lineKind.startsWith("BONO_") ||
    line.line.lineKind === "AGUINALDO"
  ) {
    throw new Error("PROTECTED_LINE");
  }
  await db.delete(payrollLines).where(eq(payrollLines.id, params.lineId));
  return true;
}

export async function authorizePayroll(params: {
  companyId: string;
  payrollRunId: string;
  authorizerUserId: string;
  authorizerRole: UserRole;
}) {
  const issues = await validatePayrollStampReadiness(params.payrollRunId);
  if (issues.length) {
    const err = new Error("PAYROLL_FISCAL_DATA_MISSING");
    (err as Error & { issues: typeof issues }).issues = issues;
    throw err;
  }

  await stampPayrollRun({
    companyId: params.companyId,
    payrollRunId: params.payrollRunId,
    actorUserId: params.authorizerUserId,
    actorRole: params.authorizerRole,
  });

  const db = getDb();
  const [run] = await db
    .update(payrollRuns)
    .set({
      status: "AUTORIZADA",
      authorizedByUserId: params.authorizerUserId,
      authorizedAt: new Date(),
    })
    .where(
      and(
        eq(payrollRuns.id, params.payrollRunId),
        eq(payrollRuns.companyId, params.companyId),
        eq(payrollRuns.status, "BORRADOR"),
      ),
    )
    .returning();
  if (!run) throw new Error("INVALID_STATUS");

  if (run.runKind === "SEMANAL") {
    await db
      .update(overtimeRequests)
      .set({ status: "PAGADA" })
      .where(
        and(
          eq(overtimeRequests.companyId, params.companyId),
          eq(overtimeRequests.status, "AUTORIZADA"),
        ),
      );
  }

  return run;
}

export async function listPayrollRuns(companyId: string) {
  const db = getDb();
  return db
    .select()
    .from(payrollRuns)
    .where(eq(payrollRuns.companyId, companyId))
    .orderBy(desc(payrollRuns.createdAt));
}

export async function getPayrollDetail(companyId: string, runId: string) {
  const db = getDb();
  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(and(eq(payrollRuns.id, runId), eq(payrollRuns.companyId, companyId)))
    .limit(1);
  if (!run) return null;
  const lines = await db
    .select()
    .from(payrollLines)
    .where(eq(payrollLines.payrollRunId, runId));
  return { run: { ...run, folio: formatPayrollFolio(run.folioNumber) }, lines };
}
