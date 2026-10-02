import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPurchaseOrderFolio } from "@/server/masters/folios";
import { buildCeoPanel } from "@/server/panels/aggregates";
import { getAuthContext } from "@/server/auth/session";
import { canSeeCeoPanel } from "@/server/rbac/panels";

export const dynamic = "force-dynamic";

export default async function PanelCeoPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeCeoPanel(auth.effective.role)) redirect("/inicio");

  const panel = await buildCeoPanel(auth.activeCompany.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Panel CEO</h1>
      <PanelSection title="O.C. pendientes de autorización">
        {panel.purchaseOrders.map((o) => (
          <Row key={o.id} href={`/operacion/oc/${o.id}`} label={`${formatPurchaseOrderFolio(o.folioNumber)} · ${o.concept}`} />
        ))}
      </PanelSection>
      <PanelSection title="Pendientes de cotizar">
        {panel.quotesPendingPricing.map((q) => (
          <Row key={q.id} href={`/comercial/cotizaciones/${q.id}`} label={`${q.folio} · ${q.clientName ?? ""}`} />
        ))}
      </PanelSection>
      <PanelSection title="Vacaciones por autorizar">
        {panel.vacations.map((v) => (
          <Row key={v.id} href="/capital-humano/vacaciones" label={`${v.weekdayDays} d · ${v.status}`} />
        ))}
      </PanelSection>
      <PanelSection title="Horas extra pendientes CEO">
        {panel.overtime.map((o) => (
          <Row key={o.id} href="/capital-humano/mis-horas-extra" label={`${o.hours}h · ${o.rateKind}`} />
        ))}
      </PanelSection>
    </div>
  );
}

function PanelSection(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold">{props.title}</h2>
      <ul className="mt-2 divide-y text-sm">{props.children}</ul>
    </section>
  );
}

function Row(props: { href: string; label: string }) {
  return (
    <li className="py-2">
      <Link href={props.href} className="text-sygos-teal">
        {props.label}
      </Link>
    </li>
  );
}
