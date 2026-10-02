export type NavItem = {
  label: string;
  href: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

/** Orden alineado a recorridos operativos (discovery): comercial → activos/custodia → técnica → abastecimiento → RH → paneles → finanzas */
export const appNavSections: NavSection[] = [
  {
    title: "Recorrido",
    items: [{ label: "Mapa de recorridos", href: "/operacion/recorrido" }],
  },
  {
    title: "1 · Comercial",
    items: [
      { label: "Clientes", href: "/comercial/clientes" },
      { label: "Nueva cotización", href: "/comercial/cotizaciones/nueva" },
      { label: "Pendientes de cotizar (CEO)", href: "/comercial/pendientes-cotizar" },
      { label: "Cotizaciones", href: "/comercial/cotizaciones" },
      { label: "Panel y seguimiento", href: "/comercial/panel" },
      { label: "Ventas de equipo", href: "/comercial/ventas" },
      { label: "Prospectos", href: "/comercial/prospectos" },
      { label: "Agenda", href: "/comercial/agenda" },
      { label: "Metas", href: "/comercial/metas" },
    ],
  },
  {
    title: "2 · Activos y custodia",
    items: [
      { label: "Almacén / ingreso físico", href: "/activos/almacen" },
      { label: "Equipos EQUI", href: "/activos/equi" },
      { label: "Motores MOT", href: "/activos/mot" },
    ],
  },
  {
    title: "3 · Operación técnica",
    items: [
      { label: "Hub técnico", href: "/operacion/tecnica" },
      { label: "Nueva atención", href: "/operacion/atenciones/nueva" },
      { label: "Diagnósticos", href: "/operacion/diagnosticos" },
      { label: "Validación gerente", href: "/operacion/validacion-diagnosticos" },
      { label: "Órdenes de servicio (OS)", href: "/operacion/os" },
      { label: "Refacciones", href: "/operacion/refacciones" },
      { label: "Producción técnica", href: "/operacion/produccion" },
    ],
  },
  {
    title: "4 · Abastecimiento",
    items: [
      { label: "Compras directas", href: "/operacion/compras" },
      { label: "Órdenes de compra", href: "/operacion/oc" },
      { label: "Proveedores", href: "/operacion/proveedores" },
      { label: "Inventario refacciones", href: "/operacion/inventario" },
    ],
  },
  {
    title: "5 · Capital humano",
    items: [
      { label: "Colaboradores", href: "/capital-humano/colaboradores" },
      { label: "Nómina", href: "/capital-humano/nomina" },
      { label: "Vacaciones", href: "/capital-humano/vacaciones" },
      { label: "Comisiones", href: "/capital-humano/comisiones" },
      { label: "Mis horas extra", href: "/capital-humano/mis-horas-extra" },
    ],
  },
  {
    title: "6 · Paneles por rol",
    items: [
      { label: "Panel CEO", href: "/paneles/ceo" },
      { label: "Panel Coordinación", href: "/paneles/coordinacion" },
      { label: "Panel Gerente SM", href: "/paneles/gerente-sm" },
      { label: "Panel técnico", href: "/paneles/tecnico" },
      { label: "Panel operación SYSTRON", href: "/paneles/operacion-systron" },
    ],
  },
  {
    title: "7 · Administración y finanzas",
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
