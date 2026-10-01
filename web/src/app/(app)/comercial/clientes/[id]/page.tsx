import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ClientDetailPanel } from "@/components/masters/client-detail-panel";
import type { CompanySlug } from "@/lib/company";
import { getClientDetail } from "@/server/masters/clients";
import { listCommercialResponsibleOptions } from "@/server/masters/responsible";
import { getAuthContext } from "@/server/auth/session";
import {
  canReassignClientResponsible,
  canSeeClients,
} from "@/server/rbac/masters";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ClienteDetallePage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeClients(auth.effective.role)) redirect("/inicio");

  const { id } = await params;
  const detail = await getClientDetail({
    companyId: auth.activeCompany.id,
    clientId: id,
  });
  if (!detail) notFound();

  const companySlug = auth.activeCompany.slug as CompanySlug;
  const responsibleOptions = await listCommercialResponsibleOptions(
    companySlug,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/comercial/clientes"
        className="text-sm text-sky-800 hover:underline"
      >
        ← Clientes
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">
        {detail.client.legalName}
      </h1>
      <ClientDetailPanel
        client={detail.client}
        contacts={detail.contacts}
        responsibleName={detail.responsible?.displayName ?? "—"}
        canReassign={canReassignClientResponsible(auth.effective.role)}
        responsibleOptions={responsibleOptions}
      />
    </div>
  );
}
