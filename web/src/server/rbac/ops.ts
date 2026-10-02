import type { UserRole } from "@/db/schema";
import type { CompanySlug } from "@/lib/company";
import { isSuperAdmin } from "@/server/rbac/roles";

const leadership: UserRole[] = [
  "ADMINISTRADOR",
  "CEO",
  "COORDINACION_ADMINISTRACION",
];

function isLeadership(role: UserRole): boolean {
  return leadership.includes(role);
}

export function canCreateAttention(role: UserRole, slug: CompanySlug): boolean {
  if (isLeadership(role)) return true;
  if (slug === "SYSTRON") {
    return (
      role === "VENTAS_SYSTRON" ||
      role === "SUPERVISOR_TECNICO_SYSTRON" ||
      role === "GERENTE_OPERATIVO_SYSTRON"
    );
  }
  return role === "GERENTE_OPERATIVO_SERVOMOTORES";
}

export function canSeeTechnicalOps(role: UserRole): boolean {
  if (isLeadership(role) || isSuperAdmin(role)) return true;
  return (
    role === "GERENTE_OPERATIVO_SYSTRON" ||
    role === "GERENTE_OPERATIVO_SERVOMOTORES" ||
    role === "SUPERVISOR_TECNICO_SYSTRON" ||
    role === "TECNICO_SYSTRON"
  );
}

export function canExecuteDiagnostic(role: UserRole, slug: CompanySlug): boolean {
  if (isLeadership(role)) return true;
  if (slug === "SYSTRON") {
    return (
      role === "TECNICO_SYSTRON" ||
      role === "SUPERVISOR_TECNICO_SYSTRON"
    );
  }
  return role === "GERENTE_OPERATIVO_SERVOMOTORES";
}

export function canValidateDiagnostics(role: UserRole, slug: CompanySlug): boolean {
  if (isLeadership(role)) return true;
  if (slug === "SYSTRON") return role === "GERENTE_OPERATIVO_SYSTRON";
  return role === "GERENTE_OPERATIVO_SERVOMOTORES";
}

export function canAssignTechnical(role: UserRole, slug: CompanySlug): boolean {
  if (isLeadership(role)) return true;
  if (slug === "SYSTRON") {
    return (
      role === "GERENTE_OPERATIVO_SYSTRON" ||
      role === "SUPERVISOR_TECNICO_SYSTRON"
    );
  }
  return role === "GERENTE_OPERATIVO_SERVOMOTORES";
}

export function canManageExternalService(role: UserRole, slug: CompanySlug): boolean {
  if (slug !== "SYSTRON") return false;
  return (
    isLeadership(role) ||
    role === "GERENTE_OPERATIVO_SYSTRON" ||
    role === "SUPERVISOR_TECNICO_SYSTRON"
  );
}
