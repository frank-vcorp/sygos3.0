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
  section:
    | "comercial"
    | "activos"
    | "operacion"
    | "administracion"
    | "capital-humano"
    | "paneles"
    | "config",
): boolean {
  if (section === "capital-humano") {
    if (isSuperAdmin(role) || role === "CEO" || role === "ADMINISTRADOR") {
      return true;
    }
    if (role === "COORDINACION_ADMINISTRACION") return true;
    if (role === "KIOSCO") return false;
    return true;
  }
  if (section === "paneles") {
    if (isSuperAdmin(role) || role === "CEO" || role === "ADMINISTRADOR") {
      return true;
    }
    if (role === "COORDINACION_ADMINISTRACION") return true;
    if (role === "GERENTE_OPERATIVO_SERVOMOTORES") return true;
    if (
      role === "GERENTE_OPERATIVO_SYSTRON" ||
      role === "SUPERVISOR_TECNICO_SYSTRON" ||
      role === "TECNICO_SYSTRON"
    ) {
      return true;
    }
    return false;
  }
  if (isSuperAdmin(role) || role === "CEO" || role === "COORDINACION_ADMINISTRACION") {
    return true;
  }
  if (section === "config") return false;
  if (role === "VENTAS_SYSTRON") {
    return (
      section === "comercial" ||
      section === "activos" ||
      section === "operacion" ||
      section === "administracion"
    );
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
