import Link from "next/link";
import { redirect } from "next/navigation";
import { PanelRow, PanelSection } from "@/components/panels/panel-ui";
import type { CompanySlug } from "@/lib/company";
import { buildTechnicianPanel } from "@/server/panels/technical";
import { getAuthContext } from "@/server/auth/session";
import { canSeeTechnicianPanel } from "@/server/rbac/panels";

export const dynamic = "force-dynamic";

type Filter = "all" | "overdue" | "refacciones";

export default async function PanelTecnicoPage(props: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeTechnicianPanel(auth.effective.role)) redirect("/inicio");

  const sp = await props.searchParams;
  const filter = (["all", "overdue", "refacciones"] as Filter[]).includes(
    sp.filtro as Filter,
  )
    ? (sp.filtro as Filter)
    : "all";

  const panel = await buildTechnicianPanel({
    userId: auth.effective.id,
    activeSlug: auth.activeCompany.slug as CompanySlug,
    companyId: auth.activeCompany.id,
    filter,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Panel técnico</h1>
        <div className="flex gap-2 text-sm">
          <FilterLink active={filter === "all"} href="/paneles/tecnico" label="Activos" />
          <FilterLink
            active={filter === "overdue"}
            href="/paneles/tecnico?filtro=overdue"
            label="SLA vencido"
          />
          <FilterLink
            active={filter === "refacciones"}
            href="/paneles/tecnico?filtro=refacciones"
            label="Refacciones"
          />
        </div>
      </div>
      <PanelSection title="Diagnósticos asignados" empty="Sin diagnósticos en esta vista.">
        {panel.diagnostics.map((d) => (
          <PanelRow key={d.href} href={d.href} label={d.label} />
        ))}
      </PanelSection>
      <PanelSection title="Órdenes de servicio asignadas" empty="Sin OS en esta vista.">
        {panel.workOrders.map((d) => (
          <PanelRow key={d.href} href={d.href} label={d.label} />
        ))}
      </PanelSection>
    </div>
  );
}

function FilterLink(props: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={props.href}
      className={
        props.active
          ? "rounded-full bg-sygos-navy px-3 py-1 text-white"
          : "rounded-full border px-3 py-1 text-slate-600 hover:border-sygos-teal"
      }
    >
      {props.label}
    </Link>
  );
}
