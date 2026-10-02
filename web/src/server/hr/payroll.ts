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
import { recordPayrollEgress } from "@/server/hr/payroll-finance";
import { getTestSessionIdForRequest } from "@/server/test-mode/context";

function isoWeekBoundsFromKey(weekKey: string) {
  const m = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  const jan4 = new Date(year, 0, 4);
  const day = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - day + 1 + (week - 1) * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function weekdayDaysInRange(start: Date, end: Date, rangeStart: Date, rangeEnd: Date) {
  const a = new Date(Math.max(start.getTime(), rangeStart.getTime()));
  const b = new Date(Math.min(end.getTime(), rangeEnd.getTime()));
  let n = 0;
  const d = new Date(a);
  d.setHours(0, 0, 0, 0);
  while (d <= b) {
    const day = d.getDay();
    if (day >= 1 && day <= 5) n += 1;
    d.setDate(d.getDate() + 1);
  }
  return n;
}

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
  const testSessionId = await getTestSessionIdForRequest();
  const [run] = await db
    .insert(payrollRuns)
    .values({
      companyId: params.companyId,
      weekKey,
      runKind: "SEMANAL",
      folioNumber,
      status: "BORRADOR",
      stampIdempotencyKey: randomUUID(),
      testSessionId,
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
  const weekBounds = isoWeekBoundsFromKey(weekKey);
  for (const v of vacations) {
    const [emp] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, v.employeeId))
      .limit(1);
    if (!emp || emp.attendanceExempt) continue;
    const daysThisWeek =
      weekBounds != null
        ? weekdayDaysInRange(v.startDate, v.endDate, weekBounds.start, weekBounds.end)
        : v.weekdayDays;
    if (daysThisWeek <= 0) continue;
    const stamped = emp.dailySalaryStampedMxn;
    const cash = emp.dailySalaryCashMxn;
    const daily = stamped + cash;
    const prima = Math.round(daily * daysThisWeek * 0.25);
    if (prima > 0 && daily > 0) {
      const primaStamped = Math.round(prima * (stamped / daily));
      const primaCash = prima - primaStamped;
      if (primaStamped > 0) {
        lines.push({
          payrollRunId: run.id,
          employeeId: emp.id,
          concept: `Prima vacacional timbrada (${daysThisWeek} d)`,
          amountMxn: primaStamped,
          lineKind: "SYSTEM",
          vacationRequestId: v.id,
        });
      }
      if (primaCash > 0) {
        lines.push({
          payrollRunId: run.id,
          employeeId: emp.id,
          concept: `Prima vacacional efectivo (${daysThisWeek} d)`,
          amountMxn: primaCash,
          lineKind: "SYSTEM",
          vacationRequestId: v.id,
        });
      }
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

  const testSessionId = await getTestSessionIdForRequest();
  await recordPayrollEgress({
    companyId: params.companyId,
    payrollRunId: params.payrollRunId,
    authorizerUserId: params.authorizerUserId,
    testSessionId,
  });

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
