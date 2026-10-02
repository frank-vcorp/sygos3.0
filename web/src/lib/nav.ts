/**
 * Sidebar alineado a módulos del discovery (§3–§10), no a fases de implementación.
 * Bandejas (p. ej. pendientes de cotizar) viven dentro del módulo, no como ítems sueltos.
 */
export type NavItemId =
  | "comercial.clientes"
  | "comercial.prospectos"
  | "comercial.cotizaciones"
  | "comercial.ventas"
  | "comercial.panel"
  | "comercial.agenda"
  | "comercial.metas"
  | "activos.custodia"
  | "activos.equi"
  | "activos.mot"
  | "activos.inventario-refacciones"
  | "operacion.tecnica"
  | "compras.modulo"
  | "rh.colaboradores"
  | "rh.nomina"
  | "rh.vacaciones"
  | "rh.comisiones"
  | "rh.mis-horas-extra"
  | "paneles.ceo"
  | "paneles.coordinacion"
  | "paneles.gerente-sm"
  | "paneles.tecnico"
  | "paneles.operacion-systron"
  | "admin.facturacion"
  | "admin.pagos"
  | "admin.cobranza"
  | "admin.cxp"
  | "admin.finanzas"
  | "admin.reportes"
  | "admin.produccion-tecnica";

export type NavItem = {
  id: NavItemId;
  label: string;
  href: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const appNavSections: NavSection[] = [
  {
    title: "Comercial",
    items: [
      { id: "comercial.clientes", label: "Clientes", href: "/comercial/clientes" },
      { id: "comercial.prospectos", label: "Prospectos", href: "/comercial/prospectos" },
      {
        id: "comercial.cotizaciones",
        label: "Cotizaciones",
        href: "/comercial/cotizaciones",
      },
      { id: "comercial.ventas", label: "Ventas de equipo", href: "/comercial/ventas" },
      {
        id: "comercial.panel",
        label: "Panel comercial",
        href: "/comercial/panel",
      },
      { id: "comercial.agenda", label: "Agenda", href: "/comercial/agenda" },
      { id: "comercial.metas", label: "Metas comerciales", href: "/comercial/metas" },
    ],
  },
  {
    title: "Custodia e inventario",
    items: [
      {
        id: "activos.custodia",
        label: "Custodia física",
        href: "/activos/almacen",
      },
      { id: "activos.equi", label: "Equipos EQUI", href: "/activos/equi" },
      { id: "activos.mot", label: "Motores MOT", href: "/activos/mot" },
      {
        id: "activos.inventario-refacciones",
        label: "Inventario refacciones",
        href: "/operacion/inventario",
      },
    ],
  },
  {
    title: "Operación técnica",
    items: [
      {
        id: "operacion.tecnica",
        label: "Operación técnica",
        href: "/operacion/tecnica",
      },
    ],
  },
  {
    title: "Compras y proveedores",
    items: [
      {
        id: "compras.modulo",
        label: "Compras y proveedores",
        href: "/operacion/abastecimiento",
      },
    ],
  },
  {
    title: "Personal y nómina",
    items: [
      { id: "rh.colaboradores", label: "Colaboradores", href: "/capital-humano/colaboradores" },
      { id: "rh.nomina", label: "Nómina", href: "/capital-humano/nomina" },
      { id: "rh.vacaciones", label: "Vacaciones", href: "/capital-humano/vacaciones" },
      { id: "rh.comisiones", label: "Comisiones", href: "/capital-humano/comisiones" },
      {
        id: "rh.mis-horas-extra",
        label: "Mis horas extra",
        href: "/capital-humano/mis-horas-extra",
      },
    ],
  },
  {
    title: "Paneles",
    items: [
      { id: "paneles.ceo", label: "Panel CEO", href: "/paneles/ceo" },
      {
        id: "paneles.coordinacion",
        label: "Panel Coordinación",
        href: "/paneles/coordinacion",
      },
      { id: "paneles.gerente-sm", label: "Panel Gerente SM", href: "/paneles/gerente-sm" },
      { id: "paneles.tecnico", label: "Panel técnico", href: "/paneles/tecnico" },
      {
        id: "paneles.operacion-systron",
        label: "Panel operación SYSTRON",
        href: "/paneles/operacion-systron",
      },
    ],
  },
  {
    title: "Facturación y finanzas",
    items: [
      { id: "admin.facturacion", label: "Facturación", href: "/administracion/facturacion" },
      { id: "admin.pagos", label: "Pagos", href: "/administracion/pagos" },
      { id: "admin.cobranza", label: "Cobranza (CxC)", href: "/administracion/cobranza" },
      { id: "admin.cxp", label: "CxP", href: "/administracion/cxp" },
      { id: "admin.finanzas", label: "Finanzas", href: "/administracion/finanzas" },
      { id: "admin.reportes", label: "Reportes", href: "/reportes" },
      {
        id: "admin.produccion-tecnica",
        label: "Producción técnica (analítica)",
        href: "/administracion/produccion-tecnica",
      },
    ],
  },
];

/** @deprecated usar CompanySlug en lib/company */
export type ActiveCompany = "SYSTRON" | "Servomotores";
