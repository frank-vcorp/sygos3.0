import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientCreateForm } from "@/components/masters/client-create-form";
import type { CompanySlug } from "@/lib/company";
import { listCommercialResponsibleOptions } from "@/server/masters/responsible";
import { getAuthContext } from "@/server/auth/session";
import {
  canCreateClient,
  canReassignClientResponsible,
} from "@/server/rbac/masters";

export const dynamic = "force-dynamic";

export default async function NuevoClientePage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const companySlug = auth.activeCompany.slug as CompanySlug;
  if (!canCreateClient(auth.effective.role, companySlug)) {
    redirect("/comercial/clientes");
  }

  const responsibleOptions = await listCommercialResponsibleOptions(
    companySlug,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/comercial/clientes"
          className="text-sm text-sky-800 hover:underline"
        >
          ← Clientes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Nuevo cliente
        </h1>
      </div>
      <ClientCreateForm
        canPickResponsible={canReassignClientResponsible(auth.effective.role)}
        responsibleOptions={responsibleOptions}
      />
    </div>
  );
}
