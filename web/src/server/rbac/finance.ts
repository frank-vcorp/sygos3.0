import type { UserRole } from "@/db/schema";
import { isSuperAdmin } from "@/server/rbac/roles";

export function canSeeFinanceModule(role: UserRole): boolean {
  return (
    isSuperAdmin(role) ||
    role === "CEO" ||
    role === "ADMINISTRADOR" ||
    role === "COORDINACION_ADMINISTRACION"
  );
}

export function canManageFinancialAccounts(role: UserRole): boolean {
  return canSeeFinanceModule(role);
}

export function canRecordManualMovements(role: UserRole): boolean {
  return canSeeFinanceModule(role);
}
