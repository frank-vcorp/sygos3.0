import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { employees, users } from "@/db/schema";
import type { UserRole } from "@/db/schema";

export function attendanceExemptForRole(role: UserRole): boolean {
  return role === "GERENTE_OPERATIVO_SERVOMOTORES";
}

export async function listEmployees(companyId: string) {
  const db = getDb();
  return db
    .select({
      employee: employees,
      userName: users.displayName,
    })
    .from(employees)
    .leftJoin(users, eq(users.id, employees.userId))
    .where(eq(employees.companyId, companyId))
    .orderBy(desc(employees.createdAt));
}

export async function getEmployee(companyId: string, id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.companyId, companyId)))
    .limit(1);
  return row ?? null;
}

export async function createEmployee(params: {
  companyId: string;
  legalName: string;
  hireType: (typeof employees.$inferSelect)["hireType"];
  hireDate: Date;
  userId?: string;
  managerEmployeeId?: string;
  dailySalaryStampedMxn: number;
  dailySalaryCashMxn: number;
  vacationBalanceDays?: number;
  taxRfc?: string;
  taxCurp?: string;
  taxZip?: string;
  userRole?: UserRole;
}) {
  const db = getDb();
  const [row] = await db
    .insert(employees)
    .values({
      companyId: params.companyId,
      legalName: params.legalName.trim(),
      hireType: params.hireType,
      hireDate: params.hireDate,
      userId: params.userId ?? null,
      managerEmployeeId: params.managerEmployeeId ?? null,
      dailySalaryStampedMxn: params.dailySalaryStampedMxn,
      dailySalaryCashMxn: params.dailySalaryCashMxn,
      taxRfc: params.taxRfc?.trim() || null,
      taxCurp: params.taxCurp?.trim() || null,
      taxZip: params.taxZip?.trim() || null,
      vacationBalanceDays: params.vacationBalanceDays ?? 0,
      attendanceExempt:
        params.userRole ? attendanceExemptForRole(params.userRole) : false,
      bonusesEligible:
        params.userRole ? !attendanceExemptForRole(params.userRole) : true,
      kioskEnabled: params.userRole ?
        !attendanceExemptForRole(params.userRole)
      : true,
    })
    .returning();
  return row;
}

export async function listKioskEmployees(companyId: string) {
  const db = getDb();
  return db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.companyId, companyId),
        eq(employees.status, "ACTIVO"),
        eq(employees.kioskEnabled, true),
      ),
    );
}
