import Link from "next/link";
import { redirect } from "next/navigation";
import { PanelRow, PanelSection, SummaryGrid } from "@/components/panels/panel-ui";
import type { CompanySlug } from "@/lib/company";
import { buildOpsSystronPanel } from "@/server/panels/technical";
import { getAuthContext } from "@/server/auth/session";
import { canSeeOpsSystronPanel } from "@/server/rbac/panels";

export const dynamic = "force-dynamic";

export default async function PanelOperacionSystronPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeOpsSystronPanel(auth.effective.role)) redirect("/inicio");

  const panel = await buildOpsSystronPanel({
    activeSlug: auth.activeCompany.slug as CompanySlug,
    companyId: auth.activeCompany.id,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Panel operación SYSTRON</h1>
        <Link
          href="/operacion/validacion-diagnosticos"
          className="text-sm text-sygos-teal"
        >
          Cola validación diagnósticos →
        </Link>
      </div>
      <SummaryGrid
        items={[
          {
            label: "Diag. sin asignar",
            value: String(panel.counts.unassignedDiagnostics),
            href: "/operacion/diagnosticos",
          },
          {
            label: "Validación gerente",
            value: String(panel.counts.validationQueue),
            href: "/operacion/validacion-diagnosticos",
          },
          {
            label: "SLA vencido",
            value: String(panel.counts.overdueDiagnostics),
            href: "/operacion/diagnosticos",
          },
          {
            label: "En refacciones",
            value: String(panel.counts.waitingParts),
            href: "/operacion/os",
          },
        ]}
      />
      <PanelSection title="Diagnósticos sin técnico">
        {panel.unassignedDiagnostics.map((d) => (
          <PanelRow key={d.href} href={d.href} label={d.label} />
        ))}
      </PanelSection>
      <PanelSection title="Pendientes validación gerente">
        {panel.validationQueue.map((d) => (
          <PanelRow key={d.href} href={d.href} label={d.label} />
        ))}
      </PanelSection>
      <PanelSection title="SLA vencido (diagnóstico)">
        {panel.overdueDiagnostics.map((d) => (
          <PanelRow key={d.href} href={d.href} label={d.label} />
        ))}
      </PanelSection>
      <PanelSection title="Reparaciones en espera de refacciones">
        {panel.waitingParts.map((d) => (
          <PanelRow key={d.href} href={d.href} label={d.label} />
        ))}
      </PanelSection>
      <PanelSection title="OS sin asignar">
        {panel.unassignedWorkOrders.map((d) => (
          <PanelRow key={d.href} href={d.href} label={d.label} />
        ))}
      </PanelSection>
      <PanelSection title="Reparaciones activas">
        {panel.activeRepairs.map((d) => (
          <PanelRow key={d.href} href={d.href} label={d.label} />
        ))}
      </PanelSection>
    </div>
  );
}
