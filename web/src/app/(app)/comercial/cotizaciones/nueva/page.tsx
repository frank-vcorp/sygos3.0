import { redirect } from "next/navigation";
import { NewQuoteForm } from "@/components/commercial/commercial-forms";
import { listClients } from "@/server/masters/clients";
import { getAuthContext } from "@/server/auth/session";
import { canCreateQuoteAsVendor } from "@/server/rbac/commercial";
import { canCreateClient } from "@/server/rbac/masters";
import type { CompanySlug } from "@/lib/company";

export const dynamic = "force-dynamic";

export default async function NuevaCotizacionPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const slug = auth.activeCompany.slug as CompanySlug;
  if (!canCreateQuoteAsVendor(auth.effective.role, slug)) redirect("/inicio");

  const clients = await listClients({ companyId: auth.activeCompany.id });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Nueva cotización</h1>
      <p className="text-sm text-slate-500">
        Captura contexto comercial sin precio. CEO/Administrador fija el importe en pendientes de
        cotizar.
      </p>
      <NewQuoteForm
        clients={clients.map((c) => ({ id: c.id, legalName: c.legalName }))}
        canQuickCreateClient={canCreateClient(auth.effective.role, slug)}
      />
    </div>
  );
}
