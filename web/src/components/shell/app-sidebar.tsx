"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, SlidersHorizontal, Users } from "lucide-react";
import { SygosLogo } from "@/components/brand/sygos-logo";
import { appNavSections } from "@/lib/nav";
import type { UserRole } from "@/db/schema";
import { canSeeNavSection } from "@/server/rbac/roles";

type AppSidebarProps = {
  activeCompany: string;
  effectiveRole: UserRole;
  showConfigIntegrations: boolean;
  showConfigGeneral: boolean;
  showConfigUsers: boolean;
  activePath?: string;
};

const sectionKey: Record<
  string,
  | "comercial"
  | "activos"
  | "operacion"
  | "administracion"
  | "capital-humano"
  | "paneles"
> = {
  Recorrido: "operacion",
  "1 · Comercial": "comercial",
  "2 · Activos y custodia": "activos",
  "3 · Operación técnica": "operacion",
  "4 · Abastecimiento": "operacion",
  "5 · Capital humano": "capital-humano",
  "6 · Paneles por rol": "paneles",
  "7 · Administración y finanzas": "administracion",
};

export function AppSidebar({
  activeCompany,
  effectiveRole,
  showConfigIntegrations,
  showConfigGeneral,
  showConfigUsers,
  activePath: activePathProp,
}: AppSidebarProps) {
  const showSystem = showConfigGeneral || showConfigUsers || showConfigIntegrations;
  const pathname = usePathname();
  const activePath = activePathProp ?? pathname;

  function linkClass(href: string) {
    const active =
      href === "/inicio"
        ? activePath === "/inicio"
        : activePath === href || activePath.startsWith(`${href}/`);
    return active
      ? "block rounded-lg px-3 py-2 text-sm bg-white/10 text-white"
      : "block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white";
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sygos-navy-sidebar text-slate-200">
      <div className="border-b border-white/10 px-4 py-5">
        <SygosLogo variant="light" className="origin-left scale-90" />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <Link
          href="/inicio"
          className={`mb-4 flex items-center gap-2 ${linkClass("/inicio")}`}
        >
          <Home className="h-4 w-4" />
          Inicio
        </Link>

        {appNavSections.map((section) => {
          const key = sectionKey[section.title];
          if (key && !canSeeNavSection(effectiveRole, key)) return null;
          return (
            <div key={section.title} className="mb-5">
              <p className="mb-2 px-3 text-[10px] font-semibold tracking-wider text-slate-500">
                {section.title.toUpperCase()}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className={linkClass(item.href)}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {showSystem && (
          <div className="mb-5">
            <p className="mb-2 px-3 text-[10px] font-semibold tracking-wider text-slate-500">
              SISTEMA
            </p>
            <ul className="space-y-0.5">
              {showConfigGeneral && (
                <li>
                  <Link
                    href="/configuracion/general"
                    className={`flex items-center gap-2 ${linkClass("/configuracion/general")}`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    General
                  </Link>
                </li>
              )}
              {showConfigUsers && (
                <li>
                  <Link
                    href="/configuracion/usuarios"
                    className={`flex items-center gap-2 ${linkClass("/configuracion/usuarios")}`}
                  >
                    <Users className="h-4 w-4" />
                    Usuarios
                  </Link>
                </li>
              )}
              {showConfigIntegrations && (
                <li>
                  <Link
                    href="/configuracion/integraciones"
                    className={`flex items-center gap-2 ${linkClass("/configuracion/integraciones")}`}
                  >
                    <Settings className="h-4 w-4" />
                    Integraciones
                  </Link>
                </li>
              )}
              {showConfigGeneral && (
                <>
                  <li>
                    <Link
                      href="/configuracion/modo-pruebas"
                      className={linkClass("/configuracion/modo-pruebas")}
                    >
                      Modo de pruebas
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/configuracion/cierre-e2e"
                      className={linkClass("/configuracion/cierre-e2e")}
                    >
                      Cierre E2E
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="text-[10px] font-semibold tracking-wide text-slate-500">
          EMPRESA ACTIVA
        </p>
        <p className="mt-1 text-sm font-medium text-white">{activeCompany}</p>
      </div>
    </aside>
  );
}
