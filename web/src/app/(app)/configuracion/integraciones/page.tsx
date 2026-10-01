import { redirect } from "next/navigation";
import { IntegrationsForm } from "@/components/config/integrations-form";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import { listIntegrationsForCompany } from "@/server/integrations/status";
import { canManageIntegrations } from "@/server/rbac/roles";

export const dynamic = "force-dynamic";

export default async function IntegracionesPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canManageIntegrations(auth.actor.role) || auth.viewAsActive) {
    redirect("/inicio");
  }

  const companySlug = auth.activeCompany.slug as CompanySlug;
  const integrations = await listIntegrationsForCompany(auth.activeCompany.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Integraciones</h1>
        <p className="mt-1 text-sm text-slate-600">
          Configuración por empresa activa:{" "}
          <strong>{auth.activeCompany.name}</strong>. Credenciales guardadas en
          base de datos cifradas; no se muestran completas después de guardar.
        </p>
      </div>
      <IntegrationsForm companySlug={companySlug} integrations={integrations} />
    </div>
  );
}
