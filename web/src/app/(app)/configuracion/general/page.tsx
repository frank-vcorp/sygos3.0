import { redirect } from "next/navigation";
import { CompanySettingsForm } from "@/components/config/company-settings-form";
import { getCompanySettings } from "@/server/config/company-settings";
import { getAuthContext } from "@/server/auth/session";
import {
  canManageCompanyCapabilities,
  canManageCompanySettings,
} from "@/server/rbac/users-admin";

export const dynamic = "force-dynamic";

export default async function ConfigGeneralPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canManageCompanySettings(auth.actor.role) || auth.viewAsActive) {
    redirect("/inicio");
  }

  const settings = await getCompanySettings(auth.activeCompany.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Configuración general
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Parámetros de la empresa activa:{" "}
          <strong>{auth.activeCompany.name}</strong>. Los cambios no reescriben
          operaciones históricas ya congeladas.
        </p>
      </div>
      <CompanySettingsForm
        settings={settings}
        companyName={auth.activeCompany.name}
        companySlug={auth.activeCompany.slug}
        canEditCapabilities={canManageCompanyCapabilities(auth.actor.role)}
      />
    </div>
  );
}
