import type { UserRole } from "@/db/schema";
import { isSuperAdmin } from "@/server/rbac/roles";

export function canSeePurchasesModule(role: UserRole): boolean {
  return (
    isSuperAdmin(role) ||
    role === "CEO" ||
    role === "ADMINISTRADOR" ||
    role === "COORDINACION_ADMINISTRACION" ||
    role === "GERENTE_OPERATIVO_SYSTRON" ||
    role === "GERENTE_OPERATIVO_SERVOMOTORES"
  );
}

export function canRegisterDirectPurchase(role: UserRole): boolean {
  return (
    role === "GERENTE_OPERATIVO_SYSTRON" ||
    role === "GERENTE_OPERATIVO_SERVOMOTORES" ||
    isSuperAdmin(role) ||
    role === "CEO" ||
    role === "ADMINISTRADOR"
  );
}

export function canManagePurchaseOrders(role: UserRole): boolean {
  return canSeePurchasesModule(role);
}

export function canAuthorizePurchaseOrder(role: UserRole): boolean {
  return isSuperAdmin(role) || role === "CEO";
}

export function canProcessPurchases(role: UserRole): boolean {
  return (
    isSuperAdmin(role) ||
    role === "CEO" ||
    role === "ADMINISTRADOR" ||
    role === "COORDINACION_ADMINISTRACION"
  );
}
