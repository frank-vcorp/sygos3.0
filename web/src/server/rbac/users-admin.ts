import type { UserRole } from "@/db/schema";
import type { CompanySlug } from "@/lib/company";
import { isSuperAdmin } from "@/server/rbac/roles";

export function canManageUsers(actorRole: UserRole): boolean {
  return actorRole === "ADMINISTRADOR" || actorRole === "CEO";
}

export function canSeeAdministratorAccounts(actorRole: UserRole): boolean {
  return isSuperAdmin(actorRole);
}

export function canGlobalSearch(role: UserRole): boolean {
  return role === "ADMINISTRADOR" || role === "CEO";
}

export function canManageCompanySettings(role: UserRole): boolean {
  return role === "ADMINISTRADOR" || role === "CEO";
}

export function canManageCompanyCapabilities(role: UserRole): boolean {
  return isSuperAdmin(role);
}

const SYSTRON_ROLES: UserRole[] = [
  "GERENTE_OPERATIVO_SYSTRON",
  "SUPERVISOR_TECNICO_SYSTRON",
  "TECNICO_SYSTRON",
  "VENTAS_SYSTRON",
  "ALMACEN_SYSTRON",
];

const SERVOMOTORES_ROLES: UserRole[] = [
  "GERENTE_OPERATIVO_SERVOMOTORES",
  "AYUDANTE_GENERAL_SERVOMOTORES",
];

const CROSS_COMPANY_ROLES: UserRole[] = [
  "CEO",
  "COORDINACION_ADMINISTRACION",
];

export function assignableRoles(
  actorRole: UserRole,
  homeCompanySlug: CompanySlug,
): UserRole[] {
  const base =
    homeCompanySlug === "SYSTRON" ? [...SYSTRON_ROLES] : [...SERVOMOTORES_ROLES];

  if (actorRole === "ADMINISTRADOR") {
    return [
      "ADMINISTRADOR",
      ...CROSS_COMPANY_ROLES,
      ...SYSTRON_ROLES,
      ...SERVOMOTORES_ROLES,
      "KIOSCO",
    ];
  }

  if (actorRole === "CEO") {
    return [...CROSS_COMPANY_ROLES, ...base, "KIOSCO"];
  }

  return base;
}

export function roleRequiresBothCompanies(role: UserRole): boolean {
  return (
    role === "ADMINISTRADOR" ||
    role === "CEO" ||
    role === "COORDINACION_ADMINISTRACION"
  );
}

export function roleMatchesHomeCompany(
  role: UserRole,
  homeCompanySlug: CompanySlug,
): boolean {
  if (roleRequiresBothCompanies(role)) return true;
  if (role === "KIOSCO") return true;
  if (homeCompanySlug === "SYSTRON") {
    return SYSTRON_ROLES.includes(role);
  }
  return SERVOMOTORES_ROLES.includes(role);
}
