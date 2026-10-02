export type NavItem = {
  label: string;
  href: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

/** Placeholder Fase 1 — luego filtrado por RBAC */
export const appNavSections: NavSection[] = [
  {
    title: "Comercial",
    items: [
      { label: "Panel ventas", href: "/comercial/panel" },
      { label: "Pendientes de cotizar", href: "/comercial/pendientes-cotizar" },
      { label: "Cotizaciones", href: "/comercial/cotizaciones" },
      { label: "Ventas de equipo", href: "/comercial/ventas" },
      { label: "Agenda", href: "/comercial/agenda" },
      { label: "Metas", href: "/comercial/metas" },
      { label: "Clientes", href: "/comercial/clientes" },
      { label: "Prospectos", href: "/comercial/prospectos" },
    ],
  },
  {
    title: "Activos",
    items: [
      { label: "Equipos EQUI", href: "/activos/equi" },
      { label: "Motores MOT", href: "/activos/mot" },
      { label: "Almacén", href: "/activos/almacen" },
    ],
  },
  {
    title: "Operación",
    items: [
      { label: "Operación técnica", href: "/operacion/tecnica" },
      { label: "Inventario", href: "/operacion/inventario" },
      { label: "Refacciones", href: "/operacion/refacciones" },
      { label: "Compras directas", href: "/operacion/compras" },
      { label: "Órdenes de compra", href: "/operacion/oc" },
      { label: "Proveedores", href: "/operacion/proveedores" },
      { label: "Producción técnica", href: "/operacion/produccion" },
    ],
  },
  {
    title: "Capital humano",
    items: [
      { label: "Colaboradores", href: "/capital-humano/colaboradores" },
      { label: "Nómina", href: "/capital-humano/nomina" },
      { label: "Vacaciones", href: "/capital-humano/vacaciones" },
      { label: "Comisiones", href: "/capital-humano/comisiones" },
      { label: "Mis horas extra", href: "/capital-humano/mis-horas-extra" },
    ],
  },
  {
    title: "Paneles",
    items: [
      { label: "Panel CEO", href: "/paneles/ceo" },
      { label: "Panel Coordinación", href: "/paneles/coordinacion" },
      { label: "Panel Gerente SM", href: "/paneles/gerente-sm" },
      { label: "Panel técnico", href: "/paneles/tecnico" },
      { label: "Panel operación SYSTRON", href: "/paneles/operacion-systron" },
    ],
  },
  {
    title: "Administración",
    items: [
      { label: "Facturación", href: "/administracion/facturacion" },
      { label: "Pagos", href: "/administracion/pagos" },
      { label: "Cobranza (CxC)", href: "/administracion/cobranza" },
      { label: "CxP", href: "/administracion/cxp" },
      { label: "Finanzas", href: "/administracion/finanzas" },
      { label: "Reportes", href: "/reportes" },
      { label: "Producción técnica (analítica)", href: "/administracion/produccion-tecnica" },
    ],
  },
];

/** @deprecated usar CompanySlug en lib/company */
export type ActiveCompany = "SYSTRON" | "Servomotores";
