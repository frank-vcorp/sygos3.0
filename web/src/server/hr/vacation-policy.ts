import { and, eq } from "drizzle-orm";
import type { UserRole } from "@/db/schema";
import { getDb } from "@/db/client";
import { employees } from "@/db/schema";
import { isSuperAdmin } from "@/server/rbac/roles";
import { canApproveVacations } from "@/server/rbac/hr";

/** Discovery §9: el empleado no solicita vacaciones; lo hace el jefe (o CEO/Admin). */
export async function assertCanRegisterVacationFor(params: {
  companyId: string;
  actorUserId: string;
  actorRole: UserRole;
  targetEmployeeId: string;
}) {
  if (canApproveVacations(params.actorRole) || isSuperAdmin(params.actorRole)) {
    return;
  }
  const db = getDb();
  const [target] = await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.id, params.targetEmployeeId),
        eq(employees.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!target) throw new Error("EMPLOYEE_INVALID");

  const [managerEmp] = target.managerEmployeeId
    ? await db
        .select()
        .from(employees)
        .where(eq(employees.id, target.managerEmployeeId))
        .limit(1)
    : [undefined];

  if (managerEmp?.userId !== params.actorUserId) {
    throw new Error("VACATION_BOSS_ONLY");
  }
}
