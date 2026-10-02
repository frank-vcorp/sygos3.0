import Link from "next/link";
import { redirect } from "next/navigation";
import { ListShell } from "@/components/masters/list-shell";
import type { CompanySlug } from "@/lib/company";
import { listDiagnostics } from "@/server/ops/diagnostics";
import { getAuthContext } from "@/server/auth/session";
import { canSeeTechnicalOps } from "@/server/rbac/ops";

export const dynamic = "force-dynamic";

export default async function DiagnosticosPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeTechnicalOps(auth.effective.role)) redirect("/inicio");

  const rows = await listDiagnostics({
    activeSlug: auth.activeCompany.slug as CompanySlug,
    companyId: auth.activeCompany.id,
  });

  return (
    <ListShell
      title="Diagnósticos"
      description="Incluye reflejo de MOT SYSTRON ejecutados en Servomotores."
      createHref="/operacion/atenciones/nueva"
      createLabel="Nueva atención"
    >
      <table className="min-w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Folio</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Prioridad</th>
            <th className="px-4 py-3">SLA</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3">
                <Link href={`/operacion/diagnosticos/${r.id}`} className="font-medium text-sky-800 hover:underline">
                  {r.folio}
                </Link>
              </td>
              <td className="px-4 py-3">{r.attentionType}</td>
              <td className="px-4 py-3">{r.status}</td>
              <td className="px-4 py-3">{r.frozenPriorityLabel}</td>
              <td className="px-4 py-3">
                {r.slaDueAt ? new Date(r.slaDueAt).toLocaleDateString("es-MX") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListShell>
  );
}
