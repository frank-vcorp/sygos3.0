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

export function canSeeClients(role: UserRole): boolean {
  if (isLeadership(role) || isSuperAdmin(role)) return true;
  return (
    role === "VENTAS_SYSTRON" ||
    role === "GERENTE_OPERATIVO_SYSTRON" ||
    role === "GERENTE_OPERATIVO_SERVOMOTORES"
  );
}

export function canCreateClient(
  role: UserRole,
  companySlug: CompanySlug,
): boolean {
  if (isLeadership(role) || isSuperAdmin(role)) return true;
  if (companySlug === "SYSTRON") {
    return role === "VENTAS_SYSTRON";
  }
  return role === "GERENTE_OPERATIVO_SERVOMOTORES";
}

export function canReassignClientResponsible(role: UserRole): boolean {
  return isSuperAdmin(role) || role === "CEO" || role === "ADMINISTRADOR";
}

export function canSeeProspects(role: UserRole): boolean {
  return canSeeClients(role);
}

export function canCreateProspect(
  role: UserRole,
  companySlug: CompanySlug,
): boolean {
  return canCreateClient(role, companySlug);
}

export function canConvertProspect(
  role: UserRole,
  companySlug: CompanySlug,
): boolean {
  return canCreateClient(role, companySlug) || isLeadership(role);
}

export function canSeeSuppliers(role: UserRole): boolean {
  if (isLeadership(role) || isSuperAdmin(role)) return true;
  return (
    role === "GERENTE_OPERATIVO_SYSTRON" ||
    role === "GERENTE_OPERATIVO_SERVOMOTORES" ||
    role === "ALMACEN_SYSTRON" ||
    role === "SUPERVISOR_TECNICO_SYSTRON"
  );
}

export function canManageSuppliers(role: UserRole): boolean {
  if (isLeadership(role) || isSuperAdmin(role)) return true;
  return (
    role === "GERENTE_OPERATIVO_SYSTRON" ||
    role === "GERENTE_OPERATIVO_SERVOMOTORES"
  );
}
