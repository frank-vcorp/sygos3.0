import { redirect } from "next/navigation";
import { PanelRow, PanelSection } from "@/components/panels/panel-ui";
import { resolveCompanyIds } from "@/server/assets/context";
import type { CompanySlug } from "@/lib/company";
import { buildGerenteSmPanel } from "@/server/panels/aggregates";
import { getAuthContext } from "@/server/auth/session";
import { canSeeGerenteSmPanel } from "@/server/rbac/panels";

export const dynamic = "force-dynamic";

export default async function PanelGerenteSmPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeGerenteSmPanel(auth.effective.role)) redirect("/inicio");

  const ids = await resolveCompanyIds();
  const panel = await buildGerenteSmPanel({
    companyId: auth.activeCompany.id,
    activeSlug: auth.activeCompany.slug as CompanySlug,
    systronCompanyId: ids.systronId,
    servomotoresCompanyId: ids.servomotoresId,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Panel Gerente Operativo Servomotores</h1>

      <PanelSection title="Accesos rápidos">
        {panel.quickLinks.map((l) => (
          <PanelRow key={l.href} href={l.href} label={l.label} />
        ))}
      </PanelSection>

      <PanelSection title="Ingreso físico MOT pendiente">
        {panel.pendingIntakeMotors.map((m) => (
          <PanelRow
            key={m.id}
            href={`/activos/mot/${m.id}`}
            label={`${m.folio} · ${m.clientName}`}
          />
        ))}
      </PanelSection>

      <PanelSection title="Diagnósticos / garantías activos">
        {panel.warrantyDiagnostics.map((d) => (
          <PanelRow
            key={d.id}
            href={`/operacion/diagnosticos/${d.id}`}
            label={`${d.folio} · Garantía · ${d.status}`}
          />
        ))}
        {panel.activeDiagnostics.map((d) => (
          <PanelRow
            key={`a-${d.id}`}
            href={`/operacion/diagnosticos/${d.id}`}
            label={`${d.folio} · ${d.status}`}
          />
        ))}
      </PanelSection>

      <PanelSection title="Pendientes de cotizar">
        {panel.pendingQuotes.map((q) => (
          <PanelRow
            key={q.id}
            href={`/comercial/cotizaciones/${q.id}`}
            label={`${q.folio} · ${q.clientName}`}
          />
        ))}
      </PanelSection>

      <PanelSection title="Compras recientes">
        {panel.directPurchases.map(({ purchase: p }) => (
          <PanelRow
            key={p.id}
            href={`/operacion/compras/directas/${p.id}`}
            label={`${p.concept} · ${p.status}`}
          />
        ))}
      </PanelSection>

      <PanelSection title="Entregas pendientes">
        {panel.pendingDeliveries.map((d) => (
          <PanelRow
            key={`${d.saleId}-${d.concept}`}
            href={`/comercial/ventas/${d.saleId}`}
            label={`${d.saleFolio} · ${d.concept} (${d.pendingQty})`}
          />
        ))}
      </PanelSection>
    </div>
  );
}
