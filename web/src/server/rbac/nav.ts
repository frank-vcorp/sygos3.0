import type { UserRole } from "@/db/schema";
import type { NavItemId } from "@/lib/nav";
import {
  canSeeCeoPanel,
  canSeeCoordinationPanel,
  canSeeGerenteSmPanel,
  canSeeOpsSystronPanel,
  canSeeProductionAnalytics,
  canSeeReports,
  canSeeTechnicianPanel,
} from "@/server/rbac/panels";
import { canSeeOwnOvertime } from "@/server/rbac/hr";
import { isSuperAdmin } from "@/server/rbac/roles";

const leadership: UserRole[] = [
  "ADMINISTRADOR",
  "CEO",
  "COORDINACION_ADMINISTRACION",
];

function isLeadership(role: UserRole): boolean {
  return leadership.includes(role) || isSuperAdmin(role);
}

export type NavSectionKey =
  | "comercial"
  | "activos"
  | "operacion"
  | "compras"
  | "capital-humano"
  | "paneles"
  | "administracion"
  | "config";

/** Secciones del sidebar = áreas/módulos del discovery. */
export function canSeeNavSection(role: UserRole, section: NavSectionKey): boolean {
  if (section === "config") return false;

  if (section === "capital-humano") {
    if (isLeadership(role)) return true;
    if (role === "KIOSCO") return false;
    if (role === "AYUDANTE_GENERAL_SERVOMOTORES") return true;
    return canSeeOwnOvertime(role);
  }

  if (section === "paneles") {
    return (
      canSeeCeoPanel(role) ||
      canSeeCoordinationPanel(role) ||
      canSeeGerenteSmPanel(role) ||
      canSeeTechnicianPanel(role) ||
      canSeeOpsSystronPanel(role)
    );
  }

  if (isLeadership(role)) return true;

  if (role === "VENTAS_SYSTRON") {
    return section === "comercial";
  }
  if (role === "GERENTE_OPERATIVO_SYSTRON") {
    return section === "operacion" || section === "activos" || section === "compras";
  }
  if (role === "GERENTE_OPERATIVO_SERVOMOTORES") {
    return (
      section === "comercial" ||
      section === "activos" ||
      section === "operacion" ||
      section === "compras"
    );
  }
  if (role === "TECNICO_SYSTRON" || role === "SUPERVISOR_TECNICO_SYSTRON") {
    return section === "operacion" || section === "activos";
  }
  if (role === "ALMACEN_SYSTRON") {
    return section === "activos";
  }

  return section === "comercial";
}

export function canSeeNavItem(role: UserRole, itemId: NavItemId): boolean {
  if (itemId === "paneles.ceo") return canSeeCeoPanel(role);
  if (itemId === "paneles.coordinacion") return canSeeCoordinationPanel(role);
  if (itemId === "paneles.gerente-sm") return canSeeGerenteSmPanel(role);
  if (itemId === "paneles.tecnico") return canSeeTechnicianPanel(role);
  if (itemId === "paneles.operacion-systron") return canSeeOpsSystronPanel(role);

  if (itemId === "admin.reportes") return canSeeReports(role);
  if (itemId === "admin.produccion-tecnica") return canSeeProductionAnalytics(role);

  if (isLeadership(role)) return true;

  if (role === "VENTAS_SYSTRON") {
    const allowed: NavItemId[] = [
      "comercial.clientes",
      "comercial.prospectos",
      "comercial.cotizaciones",
      "comercial.ventas",
      "comercial.panel",
      "comercial.agenda",
    ];
    return allowed.includes(itemId);
  }

  if (role === "GERENTE_OPERATIVO_SERVOMOTORES") {
    if (itemId === "comercial.metas") return false;
    if (itemId === "activos.inventario-refacciones") return false;
  }

  if (role === "TECNICO_SYSTRON") {
    const allowed: NavItemId[] = ["operacion.tecnica", "activos.equi", "activos.custodia"];
    return allowed.includes(itemId);
  }

  if (role === "ALMACEN_SYSTRON") {
    const allowed: NavItemId[] = [
      "activos.custodia",
      "activos.equi",
      "activos.inventario-refacciones",
    ];
    return allowed.includes(itemId);
  }

  if (role === "KIOSCO") {
    return itemId === "rh.mis-horas-extra";
  }

  return true;
}
