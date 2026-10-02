import type { UserRole } from "@/db/schema";
import { isSuperAdmin } from "@/server/rbac/roles";

export function canSeeCeoPanel(role: UserRole): boolean {
  return isSuperAdmin(role) || role === "CEO" || role === "ADMINISTRADOR";
}

export function canSeeCoordinationPanel(role: UserRole): boolean {
  return (
    isSuperAdmin(role) ||
    role === "CEO" ||
    role === "ADMINISTRADOR" ||
    role === "COORDINACION_ADMINISTRACION"
  );
}

export function canSeeGerenteSmPanel(role: UserRole): boolean {
  return (
    isSuperAdmin(role) ||
    role === "GERENTE_OPERATIVO_SERVOMOTORES" ||
    role === "CEO" ||
    role === "ADMINISTRADOR"
  );
}

export function canSeeTechnicianPanel(role: UserRole): boolean {
  return (
    isSuperAdmin(role) ||
    role === "TECNICO_SYSTRON" ||
    role === "SUPERVISOR_TECNICO_SYSTRON" ||
    role === "GERENTE_OPERATIVO_SYSTRON"
  );
}

export function canSeeOpsSystronPanel(role: UserRole): boolean {
  return (
    isSuperAdmin(role) ||
    role === "GERENTE_OPERATIVO_SYSTRON" ||
    role === "SUPERVISOR_TECNICO_SYSTRON" ||
    role === "CEO" ||
    role === "ADMINISTRADOR"
  );
}

export function canSeeProductionAnalytics(role: UserRole): boolean {
  return (
    canSeeCeoPanel(role) ||
    role === "COORDINACION_ADMINISTRACION" ||
    role === "GERENTE_OPERATIVO_SYSTRON"
  );
}

export function canSeeReports(role: UserRole): boolean {
  return canSeeCeoPanel(role) || role === "COORDINACION_ADMINISTRACION";
}

export function canSeeProduction(role: UserRole): boolean {
  return (
    isSuperAdmin(role) ||
    role === "CEO" ||
    role === "GERENTE_OPERATIVO_SYSTRON" ||
    role === "GERENTE_OPERATIVO_SERVOMOTORES" ||
    role === "SUPERVISOR_TECNICO_SYSTRON" ||
    role === "TECNICO_SYSTRON"
  );
}
