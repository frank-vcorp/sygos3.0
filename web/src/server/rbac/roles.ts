import type { UserRole } from "@/db/schema";

export function isSuperAdmin(role: UserRole): boolean {
  return role === "ADMINISTRADOR";
}

export function canManageIntegrations(role: UserRole): boolean {
  return role === "ADMINISTRADOR";
}

export function canUseViewAs(actorRole: UserRole): boolean {
  return actorRole === "ADMINISTRADOR";
}

export { roleLabel } from "@/lib/role-labels";

/** Menú Fase 1 — ampliar por rol en iteraciones */
export function canSeeNavSection(
  role: UserRole,
  section: "comercial" | "activos" | "operacion" | "administracion" | "config",
): boolean {
  if (isSuperAdmin(role) || role === "CEO" || role === "COORDINACION_ADMINISTRACION") {
    return true;
  }
  if (section === "config") return false;
  if (role === "VENTAS_SYSTRON") {
    return section === "comercial" || section === "activos";
  }
  if (role === "GERENTE_OPERATIVO_SYSTRON") {
    return section === "operacion" || section === "activos";
  }
  if (role === "GERENTE_OPERATIVO_SERVOMOTORES") {
    return section === "comercial" || section === "activos" || section === "operacion";
  }
  if (role === "TECNICO_SYSTRON" || role === "SUPERVISOR_TECNICO_SYSTRON") {
    return section === "operacion" || section === "activos";
  }
  if (role === "ALMACEN_SYSTRON") {
    return section === "activos" || section === "operacion";
  }
  return section === "comercial";
}
