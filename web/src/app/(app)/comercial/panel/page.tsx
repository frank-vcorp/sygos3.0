import Link from "next/link";
import { redirect } from "next/navigation";
import { buildSalesPanel } from "@/server/commercial/panel";
import { formatMxn } from "@/server/commercial/money";
import { getAuthContext } from "@/server/auth/session";
import { canSeeCommercialModule } from "@/server/rbac/commercial";

export const dynamic = "force-dynamic";

export default async function PanelVentasPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeCommercialModule(auth.effective.role)) redirect("/inicio");

  const now = new Date();
  const panel = await buildSalesPanel({
    companyId: auth.activeCompany.id,
    vendorUserId: auth.effective.id,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Panel de ventas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Seguimiento comercial · {auth.activeCompany.name}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-slate-900">Agenda / próximas actividades</h2>
          <Link href="/comercial/agenda" className="text-sm text-sygos-teal hover:underline">
            Ver agenda completa
          </Link>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {panel.agenda.length === 0 && (
            <li className="text-slate-500">Sin actividades próximas.</li>
          )}
          {panel.agenda.map(({ activity, clientName, categoryName }) => (
            <li key={activity.id} className="flex justify-between border-b border-slate-100 py-2">
              <span>
                {activity.title}
                {clientName ? ` · ${clientName}` : ""}
              </span>
              <span className="text-slate-400">{categoryName ?? activity.categoryLabel}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-medium">Cotizaciones por seguimiento</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {panel.followUpQuotes.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/comercial/cotizaciones/${q.id}`}
                  className="text-sygos-teal hover:underline"
                >
                  {q.folio}
                </Link>{" "}
                · {q.clientName} · {formatMxn(q.totalMxn)}
              </li>
            ))}
            {panel.followUpQuotes.length === 0 && (
              <li className="text-slate-500">Nada pendiente de decisión.</li>
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-medium">Entregas pendientes</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {panel.pendingDeliveries.map((d, i) => (
              <li key={i}>
                <Link href={`/comercial/ventas/${d.saleId}`} className="text-sygos-teal hover:underline">
                  {d.saleFolio}
                </Link>{" "}
                · {d.clientName} · {d.concept} ({d.pendingQty})
              </li>
            ))}
            {panel.pendingDeliveries.length === 0 && (
              <li className="text-slate-500">Sin entregas listas.</li>
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-medium">Facturación pendiente</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {panel.billingPending.map((b, i) => (
              <li key={i}>
                <Link href={b.href} className="text-sygos-teal hover:underline">
                  {b.label}
                </Link>
              </li>
            ))}
            {panel.billingPending.length === 0 && (
              <li className="text-slate-500">Sin facturación pendiente.</li>
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-medium">Cobranza</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {panel.collections.map((c, i) => (
              <li key={i}>
                <Link href={c.href} className="text-sygos-teal hover:underline">
                  {c.label}
                </Link>
              </li>
            ))}
            {panel.collections.length === 0 && (
              <li className="text-slate-500">Sin saldos abiertos en tu cartera.</li>
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Mi desempeño</h2>
          <Link href="/comercial/metas" className="text-sm text-sygos-teal hover:underline">
            Metas
          </Link>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-4 text-sm">
          <div>
            <dt className="text-slate-500">Clientes nuevos (mes)</dt>
            <dd className="text-lg font-semibold">{panel.performance.newClientsCount}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Cotizaciones autorizadas</dt>
            <dd className="text-lg font-semibold">{panel.performance.authorizedQuotesCount}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Importe autorizado</dt>
            <dd className="text-lg font-semibold">
              {formatMxn(panel.performance.authorizedQuotesTotalMxn)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Actividades c/evidencia</dt>
            <dd className="text-lg font-semibold">
              {panel.performance.activitiesWithEvidenceCount}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
