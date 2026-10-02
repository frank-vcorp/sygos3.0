import Link from "next/link";
import { redirect } from "next/navigation";
import { QuoteListTabs } from "@/components/commercial/quote-list-tabs";
import { ListShell } from "@/components/masters/list-shell";
import {
  formatAssetSummary,
  formatQuoteType,
  quoteOriginLabel,
  quoteStatusLabel,
} from "@/lib/commercial/quote-labels";
import { listQuotes } from "@/server/commercial/quotes";
import { formatMxn } from "@/server/commercial/money";
import { getAuthContext } from "@/server/auth/session";
import {
  canCreateQuoteAsVendor,
  canSeeCommercialModule,
  canSeePendingPricingQueue,
  canViewQuoteEconomics,
  vendorQuoteScopeUserId,
} from "@/server/rbac/commercial";
import type { CompanySlug } from "@/lib/company";
import type { QuoteStatus } from "@/db/schema";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ vista?: string }> };

export default async function CotizacionesPage({ searchParams }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeCommercialModule(auth.effective.role)) redirect("/inicio");

  const { vista } = await searchParams;
  const activeView =
    vista === "pendientes-cotizar"
      ? "pendientes-cotizar"
      : vista === "pendientes-decision"
        ? "pendientes-decision"
        : "todas";

  const scope = vendorQuoteScopeUserId(auth.effective.role, auth.effective.id);
  const slug = auth.activeCompany.slug as CompanySlug;
  const canCreate = canCreateQuoteAsVendor(auth.effective.role, slug);
  const showPricingTab = canSeePendingPricingQueue(auth.effective.role);
  const showTotals = canViewQuoteEconomics(auth.effective.role, "PENDIENTE_DECISION");

  let statusFilter: QuoteStatus[] | undefined;
  let pendingPricingOnly = false;
  if (activeView === "pendientes-cotizar") {
    if (!showPricingTab) redirect("/comercial/cotizaciones");
    pendingPricingOnly = true;
  } else if (activeView === "pendientes-decision") {
    statusFilter = ["PENDIENTE_DECISION"];
  }

  const rows = await listQuotes({
    companyId: auth.activeCompany.id,
    vendorUserId: scope ?? undefined,
    pendingPricingOnly,
    status: statusFilter,
  });

  const description =
    activeView === "pendientes-cotizar"
      ? "Bandeja del módulo Cotizaciones — CEO/Administrador fija precio (discovery §3.3)."
      : activeView === "pendientes-decision"
        ? "Cotizaciones con precio — seguimiento y decisión comercial."
        : "Precio, seguimiento y decisión. Las bandejas son vistas del mismo módulo.";

  return (
    <div className="space-y-4">
      <QuoteListTabs active={activeView} showPendingPricing={showPricingTab} />
      <ListShell
        title="Cotizaciones"
        description={description}
        createHref={canCreate ? "/comercial/cotizaciones/nueva" : undefined}
        createLabel="Nueva cotización"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Equipo / preliminar</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3">Responsable</th>
                {showTotals && <th className="px-4 py-3">Total</th>}
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Actualización</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/comercial/cotizaciones/${q.id}`}
                      className="font-medium text-sygos-teal hover:underline"
                    >
                      {q.folio}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{q.clientName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatAssetSummary({
                      assetLabel: q.assetLabel ?? null,
                      prelimEquipmentType: q.prelimEquipmentType,
                      prelimBrand: q.prelimBrand,
                      prelimModel: q.prelimModel,
                    })}
                  </td>
                  <td className="px-4 py-3">{formatQuoteType(q.quoteType)}</td>
                  <td className="px-4 py-3">
                    {quoteOriginLabel[q.quoteOrigin] ?? q.quoteOrigin}
                  </td>
                  <td className="px-4 py-3">{q.vendorName}</td>
                  {showTotals && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      {q.totalMxn != null ? formatMxn(q.totalMxn) : "—"}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {quoteStatusLabel[q.status] ?? q.status.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {q.updatedAt?.toLocaleDateString("es-MX")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ListShell>
    </div>
  );
}
