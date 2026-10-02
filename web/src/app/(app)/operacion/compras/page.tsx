import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDirectPurchaseFolio } from "@/server/masters/folios";
import { listDirectPurchases } from "@/server/purchases/direct";
import { getAuthContext } from "@/server/auth/session";
import {
  canRegisterDirectPurchase,
  canSeePurchasesModule,
} from "@/server/rbac/purchases";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeePurchasesModule(auth.effective.role)) redirect("/inicio");

  const rows = await listDirectPurchases(auth.activeCompany.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Compras directas</h1>
        {canRegisterDirectPurchase(auth.effective.role) && (
          <Link
            href="/operacion/compras/directas/nueva"
            className="rounded-lg bg-sygos-navy px-3 py-2 text-sm text-white"
          >
            Nueva compra directa
          </Link>
        )}
      </div>
      <p className="text-sm text-slate-500">
        Límites mensuales/individuales · validación Coordinación · 1 Egreso o 1 CxP.
      </p>
      <table className="min-w-full rounded-xl border bg-white text-sm shadow-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Folio</th>
            <th className="px-4 py-3 text-left">Concepto</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ purchase: p }) => (
            <tr key={p.id} className="border-b border-slate-100">
              <td className="px-4 py-3">
                <Link href={`/operacion/compras/directas/${p.id}`} className="text-sygos-teal">
                  {formatDirectPurchaseFolio(p.folioNumber)}
                </Link>
              </td>
              <td className="px-4 py-3">{p.concept}</td>
              <td className="px-4 py-3">{p.status.replace(/_/g, " ")}</td>
              <td className="px-4 py-3 text-right">{p.amountMxn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
