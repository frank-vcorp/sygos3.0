import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDirectPurchaseFolio, formatFiscalFolio, formatPurchaseOrderFolio } from "@/server/masters/folios";
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
      <section className="rounded-xl border bg-white p-4 text-sm">
        <h2 className="font-semibold">Compras directas por validar</h2>
        <ul className="mt-2 divide-y">
          {panel.directPurchases.map(({ purchase: p }) => (
            <li key={p.id} className="py-2">
              <Link href={`/operacion/compras/directas/${p.id}`} className="text-sygos-teal">
                {formatDirectPurchaseFolio(p.folioNumber)} · {p.concept}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border bg-white p-4 text-sm">
        <h2 className="font-semibold">Facturación pendiente</h2>
        <ul className="mt-2 divide-y">
          {panel.fiscalDocuments.map((d) => (
            <li key={d.id} className="py-2">
              <Link href={`/administracion/facturacion/${d.id}`} className="text-sygos-teal">
                {formatFiscalFolio(d.docKind, d.folioNumber)} · {d.clientName}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border bg-white p-4 text-sm">
        <h2 className="font-semibold">O.C. autorizadas por procesar</h2>
        <ul className="mt-2 divide-y">
          {panel.purchaseOrdersToProcess.map(({ order: o }) => (
            <li key={o.id} className="py-2">
              <Link href={`/operacion/oc/${o.id}`} className="text-sygos-teal">
                {formatPurchaseOrderFolio(o.folioNumber)} · {o.concept}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
