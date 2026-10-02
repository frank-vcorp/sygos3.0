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
      { label: "Cotizaciones", href: "/inicio" },
      { label: "Inventario", href: "/operacion/inventario" },
      { label: "Refacciones", href: "/operacion/refacciones" },
      { label: "Compras y O.C.", href: "/inicio" },
      { label: "Proveedores", href: "/operacion/proveedores" },
    ],
  },
  {
    title: "Administración",
    items: [
      { label: "Finanzas", href: "/inicio" },
      { label: "Capital humano", href: "/inicio" },
    ],
  },
];

/** @deprecated usar CompanySlug en lib/company */
export type ActiveCompany = "SYSTRON" | "Servomotores";
