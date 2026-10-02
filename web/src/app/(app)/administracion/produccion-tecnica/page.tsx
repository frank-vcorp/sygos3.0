import { redirect } from "next/navigation";
import { getProductionAnalytics } from "@/server/ops/production-analytics";
import { getAuthContext } from "@/server/auth/session";
import { canSeeProductionAnalytics } from "@/server/rbac/panels";

export const dynamic = "force-dynamic";

export default async function ProduccionTecnicaAnaliticaPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeProductionAnalytics(auth.effective.role)) redirect("/inicio");

  const data = await getProductionAnalytics(auth.activeCompany.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Producción técnica · analítica</h1>
      <p className="text-sm text-slate-500">Periodo {data.monthKey} · empresa activa</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="SLA vencidos (abiertos)" value={String(data.summary.slaOverdueOpen)} />
        <Kpi label="Reparaciones cerradas" value={String(data.summary.repairsClosed)} />
        <Kpi label="Cotiz. autorizadas" value={String(data.summary.quotesAuthorized)} />
        <Kpi
          label="Conversión"
          value={
            data.summary.conversionPct != null
              ? `${data.summary.conversionPct}%`
              : "—"
          }
        />
      </div>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">KPI por ejecutor</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-slate-500">
              <th className="py-2">Técnico</th>
              <th className="py-2">Horas registradas</th>
              <th className="py-2">Entradas</th>
              <th className="py-2">Diag. validados</th>
            </tr>
          </thead>
          <tbody>
            {data.byTechnician.map((t) => (
              <tr key={t.userId} className="border-b last:border-0">
                <td className="py-2">{t.name}</td>
                <td className="py-2">{t.hours.toFixed(1)}</td>
                <td className="py-2">{t.productionEntries}</td>
                <td className="py-2">{t.diagnosticsValidated}</td>
              </tr>
            ))}
            {data.byTechnician.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-slate-500">
                  Sin movimiento en el periodo.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Kpi(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase text-slate-500">{props.label}</p>
      <p className="mt-1 text-lg font-semibold">{props.value}</p>
    </div>
  );
}
