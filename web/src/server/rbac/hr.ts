import type { UserRole } from "@/db/schema";
import { isSuperAdmin } from "@/server/rbac/roles";

export function canSeeHrModule(role: UserRole): boolean {
  return (
    isSuperAdmin(role) ||
    role === "CEO" ||
    role === "ADMINISTRADOR" ||
    role === "COORDINACION_ADMINISTRACION"
  );
}

export function canManageEmployees(role: UserRole): boolean {
  return canSeeHrModule(role);
}

export function canApproveVacations(role: UserRole): boolean {
  return isSuperAdmin(role) || role === "CEO" || role === "ADMINISTRADOR";
}

export function isDirectBossRole(role: UserRole): boolean {
  return (
    isSuperAdmin(role) ||
    role === "CEO" ||
    role === "ADMINISTRADOR" ||
    role === "GERENTE_OPERATIVO_SYSTRON" ||
    role === "GERENTE_OPERATIVO_SERVOMOTORES" ||
    role === "SUPERVISOR_TECNICO_SYSTRON"
  );
}

export function canApproveOvertimeBoss(role: UserRole): boolean {
  return isDirectBossRole(role);
}

export function canApproveOvertimeCeo(role: UserRole): boolean {
  return isSuperAdmin(role) || role === "CEO" || role === "ADMINISTRADOR";
}

export function canRunPayroll(role: UserRole): boolean {
  return canSeeHrModule(role);
}

export function canSeeOwnOvertime(role: UserRole): boolean {
  return role !== "KIOSCO";
}
