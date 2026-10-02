import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { employees, vacationRequests } from "@/db/schema";
import { markVacationDaysOnCalendar } from "@/server/hr/attendance-daily";
import { logFunctionalHistory } from "@/server/history/functional";

function countWeekdays(start: Date, end: Date) {
  let n = 0;
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const endT = new Date(end);
  endT.setHours(23, 59, 59, 999);
  while (d <= endT) {
    const day = d.getDay();
    if (day >= 1 && day <= 5) n += 1;
    d.setDate(d.getDate() + 1);
  }
  return n;
}

export async function createVacationRequest(params: {
  companyId: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  requestedByUserId: string;
  note?: string;
}) {
  const weekdayDays = countWeekdays(params.startDate, params.endDate);
  const db = getDb();
  const [emp] = await db
    .select({ attendanceExempt: employees.attendanceExempt })
    .from(employees)
    .where(
      and(
        eq(employees.id, params.employeeId),
        eq(employees.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!emp) throw new Error("EMPLOYEE_INVALID");
  if (emp.attendanceExempt) throw new Error("VACATION_NOT_ALLOWED");

  const [row] = await db
    .insert(vacationRequests)
    .values({
      companyId: params.companyId,
      employeeId: params.employeeId,
      startDate: params.startDate,
      endDate: params.endDate,
      weekdayDays,
      status: "PENDIENTE",
      requestedByUserId: params.requestedByUserId,
      note: params.note ?? null,
    })
    .returning();
  return row;
}

export async function approveVacationRequest(params: {
  companyId: string;
  requestId: string;
  approverUserId: string;
}) {
  const db = getDb();
  const [req] = await db
    .select()
    .from(vacationRequests)
    .where(
      and(
        eq(vacationRequests.id, params.requestId),
        eq(vacationRequests.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!req || req.status !== "PENDIENTE") throw new Error("INVALID_STATUS");

  const [emp] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, req.employeeId))
    .limit(1);
  if (!emp || emp.vacationBalanceDays < req.weekdayDays) {
    throw new Error("INSUFFICIENT_BALANCE");
  }

  await db
    .update(employees)
    .set({
      vacationBalanceDays: emp.vacationBalanceDays - req.weekdayDays,
      updatedAt: new Date(),
    })
    .where(eq(employees.id, emp.id));

  const [updated] = await db
    .update(vacationRequests)
    .set({
      status: "AUTORIZADA",
      resolvedByUserId: params.approverUserId,
    })
    .where(eq(vacationRequests.id, params.requestId))
    .returning();

  if (updated) {
    await markVacationDaysOnCalendar({
      companyId: params.companyId,
      employeeId: updated.employeeId,
      startDate: updated.startDate,
      endDate: updated.endDate,
      vacationRequestId: updated.id,
    });
    await logFunctionalHistory({
      companyId: params.companyId,
      entityType: "vacation_request",
      entityId: updated.id,
      action: "AUTORIZADA",
      detail: `${updated.weekdayDays} días hábiles`,
      actorUserId: params.approverUserId,
    });
  }
  return updated;
}

export async function listVacationRequests(
  companyId: string,
  opts?: { pendingOnly?: boolean },
) {
  const db = getDb();
  const conditions = [eq(vacationRequests.companyId, companyId)];
  if (opts?.pendingOnly) {
    conditions.push(eq(vacationRequests.status, "PENDIENTE"));
  }
  return db
    .select({
      request: vacationRequests,
      employeeName: employees.legalName,
    })
    .from(vacationRequests)
    .innerJoin(employees, eq(employees.id, vacationRequests.employeeId))
    .where(and(...conditions))
    .orderBy(desc(vacationRequests.createdAt));
}
