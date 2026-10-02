import Link from "next/link";
import { redirect } from "next/navigation";
import { formatMxn } from "@/server/commercial/money";
import { ensureDefaultFinancialAccounts } from "@/server/finance/accounts";
import { getFinanceDashboard } from "@/server/finance/dashboard";
import { getAuthContext } from "@/server/auth/session";
import { canSeeFinanceModule } from "@/server/rbac/finance";

export const dynamic = "force-dynamic";

export default async function FinanzasDashboardPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeFinanceModule(auth.effective.role)) redirect("/inicio");

  await ensureDefaultFinancialAccounts(auth.activeCompany.id);
  const dash = await getFinanceDashboard(auth.activeCompany.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard financiero</h1>
      <p className="text-sm text-slate-500">
        §8.1 — empresa activa · mes {dash.monthKey} · sin consolidado intercompañía.
      </p>
      <Link href="/administracion/hub" className="text-sm text-sygos-teal hover:underline">
        ← Módulos administración
      </Link>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Facturado", value: dash.facturadoMxn, href: "/administracion/facturacion" },
          { label: "Cobrado", value: dash.cobradoMxn, href: "/administracion/pagos" },
          { label: "Egresos", value: dash.egresosMxn, href: "/administracion/finanzas/movimientos" },
          { label: "Utilidad gerencial", value: dash.utilidadGerencialMxn, href: "/administracion/finanzas" },
          { label: "Flujo neto", value: dash.flujoNetoMxn, href: "/administracion/finanzas/movimientos" },
          { label: "CxC abierta", value: dash.cxcMxn, href: "/administracion/cobranza" },
          { label: "CxP abierta", value: dash.cxpMxn, href: "/administracion/cxp" },
          { label: "Deuda tarjetas", value: dash.tarjetaDeudaMxn, href: "/administracion/finanzas/cuentas" },
        ].map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="rounded-xl border bg-white p-4 shadow-sm hover:border-sygos-teal"
          >
            <p className="text-xs uppercase text-slate-500">{kpi.label}</p>
            <p className="mt-1 text-lg font-semibold">{formatMxn(kpi.value)}</p>
          </Link>
        ))}
      </div>
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold">Saldos de cuentas</h2>
        <ul className="mt-3 divide-y text-sm">
          {dash.accountBalances.map((a) => (
            <li key={a.id} className="flex justify-between py-2">
              <span>
                {a.name} ({a.kind})
              </span>
              <span>{formatMxn(a.balanceMxn)}</span>
            </li>
          ))}
        </ul>
      </section>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/administracion/finanzas/movimientos" className="text-sygos-teal">
          Movimientos →
        </Link>
        <Link href="/administracion/finanzas/pendientes-comprobacion" className="text-sygos-teal">
          Pendientes de comprobación →
        </Link>
      </div>
    </div>
  );
}
