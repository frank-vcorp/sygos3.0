import Link from "next/link";
import { redirect } from "next/navigation";
import type { CompanySlug } from "@/lib/company";
import { listDiagnostics } from "@/server/ops/diagnostics";
import { getAuthContext } from "@/server/auth/session";
import { canValidateDiagnostics } from "@/server/rbac/ops";

export const dynamic = "force-dynamic";

export default async function ValidacionDiagnosticosPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const slug = auth.activeCompany.slug as CompanySlug;
  if (!canValidateDiagnostics(auth.effective.role, slug)) redirect("/operacion/tecnica");

  const rows = await listDiagnostics({
    activeSlug: slug,
    companyId: auth.activeCompany.id,
    validationQueue: true,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Diagnósticos pendientes de validación</h1>
      <ul className="divide-y rounded-xl border bg-white">
        {rows.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-slate-500">Bandeja vacía.</li>
        )}
        {rows.map((r) => (
          <li key={r.id} className="px-4 py-3 text-sm">
            <Link href={`/operacion/diagnosticos/${r.id}`} className="font-medium text-sky-800 hover:underline">
              {r.folio}
            </Link>{" "}
            — {r.reportedFailure?.slice(0, 80)}
          </li>
        ))}
      </ul>
    </div>
  );
}
