import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProspectDetailPanel } from "@/components/masters/prospect-forms";
import type { CompanySlug } from "@/lib/company";
import { getProspectDetail } from "@/server/masters/prospects";
import { listCommercialResponsibleOptions } from "@/server/masters/responsible";
import { getAuthContext } from "@/server/auth/session";
import {
  canConvertProspect,
  canSeeProspects,
} from "@/server/rbac/masters";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ProspectoDetallePage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeProspects(auth.effective.role)) redirect("/inicio");

  const { id } = await params;
  const detail = await getProspectDetail({
    companyId: auth.activeCompany.id,
    prospectId: id,
  });
  if (!detail) notFound();

  const companySlug = auth.activeCompany.slug as CompanySlug;
  const responsibleOptions = await listCommercialResponsibleOptions(
    companySlug,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/comercial/prospectos"
        className="text-sm text-sky-800 hover:underline"
      >
        ← Prospectos
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">
        {detail.prospect.name}
      </h1>
      <ProspectDetailPanel
        prospect={detail.prospect}
        responsibleName={detail.responsible?.displayName ?? "—"}
        convertedClientName={detail.convertedClientName}
        convertedClientId={detail.prospect.convertedClientId}
        canConvert={canConvertProspect(auth.effective.role, companySlug)}
        responsibleOptions={responsibleOptions}
      />
    </div>
  );
}
