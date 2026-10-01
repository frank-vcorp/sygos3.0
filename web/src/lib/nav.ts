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
      { label: "Clientes", href: "/inicio" },
      { label: "Prospectos", href: "/inicio" },
    ],
  },
  {
    title: "Activos",
    items: [
      { label: "Equipos EQUI", href: "/inicio" },
      { label: "Motores MOT", href: "/inicio" },
      { label: "Almacén", href: "/inicio" },
    ],
  },
  {
    title: "Operación",
    items: [
      { label: "Operación técnica", href: "/inicio" },
      { label: "Cotizaciones", href: "/inicio" },
      { label: "Inventario", href: "/inicio" },
      { label: "Compras y O.C.", href: "/inicio" },
      { label: "Proveedores", href: "/inicio" },
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

export type ActiveCompany = "SYSTRON" | "Servomotores";
