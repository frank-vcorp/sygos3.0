import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { employees, overtimeRequests } from "@/db/schema";

function isoWeekBounds(workDate: Date) {
  const d = new Date(workDate);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  const start = new Date(d);
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function sumWeekOvertimeHours(params: {
  companyId: string;
  employeeId: string;
  workDate: Date;
  excludeRequestId?: string;
}) {
  const { start, end } = isoWeekBounds(params.workDate);
  const db = getDb();
  const conditions = [
    eq(overtimeRequests.companyId, params.companyId),
    eq(overtimeRequests.employeeId, params.employeeId),
    gte(overtimeRequests.workDate, start),
    lte(overtimeRequests.workDate, end),
    inArray(overtimeRequests.status, [
      "PENDIENTE_JEFE",
      "PENDIENTE_CEO",
      "AUTORIZADA",
      "PAGADA",
    ]),
  ];
  if (params.excludeRequestId) {
    conditions.push(sql`${overtimeRequests.id} <> ${params.excludeRequestId}`);
  }
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${overtimeRequests.hours}), 0)::int`,
    })
    .from(overtimeRequests)
    .where(and(...conditions));
  return row?.total ?? 0;
}

export function computeOvertimePay(params: {
  dailySalaryStampedMxn: number;
  dailySalaryCashMxn: number;
  hours: number;
  weekHoursBefore: number;
}): { amountMxn: number; rateKind: "DOBLE" | "TRIPLE" } {
  const daily = params.dailySalaryStampedMxn + params.dailySalaryCashMxn;
  const hourly = daily / 8;
  let weekPos = params.weekHoursBefore;
  let amount = 0;
  let usedTriple = false;
  for (let i = 0; i < params.hours; i += 1) {
    weekPos += 1;
    const mult = weekPos >= 10 ? 3 : 2;
    if (mult === 3) usedTriple = true;
    amount += Math.round(hourly * mult);
  }
  return { amountMxn: amount, rateKind: usedTriple ? "TRIPLE" : "DOBLE" };
}

export async function resolveOvertimeForEmployee(params: {
  companyId: string;
  employeeId: string;
  workDate: Date;
  hours: number;
}) {
  const db = getDb();
  const [emp] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, params.employeeId))
    .limit(1);
  if (!emp) throw new Error("EMPLOYEE_INVALID");
  const weekHoursBefore = await sumWeekOvertimeHours({
    companyId: params.companyId,
    employeeId: params.employeeId,
    workDate: params.workDate,
  });
  return computeOvertimePay({
    dailySalaryStampedMxn: emp.dailySalaryStampedMxn,
    dailySalaryCashMxn: emp.dailySalaryCashMxn,
    hours: params.hours,
    weekHoursBefore,
  });
}
