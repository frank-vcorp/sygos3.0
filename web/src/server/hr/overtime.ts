import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { employees, overtimeRequests } from "@/db/schema";
import { resolveOvertimeForEmployee } from "@/server/hr/overtime-weekly";

export async function createOvertimeRequest(params: {
  companyId: string;
  employeeId: string;
  workDate: Date;
  hours: number;
  requestedByUserId: string;
}) {
  const db = getDb();
  const [emp] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, params.employeeId))
    .limit(1);
  if (!emp || emp.attendanceExempt) throw new Error("NOT_ALLOWED");
  const { amountMxn, rateKind } = await resolveOvertimeForEmployee({
    companyId: params.companyId,
    employeeId: params.employeeId,
    workDate: params.workDate,
    hours: params.hours,
  });
  const [row] = await db
    .insert(overtimeRequests)
    .values({
      companyId: params.companyId,
      employeeId: params.employeeId,
      workDate: params.workDate,
      hours: params.hours,
      rateKind,
      status: "PENDIENTE_JEFE",
      requestedByUserId: params.requestedByUserId,
      amountMxn,
    })
    .returning();
  return row;
}

export async function approveOvertimeByBoss(params: {
  companyId: string;
  requestId: string;
  bossUserId: string;
}) {
  const db = getDb();
  const [updated] = await db
    .update(overtimeRequests)
    .set({
      status: "PENDIENTE_CEO",
      bossApprovedByUserId: params.bossUserId,
    })
    .where(
      and(
        eq(overtimeRequests.id, params.requestId),
        eq(overtimeRequests.companyId, params.companyId),
        eq(overtimeRequests.status, "PENDIENTE_JEFE"),
      ),
    )
    .returning();
  if (!updated) throw new Error("INVALID_STATUS");
  return updated;
}

export async function approveOvertimeByCeo(params: {
  companyId: string;
  requestId: string;
  ceoUserId: string;
}) {
  const db = getDb();
  const [updated] = await db
    .update(overtimeRequests)
    .set({
      status: "AUTORIZADA",
      ceoApprovedByUserId: params.ceoUserId,
    })
    .where(
      and(
        eq(overtimeRequests.id, params.requestId),
        eq(overtimeRequests.companyId, params.companyId),
        eq(overtimeRequests.status, "PENDIENTE_CEO"),
      ),
    )
    .returning();
  if (!updated) throw new Error("INVALID_STATUS");
  return updated;
}

export async function listOvertimeForCompany(companyId: string) {
  const db = getDb();
  return db
    .select()
    .from(overtimeRequests)
    .where(eq(overtimeRequests.companyId, companyId))
    .orderBy(desc(overtimeRequests.createdAt));
}

export async function listOvertimePendingBoss(companyId: string) {
  const db = getDb();
  return db
    .select()
    .from(overtimeRequests)
    .where(
      and(
        eq(overtimeRequests.companyId, companyId),
        eq(overtimeRequests.status, "PENDIENTE_JEFE"),
      ),
    );
}

export async function listOvertimePendingCeo(companyId: string) {
  const db = getDb();
  return db
    .select()
    .from(overtimeRequests)
    .where(
      and(
        eq(overtimeRequests.companyId, companyId),
        eq(overtimeRequests.status, "PENDIENTE_CEO"),
      ),
    );
}
