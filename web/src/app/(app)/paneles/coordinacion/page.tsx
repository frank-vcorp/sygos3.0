import { redirect } from "next/navigation";
import { PanelRow, PanelSection } from "@/components/panels/panel-ui";
import {
  formatDirectPurchaseFolio,
  formatFiscalFolio,
  formatPaymentFolio,
  formatPurchaseOrderFolio,
  formatPayrollFolio,
} from "@/server/masters/folios";
import { formatMxn } from "@/server/commercial/money";
import { buildCoordinationPanel } from "@/server/panels/aggregates";
import { getAuthContext } from "@/server/auth/session";
import { canSeeCoordinationPanel } from "@/server/rbac/panels";

export const dynamic = "force-dynamic";

export default async function PanelCoordPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeCoordinationPanel(auth.effective.role)) redirect("/inicio");

  const panel = await buildCoordinationPanel(auth.activeCompany.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Panel Coordinación</h1>

      <PanelSection title="Pagos por validar">
        {panel.paymentsToValidate.map((p) => (
          <PanelRow
            key={p.id}
            href="/administracion/pagos"
            label={`${formatPaymentFolio(p.folioNumber)} · ${formatMxn(p.amountMxn)} · ${p.clientName ?? "—"}`}
          />
        ))}
      </PanelSection>

      <PanelSection title="Remisiones / facturación pendiente">
        {panel.remisiones.map((d) => (
          <PanelRow
            key={d.id}
            href={`/administracion/facturacion/${d.id}`}
            label={`${formatFiscalFolio(d.docKind, d.folioNumber)} · ${d.clientName}`}
          />
        ))}
        {panel.facturasPendientes.map((d) => (
          <PanelRow
            key={d.id}
            href={`/administracion/facturacion/${d.id}`}
            label={`${formatFiscalFolio(d.docKind, d.folioNumber)} · ${d.clientName}`}
          />
        ))}
      </PanelSection>

      <PanelSection title="CxC vencidas">
        {panel.cxcOverdue.map((r) => (
          <PanelRow
            key={r.arId}
            href={`/administracion/cobranza/${r.arId}`}
            label={`${r.clientName} · ${formatMxn(r.balanceMxn)}`}
          />
        ))}
      </PanelSection>

      <PanelSection title="CxP vencidas">
        {panel.cxpOverdue.map((p) => (
          <PanelRow
            key={p.id}
            href="/administracion/cxp"
            label={`${p.supplierName} · ${formatMxn(p.balanceMxn)}`}
          />
        ))}
      </PanelSection>

      <PanelSection title="Comprobación SM pendiente">
        {panel.pendingVerification.map((p) => (
          <PanelRow
            key={p.id}
            href="/administracion/cxp"
            label={`${p.supplierName ?? "Proveedor"} · ${formatMxn(p.balanceMxn)} · verificar`}
          />
        ))}
      </PanelSection>

      <PanelSection title="Nómina semanal (borrador)">
        {panel.payrollDraft.map((r) => (
          <PanelRow
            key={r.id}
            href="/capital-humano/nomina"
            label={`${formatPayrollFolio(r.folioNumber)} · ${r.weekKey}`}
          />
        ))}
      </PanelSection>

      <PanelSection title="Compras directas por validar">
        {panel.directPurchases.map(({ purchase: p }) => (
          <PanelRow
            key={p.id}
            href={`/operacion/compras/directas/${p.id}`}
            label={`${formatDirectPurchaseFolio(p.folioNumber)} · ${p.concept}`}
          />
        ))}
      </PanelSection>

      <PanelSection title="O.C. autorizadas por procesar">
        {panel.purchaseOrdersToProcess.map(({ order: o }) => (
          <PanelRow
            key={o.id}
            href={`/operacion/oc/${o.id}`}
            label={`${formatPurchaseOrderFolio(o.folioNumber)} · ${o.concept}`}
          />
        ))}
      </PanelSection>
    </div>
  );
}
