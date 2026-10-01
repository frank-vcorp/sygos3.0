import { redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import { AppHeader } from "@/components/shell/app-header";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { ContextBanners } from "@/components/shell/context-banners";
import { ViewAsBanner } from "@/components/shell/view-as-banner";
import { getDb } from "@/db/client";
import { companies } from "@/db/schema";
import { companySlugToLabel, type CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import { getMissingIntegrations } from "@/server/integrations/status";
import {
  canManageIntegrations,
  canUseViewAs,
  roleLabel,
} from "@/server/rbac/roles";
import { canGlobalSearch, canManageCompanySettings, canManageUsers } from "@/server/rbac/users-admin";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (auth.mustChangePassword) redirect("/cambiar-contrasena");

  const db = getDb();
  const companyRows =
    auth.companyIds.length > 0
      ? await db
          .select()
          .from(companies)
          .where(inArray(companies.id, auth.companyIds))
      : [];

  const allowedSlugs = companyRows.map(
    (c) => c.slug as CompanySlug,
  );
  const activeSlug = auth.activeCompany.slug as CompanySlug;
  const missingIntegrations = await getMissingIntegrations(
    auth.activeCompany.id,
  );

  const viewAsLabel = auth.viewAsActive
    ? `${auth.effective.displayName}`
    : "Yo (admin)";

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AppSidebar
        activeCompany={companySlugToLabel(activeSlug)}
        effectiveRole={auth.effective.role}
        showConfigIntegrations={
          canManageIntegrations(auth.actor.role) && !auth.viewAsActive
        }
        showConfigGeneral={
          canManageCompanySettings(auth.actor.role) && !auth.viewAsActive
        }
        showConfigUsers={
          canManageUsers(auth.actor.role) && !auth.viewAsActive
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          workspaceLabel={`Espacio de trabajo ${companySlugToLabel(activeSlug)}`}
          activeCompanySlug={activeSlug}
          allowedCompanySlugs={allowedSlugs}
          userName={auth.effective.displayName}
          userRole={roleLabel(auth.effective.role)}
          viewAsEnabled={canUseViewAs(auth.actor.role)}
          viewAsActive={auth.viewAsActive}
          viewAsLabel={viewAsLabel}
          globalSearchEnabled={canGlobalSearch(auth.effective.role)}
        />
        {auth.viewAsActive && (
          <ViewAsBanner
            effectiveName={auth.effective.displayName}
            effectiveRoleLabel={roleLabel(auth.effective.role)}
            companyName={auth.activeCompany.name}
          />
        )}
        <ContextBanners
          activeCompany={companySlugToLabel(activeSlug)}
          missingIntegrations={missingIntegrations}
        />
        <main className="relative flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
