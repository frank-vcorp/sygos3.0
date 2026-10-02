import Link from "next/link";
import { redirect } from "next/navigation";
import { formatMxn } from "@/server/commercial/money";
import { buildCompanyReport } from "@/server/reports/overview";
import { buildExtendedCompanyReport } from "@/server/reports/metrics";
import { getAuthContext } from "@/server/auth/session";
import { canSeeReports } from "@/server/rbac/panels";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeReports(auth.effective.role)) redirect("/inicio");

  const [report, extended] = await Promise.all([
    buildCompanyReport(auth.activeCompany.id),
    buildExtendedCompanyReport(auth.activeCompany.id),
  ]);

  const decided =
    extended.quotes.authorized + extended.quotes.rejected;
  const conversion =
    decided > 0
      ? Math.round((extended.quotes.authorized / decided) * 1000) / 10
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Reportes · {auth.activeCompany.name}</h1>
        <p className="text-sm text-slate-500">
          Periodo {extended.monthKey} · sin consolidado entre empresas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Facturado (mes)" value={formatMxn(report.finance.facturadoMxn)} href="/administracion/finanzas" />
        <Stat label="Comisiones devengadas" value={formatMxn(report.commissionTotalMxn)} href="/capital-humano/comisiones" />
        <Stat label="Horas producción técnica" value={`${report.productionHours} h`} href="/operacion/produccion" />
        <Stat label="CxC abierta" value={formatMxn(report.finance.cxcMxn)} href="/administracion/cobranza" />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Comercial</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Cotizaciones (total)" value={String(extended.quotes.total)} />
          <MiniStat label="Autorizadas" value={String(extended.quotes.authorized)} />
          <MiniStat label="Pend. decisión" value={String(extended.quotes.pendingDecision)} />
          <MiniStat label="Conversión" value={conversion != null ? `${conversion}%` : "—"} />
        </div>
        <Link href="/comercial/cotizaciones" className="text-sm text-sygos-teal">
          Ver cotizaciones →
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Finanzas y fiscal</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Ingresos (mov.)" value={formatMxn(extended.movements.ingresos)} />
          <MiniStat label="Egresos (mov.)" value={formatMxn(extended.movements.egresos)} />
          <MiniStat label="CxC vencida" value={formatMxn(extended.cxcOverdueMxn)} />
          <MiniStat label="CxP vencida" value={formatMxn(extended.cxpOverdueMxn)} />
        </div>
        <p className="text-sm text-slate-600">
          Documentos del mes: {extended.fiscal.emitidas} emitidos · {extended.fiscal.remisiones} remisiones creadas
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Operación técnica</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat
            label="SLA vencidos"
            value={String(extended.production.summary.slaOverdueOpen)}
          />
          <MiniStat
            label="Reparaciones cerradas (mes)"
            value={String(extended.production.summary.repairsClosed)}
          />
          <MiniStat label="Entradas producción" value={String(report.productionEntries)} />
          <MiniStat
            label="Técnicos con actividad"
            value={String(extended.production.byTechnician.length)}
          />
        </div>
        <Link href="/administracion/produccion-tecnica" className="text-sm text-sygos-teal">
          Detalle KPI por técnico →
        </Link>
        <ul className="rounded-xl border bg-white p-4 text-sm">
          {extended.repairsByStatus.map((r) => (
            <li key={r.status} className="flex justify-between border-b py-2 last:border-0">
              <span>{r.status}</span>
              <span className="font-medium">{r.count}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat(props: { label: string; value: string; href: string }) {
  return (
    <Link href={props.href} className="rounded-xl border bg-white p-4 shadow-sm hover:border-sygos-teal">
      <p className="text-xs uppercase text-slate-500">{props.label}</p>
      <p className="mt-1 text-lg font-semibold">{props.value}</p>
    </Link>
  );
}

function MiniStat(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase text-slate-500">{props.label}</p>
      <p className="mt-1 text-base font-semibold">{props.value}</p>
    </div>
  );
}
