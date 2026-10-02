import type { UserRole } from "@/db/schema";
import type { CompanySlug } from "@/lib/company";
import { isSuperAdmin } from "@/server/rbac/roles";

export function canSeeBillingModule(role: UserRole): boolean {
  if (isSuperAdmin(role) || role === "CEO" || role === "ADMINISTRADOR") {
    return true;
  }
  if (role === "COORDINACION_ADMINISTRACION") return true;
  if (role === "VENTAS_SYSTRON") return true;
  if (role === "GERENTE_OPERATIVO_SERVOMOTORES") return true;
  return false;
}

export function canRequestFiscalDocument(role: UserRole, slug: CompanySlug): boolean {
  if (isSuperAdmin(role) || role === "CEO" || role === "ADMINISTRADOR") return true;
  if (role === "VENTAS_SYSTRON" && slug === "SYSTRON") return true;
  if (role === "GERENTE_OPERATIVO_SERVOMOTORES" && slug === "SERVOMOTORES") {
    return true;
  }
  return false;
}

export function canEmitFiscalDocument(role: UserRole): boolean {
  return (
    isSuperAdmin(role) ||
    role === "CEO" ||
    role === "ADMINISTRADOR" ||
    role === "COORDINACION_ADMINISTRACION"
  );
}

export function canApproveFiscalCancellation(role: UserRole): boolean {
  return isSuperAdmin(role) || role === "CEO" || role === "ADMINISTRADOR";
}

export function canValidatePayments(role: UserRole): boolean {
  return canEmitFiscalDocument(role);
}

export function canRegisterPayments(role: UserRole): boolean {
  return canSeeBillingModule(role);
}

export function vendorClientScopeUserId(role: UserRole, userId: string): string | null {
  if (role === "VENTAS_SYSTRON") return userId;
  return null;
}
