import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { attendancePunches, employees } from "@/db/schema";

export async function recordKioskPunch(params: {
  companyId: string;
  employeeId: string;
  punchType: (typeof attendancePunches.$inferSelect)["punchType"];
}) {
  const db = getDb();
  const [emp] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, params.employeeId))
    .limit(1);
  if (
    !emp ||
    emp.companyId !== params.companyId ||
    emp.status !== "ACTIVO" ||
    !emp.kioskEnabled
  ) {
    throw new Error("NOT_ALLOWED");
  }
  const [row] = await db
    .insert(attendancePunches)
    .values({
      companyId: params.companyId,
      employeeId: params.employeeId,
      punchType: params.punchType,
      source: "KIOSCO",
    })
    .returning();
  return row;
}

export async function listAttendanceForEmployee(employeeId: string, limit = 30) {
  const db = getDb();
  return db
    .select()
    .from(attendancePunches)
    .where(eq(attendancePunches.employeeId, employeeId))
    .orderBy(desc(attendancePunches.punchedAt))
    .limit(limit);
}
