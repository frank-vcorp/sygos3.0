import Link from "next/link";
import { redirect } from "next/navigation";
import { ProspectCreateForm } from "@/components/masters/prospect-forms";
import type { CompanySlug } from "@/lib/company";
import { listCommercialResponsibleOptions } from "@/server/masters/responsible";
import { getAuthContext } from "@/server/auth/session";
import { canCreateProspect } from "@/server/rbac/masters";

export const dynamic = "force-dynamic";

export default async function NuevoProspectoPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const companySlug = auth.activeCompany.slug as CompanySlug;
  if (!canCreateProspect(auth.effective.role, companySlug)) {
    redirect("/comercial/prospectos");
  }

  const responsibleOptions = await listCommercialResponsibleOptions(
    companySlug,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/comercial/prospectos"
        className="text-sm text-sky-800 hover:underline"
      >
        ← Prospectos
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">Nuevo prospecto</h1>
      <ProspectCreateForm responsibleOptions={responsibleOptions} />
    </div>
  );
}
