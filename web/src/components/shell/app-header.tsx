import { ChevronDown, Search, UserCircle2 } from "lucide-react";
import type { ActiveCompany } from "@/lib/nav";

type AppHeaderProps = {
  workspaceLabel: string;
  activeCompany: ActiveCompany;
  userName: string;
  userRole: string;
  viewAsLabel?: string;
};

export function AppHeader({
  workspaceLabel,
  activeCompany,
  userName,
  userRole,
  viewAsLabel = "Yo (admin)",
}: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <p className="text-xs font-medium text-slate-500">{workspaceLabel}</p>

        <div className="relative mx-auto w-full max-w-md flex-1 basis-full sm:basis-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar clientes, equipos, folio…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-sygos-teal focus:ring-1 focus:ring-sygos-teal/30"
            disabled
            title="Búsqueda global — Fase 1 pendiente"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="hidden text-slate-500 sm:inline">Empresa</span>
          {(["SYSTRON", "Servomotores"] as ActiveCompany[]).map((company) => (
            <button
              key={company}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                company === activeCompany
                  ? "bg-sygos-navy text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {company}
            </button>
          ))}

          <div className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600">
            Ver como
            <ChevronDown className="h-3.5 w-3.5" />
            <span className="font-medium text-slate-800">{viewAsLabel}</span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <UserCircle2 className="h-8 w-8 text-slate-400" />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-slate-900">{userName}</p>
              <p className="text-[10px] font-semibold tracking-wide text-slate-500">
                {userRole}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
