import type { UserRole } from "@/db/schema";
import type { CompanySlug } from "@/lib/company";
import { isSuperAdmin } from "@/server/rbac/roles";

export function canSeeCommercialModule(role: UserRole): boolean {
  if (isSuperAdmin(role) || role === "CEO" || role === "COORDINACION_ADMINISTRACION") {
    return true;
  }
  if (role === "VENTAS_SYSTRON") return true;
  if (role === "GERENTE_OPERATIVO_SERVOMOTORES") return true;
  return false;
}

export function canManageQuotePricing(role: UserRole): boolean {
  return isSuperAdmin(role) || role === "CEO" || role === "ADMINISTRADOR";
}

export function canCreateQuoteAsVendor(role: UserRole, slug: CompanySlug): boolean {
  if (isSuperAdmin(role) || role === "CEO" || role === "ADMINISTRADOR") return true;
  if (role === "VENTAS_SYSTRON" && slug === "SYSTRON") return true;
  if (role === "GERENTE_OPERATIVO_SERVOMOTORES" && slug === "SERVOMOTORES") {
    return true;
  }
  return false;
}

export function canSeePendingPricingQueue(role: UserRole): boolean {
  return canManageQuotePricing(role);
}

export function canSeeIntercompanyBase(role: UserRole): boolean {
  return isSuperAdmin(role) || role === "CEO" || role === "ADMINISTRADOR";
}

export function canManageCommercialGoals(role: UserRole): boolean {
  return isSuperAdmin(role) || role === "CEO" || role === "ADMINISTRADOR";
}

export function canUseCommercialAgenda(role: UserRole, slug: CompanySlug): boolean {
  if (!canSeeCommercialModule(role)) return false;
  if (role === "VENTAS_SYSTRON" && slug === "SYSTRON") return true;
  if (role === "GERENTE_OPERATIVO_SERVOMOTORES" && slug === "SERVOMOTORES") {
    return true;
  }
  if (isSuperAdmin(role) || role === "CEO" || role === "ADMINISTRADOR") return true;
  return false;
}

export function vendorQuoteScopeUserId(
  role: UserRole,
  actorUserId: string,
): string | null {
  if (role === "VENTAS_SYSTRON") return actorUserId;
  return null;
}
