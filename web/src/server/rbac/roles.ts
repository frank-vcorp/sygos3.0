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

export function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    ADMINISTRADOR: "ADMINISTRADOR",
    CEO: "CEO",
    COORDINACION_ADMINISTRACION: "COORDINACIÓN DE ADMINISTRACIÓN",
    GERENTE_OPERATIVO_SYSTRON: "GERENTE OPERATIVO SYSTRON",
    GERENTE_OPERATIVO_SERVOMOTORES: "GERENTE OPERATIVO SERVOMOTORES",
    SUPERVISOR_TECNICO_SYSTRON: "SUPERVISOR TÉCNICO SYSTRON",
    TECNICO_SYSTRON: "TÉCNICO SYSTRON",
    VENTAS_SYSTRON: "VENTAS SYSTRON",
    ALMACEN_SYSTRON: "ALMACEN SYSTRON",
    AYUDANTE_GENERAL_SERVOMOTORES: "AYUDANTE GENERAL SERVOMOTORES",
    KIOSCO: "KIOSCO",
  };
  return labels[role] ?? role;
}

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
    return section === "comercial";
  }
  if (role === "TECNICO_SYSTRON" || role === "SUPERVISOR_TECNICO_SYSTRON") {
    return section === "operacion" || section === "activos";
  }
  if (role === "ALMACEN_SYSTRON") {
    return section === "activos" || section === "operacion";
  }
  return section === "comercial";
}
