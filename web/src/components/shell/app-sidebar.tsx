import Link from "next/link";
import { Home } from "lucide-react";
import { SygosLogo } from "@/components/brand/sygos-logo";
import { appNavSections, type ActiveCompany } from "@/lib/nav";

type AppSidebarProps = {
  activeCompany: ActiveCompany;
  activePath?: string;
};

export function AppSidebar({
  activeCompany,
  activePath = "/inicio",
}: AppSidebarProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sygos-navy-sidebar text-slate-200">
      <div className="border-b border-white/10 px-4 py-5">
        <SygosLogo variant="light" className="scale-90 origin-left" />
        <p className="mt-1 text-[10px] text-slate-400">Monitoreo inteligente</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <Link
          href="/inicio"
          className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            activePath === "/inicio"
              ? "bg-white/10 text-white"
              : "text-slate-300 hover:bg-white/5"
          }`}
        >
          <Home className="h-4 w-4" />
          Inicio
        </Link>

        {appNavSections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="mb-2 px-3 text-[10px] font-semibold tracking-wider text-slate-500">
              {section.title.toUpperCase()}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
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
