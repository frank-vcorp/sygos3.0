import { UserCircle2 } from "lucide-react";
import type { CompanySlug } from "@/lib/company";
import { CompanySwitcher } from "./company-switcher";
import { GlobalSearch } from "./global-search";
import { ViewAsControl } from "./view-as-control";

type AppHeaderProps = {
  workspaceLabel: string;
  activeCompanySlug: CompanySlug;
  allowedCompanySlugs: CompanySlug[];
  userName: string;
  userRole: string;
  viewAsEnabled: boolean;
  viewAsActive: boolean;
  viewAsLabel: string;
  globalSearchEnabled: boolean;
};

export function AppHeader({
  workspaceLabel,
  activeCompanySlug,
  allowedCompanySlugs,
  userName,
  userRole,
  viewAsEnabled,
  viewAsActive,
  viewAsLabel,
  globalSearchEnabled,
}: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <p className="text-xs font-medium text-slate-500">{workspaceLabel}</p>

        <GlobalSearch enabled={globalSearchEnabled} />

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <CompanySwitcher
            activeSlug={activeCompanySlug}
            allowedSlugs={allowedCompanySlugs}
          />
          <ViewAsControl
            enabled={viewAsEnabled}
            viewAsActive={viewAsActive}
            currentLabel={viewAsLabel}
          />
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
