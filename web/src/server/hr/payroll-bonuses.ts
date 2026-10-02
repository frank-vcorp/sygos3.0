import { and, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { attendancePunches, companySettings, employees } from "@/db/schema";

function isoWeekRange(weekKey: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(year, 0, 4);
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const weekStart = new Date(week1Monday);
  weekStart.setDate(week1Monday.getDate() + (week - 1) * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

/** Semana ISO que contiene el último día de un mes calendario. */
export function closingMonthForWeekKey(weekKey: string): {
  year: number;
  month: number;
} | null {
  const range = isoWeekRange(weekKey);
  if (!range) return null;
  const { weekStart, weekEnd } = range;
  const cursor = new Date(weekStart);
  while (cursor <= weekEnd) {
    const next = new Date(cursor);
    next.setDate(cursor.getDate() + 1);
    if (next.getMonth() !== cursor.getMonth() || next > weekEnd) {
      const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      if (lastDay >= weekStart && lastDay <= weekEnd) {
        return { year: lastDay.getFullYear(), month: lastDay.getMonth() + 1 };
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
}

export async function buildMonthlyBonusLines(params: {
  companyId: string;
  weekKey: string;
  payrollRunId: string;
}) {
  const closing = closingMonthForWeekKey(params.weekKey);
  if (!closing) return [];

  const db = getDb();
  const [settings] = await db
    .select()
    .from(companySettings)
    .where(eq(companySettings.companyId, params.companyId))
    .limit(1);

  const punctuality = settings?.bonusPunctualityMxn ?? 0;
  const productivity = settings?.bonusProductivityMxn ?? 0;
  if (punctuality <= 0 && productivity <= 0) return [];

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

  const monthStart = new Date(closing.year, closing.month - 1, 1);
  const monthEnd = new Date(closing.year, closing.month, 0, 23, 59, 59, 999);

  const lines: {
    payrollRunId: string;
    employeeId: string;
    concept: string;
    amountMxn: number;
    lineKind: string;
  }[] = [];

  for (const emp of staff) {
    const eligible = await employeeEligibleForPunctualityBonus(
      emp.id,
      monthStart,
      monthEnd,
    );
    if (punctuality > 0 && eligible) {
      lines.push({
        payrollRunId: params.payrollRunId,
        employeeId: emp.id,
        concept: `Bono puntualidad ${closing.month}/${closing.year}`,
        amountMxn: punctuality,
        lineKind: "BONO_PUNTUALIDAD",
      });
    }
    if (productivity > 0) {
      lines.push({
        payrollRunId: params.payrollRunId,
        employeeId: emp.id,
        concept: `Bono productividad ${closing.month}/${closing.year}`,
        amountMxn: productivity,
        lineKind: "BONO_PRODUCTIVIDAD",
      });
    }
  }
  return lines;
}

async function employeeEligibleForPunctualityBonus(
  employeeId: string,
  monthStart: Date,
  monthEnd: Date,
) {
  const db = getDb();
  const punches = await db
    .select({ id: attendancePunches.id })
    .from(attendancePunches)
    .where(
      and(
        eq(attendancePunches.employeeId, employeeId),
        gte(attendancePunches.punchedAt, monthStart),
        lte(attendancePunches.punchedAt, monthEnd),
      ),
    )
    .limit(1);
  return punches.length > 0;
}

export function computeAguinaldoMxn(params: {
  dailySalaryTotalMxn: number;
  hireDate: Date;
  year: number;
}) {
  const daily = params.dailySalaryTotalMxn;
  const yearStart = new Date(params.year, 0, 1);
  const yearEnd = new Date(params.year, 11, 31, 23, 59, 59, 999);
  const start =
    params.hireDate > yearStart ? params.hireDate : yearStart;
  const daysInYear = 365;
  const daysWorked = Math.max(
    0,
    Math.ceil((yearEnd.getTime() - start.getTime()) / 86400000) + 1,
  );
  const proportion = Math.min(1, daysWorked / daysInYear);
  return Math.round(daily * 15 * proportion);
}
