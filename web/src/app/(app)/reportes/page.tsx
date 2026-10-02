import Link from "next/link";
import { redirect } from "next/navigation";
import { formatMxn } from "@/server/commercial/money";
import { buildCompanyReport } from "@/server/reports/overview";
import { getAuthContext } from "@/server/auth/session";
import { canSeeReports } from "@/server/rbac/panels";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeReports(auth.effective.role)) redirect("/inicio");

  const report = await buildCompanyReport(auth.activeCompany.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reportes · {auth.activeCompany.name}</h1>
      <p className="text-sm text-slate-500">Sin consolidado entre empresas.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Facturado (mes)" value={formatMxn(report.finance.facturadoMxn)} href="/administracion/finanzas" />
        <Stat label="Comisiones devengadas" value={formatMxn(report.commissionTotalMxn)} href="/capital-humano/comisiones" />
        <Stat label="Horas producción técnica" value={`${report.productionHours} h`} href="/operacion/produccion" />
        <Stat label="CxC abierta" value={formatMxn(report.finance.cxcMxn)} href="/administracion/cobranza" />
      </div>
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
