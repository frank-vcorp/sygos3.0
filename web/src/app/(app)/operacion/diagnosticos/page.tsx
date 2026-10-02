import Link from "next/link";
import { redirect } from "next/navigation";
import { DiagnosticListTabs } from "@/components/ops/diagnostic-list-tabs";
import { ListShell } from "@/components/masters/list-shell";
import {
  attentionTypeLabel,
  diagnosticStatusLabel,
} from "@/lib/discovery/labels/diagnostics";
import type { CompanySlug } from "@/lib/company";
import { listDiagnostics } from "@/server/ops/diagnostics";
import { getAuthContext } from "@/server/auth/session";
import { canSeeTechnicalOps, canValidateDiagnostics } from "@/server/rbac/ops";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ vista?: string }> };

export default async function DiagnosticosPage({ searchParams }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeTechnicalOps(auth.effective.role)) redirect("/inicio");

  const slug = auth.activeCompany.slug as CompanySlug;
  const { vista } = await searchParams;
  const activeView =
    vista === "validacion" ? "validacion" : vista === "activos" ? "activos" : "todas";
  const showValidationTab = canValidateDiagnostics(auth.effective.role, slug);

  if (activeView === "validacion" && !showValidationTab) {
    redirect("/operacion/diagnosticos");
  }

  const rows = await listDiagnostics({
    activeSlug: slug,
    companyId: auth.activeCompany.id,
    validationQueue: activeView === "validacion",
    activeOnly: activeView === "activos",
  });

  const description =
    activeView === "validacion"
      ? "Bandeja del módulo Diagnósticos — Gerente Operativo valida o devuelve a corrección (§4.3)."
      : activeView === "activos"
        ? "Diagnósticos en curso (asignados o en ejecución)."
        : "Listado del módulo Diagnósticos. El folio abre el detalle con relaciones y acciones por estado.";

  return (
    <div className="space-y-4">
      <DiagnosticListTabs active={activeView} showValidationTab={showValidationTab} />
      <ListShell
        title="Diagnósticos"
        description={description}
        createHref="/operacion/atenciones/nueva"
        createLabel="Nueva atención"
      >
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Tipo atención</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Responsable</th>
              <th className="px-4 py-3">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/operacion/diagnosticos/${r.id}`}
                    className="font-medium text-sygos-teal hover:underline"
                  >
                    {r.folio}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {attentionTypeLabel[r.attentionType] ?? r.attentionType}
                </td>
                <td className="px-4 py-3">
                  {diagnosticStatusLabel[r.status] ?? r.status}
                </td>
                <td className="px-4 py-3">{r.frozenPriorityLabel ?? "—"}</td>
                <td className="px-4 py-3">{r.assignedName ?? "Sin asignar"}</td>
                <td className="px-4 py-3">
                  {r.slaDueAt ?
                    new Date(r.slaDueAt).toLocaleDateString("es-MX")
                  : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListShell>
    </div>
  );
}
