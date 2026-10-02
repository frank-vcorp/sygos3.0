import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { attendanceDaily } from "@/db/schema";

export async function markVacationDaysOnCalendar(params: {
  companyId: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  vacationRequestId: string;
}) {
  const db = getDb();
  const d = new Date(params.startDate);
  d.setHours(0, 0, 0, 0);
  const end = new Date(params.endDate);
  end.setHours(23, 59, 59, 999);

  while (d <= end) {
    const day = d.getDay();
    if (day >= 1 && day <= 5) {
      const workDate = new Date(d);
      await db
        .insert(attendanceDaily)
        .values({
          companyId: params.companyId,
          employeeId: params.employeeId,
          workDate,
          classification: "VACACIONES",
          vacationRequestId: params.vacationRequestId,
        })
        .onConflictDoNothing({
          target: [attendanceDaily.employeeId, attendanceDaily.workDate],
        });
    }
    d.setDate(d.getDate() + 1);
  }
}

export async function listAttendanceDaily(employeeId: string, limit = 60) {
  const db = getDb();
  return db
    .select()
    .from(attendanceDaily)
    .where(eq(attendanceDaily.employeeId, employeeId))
    .orderBy(attendanceDaily.workDate)
    .limit(limit);
}
