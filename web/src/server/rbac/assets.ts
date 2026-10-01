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

export function canSeeEqui(role: UserRole, slug: CompanySlug): boolean {
  if (slug !== "SYSTRON") return false;
  if (isLeadership(role) || isSuperAdmin(role)) return true;
  return (
    role === "VENTAS_SYSTRON" ||
    role === "ALMACEN_SYSTRON" ||
    role === "GERENTE_OPERATIVO_SYSTRON" ||
    role === "SUPERVISOR_TECNICO_SYSTRON" ||
    role === "TECNICO_SYSTRON"
  );
}

export function canCreateEqui(role: UserRole, slug: CompanySlug): boolean {
  if (slug !== "SYSTRON") return false;
  if (isLeadership(role)) return true;
  return role === "VENTAS_SYSTRON";
}

export function canSeeMotors(role: UserRole, slug: CompanySlug): boolean {
  if (isLeadership(role) || isSuperAdmin(role)) return true;
  if (slug === "SYSTRON") {
    return (
      role === "VENTAS_SYSTRON" ||
      role === "GERENTE_OPERATIVO_SYSTRON" ||
      role === "SUPERVISOR_TECNICO_SYSTRON" ||
      role === "TECNICO_SYSTRON"
    );
  }
  return (
    role === "GERENTE_OPERATIVO_SERVOMOTORES" ||
    role === "VENTAS_SYSTRON"
  );
}

export function canCreateMotor(role: UserRole, slug: CompanySlug): boolean {
  if (isLeadership(role)) return true;
  if (slug === "SYSTRON") return role === "VENTAS_SYSTRON";
  return role === "GERENTE_OPERATIVO_SERVOMOTORES";
}

export function canOperateSystronWarehouse(role: UserRole, slug: CompanySlug): boolean {
  if (slug !== "SYSTRON") return false;
  if (isLeadership(role)) return true;
  return role === "ALMACEN_SYSTRON" || role === "GERENTE_OPERATIVO_SYSTRON";
}

export function canOperateServomotoresCustody(
  role: UserRole,
  slug: CompanySlug,
): boolean {
  if (slug !== "SERVOMOTORES") return false;
  if (isLeadership(role)) return true;
  return role === "GERENTE_OPERATIVO_SERVOMOTORES";
}

export function canManageInventory(
  role: UserRole,
  slug: CompanySlug,
  servomotoresInventoryEnabled: boolean,
): boolean {
  if (slug === "SERVOMOTORES" && !servomotoresInventoryEnabled) {
    return isSuperAdmin(role);
  }
  if (isLeadership(role)) return true;
  if (slug === "SYSTRON") {
    return role === "ALMACEN_SYSTRON" || role === "GERENTE_OPERATIVO_SYSTRON";
  }
  return role === "GERENTE_OPERATIVO_SERVOMOTORES";
}

export function canManageWorkOrders(role: UserRole, slug: CompanySlug): boolean {
  if (slug !== "SYSTRON") return false;
  if (isLeadership(role)) return true;
  return (
    role === "GERENTE_OPERATIVO_SYSTRON" ||
    role === "SUPERVISOR_TECNICO_SYSTRON" ||
    role === "TECNICO_SYSTRON"
  );
}
