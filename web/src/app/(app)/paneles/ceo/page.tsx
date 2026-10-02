import { redirect } from "next/navigation";
import { PanelRow, PanelSection, SummaryGrid } from "@/components/panels/panel-ui";
import { formatPurchaseOrderFolio, formatPayrollFolio } from "@/server/masters/folios";
import { formatMxn } from "@/server/commercial/money";
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

      <SummaryGrid
        items={[
          {
            label: "Facturado (mes)",
            value: formatMxn(panel.commercialSummary.facturadoMesMxn),
            href: "/administracion/finanzas",
          },
          {
            label: "CxC abierta",
            value: formatMxn(panel.commercialSummary.cxcMxn),
            href: "/administracion/cobranza",
          },
          {
            label: "SLA vencidos",
            value: String(panel.productionSummary.slaOverdue),
            href: "/administracion/produccion-tecnica",
          },
          {
            label: "Comisiones devengadas",
            value: formatMxn(panel.commissionPendingMxn),
            href: "/capital-humano/comisiones",
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-4 text-sm">
          <h2 className="font-semibold">Resumen comercial</h2>
          <ul className="mt-2 space-y-1 text-slate-600">
            <li>Cotizaciones por precio: {panel.commercialSummary.quotesToPrice}</li>
            <li>Cobrado mes: {formatMxn(panel.commercialSummary.cobradoMesMxn)}</li>
            <li>
              Conversión mes:{" "}
              {panel.productionSummary.conversionPct != null
                ? `${panel.productionSummary.conversionPct}%`
                : "—"}
            </li>
          </ul>
        </section>
        <section className="rounded-xl border bg-white p-4 text-sm">
          <h2 className="font-semibold">Resumen financiero</h2>
          <ul className="mt-2 space-y-1 text-slate-600">
            <li>Egresos mes: {formatMxn(panel.financeSummary.egresosMxn)}</li>
            <li>Flujo neto mes: {formatMxn(panel.financeSummary.flujoNetoMxn)}</li>
            <li>CxP abierta: {formatMxn(panel.financeSummary.cxpMxn)}</li>
            <li>Reparaciones cerradas mes: {panel.productionSummary.repairsClosedMonth}</li>
          </ul>
        </section>
      </div>

      <PanelSection title="Decisiones · O.C. pendientes de autorización">
        <PanelRow
          href="/operacion/oc?vista=pendientes-ceo"
          label="Ver bandeja completa →"
        />
        {panel.purchaseOrders.map((o) => (
          <PanelRow
            key={o.id}
            href={`/operacion/oc/${o.id}`}
            label={`${formatPurchaseOrderFolio(o.folioNumber)} · ${o.concept}`}
          />
        ))}
      </PanelSection>
      <PanelSection title="Decisiones · Nómina en borrador">
        {panel.payrollDraft.map((r) => (
          <PanelRow
            key={r.id}
            href="/capital-humano/nomina"
            label={`${formatPayrollFolio(r.folioNumber)} · ${r.weekKey} · ${r.status}`}
          />
        ))}
      </PanelSection>
      <PanelSection title="Cancelaciones fiscales solicitadas">
        {panel.fiscalCancellations.map((d) => (
          <PanelRow key={d.href} href={d.href} label={d.label} />
        ))}
      </PanelSection>
      <PanelSection title="Notas de crédito por aprobar">
        {panel.creditNotesPending.map((d) => (
          <PanelRow key={d.href} href={d.href} label={d.label} />
        ))}
      </PanelSection>
      <PanelSection title="Garantías · decisión comercial CEO">
        {panel.warrantyCommercialPending.map((w) => (
          <PanelRow key={w.href} href={w.href} label={w.label} />
        ))}
      </PanelSection>
      <PanelSection title="Pendientes de cotizar">
        {panel.quotesPendingPricing.map((q) => (
          <PanelRow
            key={q.id}
            href={`/comercial/cotizaciones/${q.id}`}
            label={`${q.folio} · ${q.clientName ?? ""}`}
          />
        ))}
      </PanelSection>
      <PanelSection title="Vacaciones por autorizar">
        {panel.vacations.map((v) => (
          <PanelRow
            key={v.id}
            href="/capital-humano/vacaciones"
            label={`${v.employeeName ?? "Colaborador"} · ${v.weekdayDays} d · ${v.status}`}
          />
        ))}
      </PanelSection>
      <PanelSection title="Horas extra pendientes CEO">
        {panel.overtime.map((o) => (
          <PanelRow
            key={o.id}
            href="/capital-humano/mis-horas-extra"
            label={`${o.hours}h · ${o.rateKind}`}
          />
        ))}
      </PanelSection>
    </div>
  );
}
