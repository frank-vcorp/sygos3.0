import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DiagnosticActionsPanel } from "@/components/ops/ops-forms";
import type { CompanySlug } from "@/lib/company";
import { listBitacora } from "@/server/ops/bitacora";
import { getDiagnosticDetail } from "@/server/ops/diagnostics";
import { getAuthContext } from "@/server/auth/session";
import { canSeeTechnicalOps } from "@/server/rbac/ops";
import { resolveCompanyIds } from "@/server/assets/context";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function DiagnosticoDetallePage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeTechnicalOps(auth.effective.role)) redirect("/inicio");

  const { id } = await params;
  const detail = await getDiagnosticDetail(id);
  if (!detail) notFound();

  const ids = await resolveCompanyIds();
  const slug = auth.activeCompany.slug as CompanySlug;
  const readOnly =
    slug === "SYSTRON" &&
    detail.diagnostic.companyId === ids.servomotoresId;

  const entries = await listBitacora({ diagnosticId: id });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/operacion/diagnosticos" className="text-sm text-sky-800 hover:underline">
        ← Diagnósticos
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{detail.folio}</h1>
        <p className="text-sm text-slate-600">
          {detail.clientName} · {detail.assetLabel} · {detail.attention?.attentionType}
        </p>
        <p className="text-sm text-slate-500">
          {detail.attention?.reportedFailure} · Estado {detail.diagnostic.status}
        </p>
        {detail.diagnostic.status === "VALIDADO" && (
          <p className="mt-2 text-sm text-emerald-800">
            Validado —{" "}
            <a href="/comercial/pendientes-cotizar" className="text-sygos-teal underline">
              pendiente de cotizar
            </a>
            .
          </p>
        )}
      </div>
      <DiagnosticActionsPanel
        diagnosticId={id}
        status={detail.diagnostic.status}
        readOnly={readOnly}
        equiId={detail.attention?.equiId}
      />
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold">Bitácora</h2>
        <ul className="mt-3 divide-y text-sm">
          {entries.length === 0 && <li className="py-2 text-slate-500">Sin entradas.</li>}
          {entries.map((e) => (
            <li key={e.id} className="py-2">
              <p>{e.body}</p>
              <p className="text-xs text-slate-500">
                {e.authorName} · {new Date(e.createdAt).toLocaleString("es-MX")}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
