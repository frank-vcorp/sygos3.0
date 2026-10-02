import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPurchaseOrderFolio } from "@/server/masters/folios";
import { listPurchaseOrders } from "@/server/purchases/orders";
import { getAuthContext } from "@/server/auth/session";
import {
  canManagePurchaseOrders,
  canSeePurchasesModule,
} from "@/server/rbac/purchases";

export const dynamic = "force-dynamic";

export default async function OcListPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeePurchasesModule(auth.effective.role)) redirect("/inicio");

  const rows = await listPurchaseOrders(auth.activeCompany.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Órdenes de compra</h1>
        {canManagePurchaseOrders(auth.effective.role) && (
          <Link href="/operacion/oc/nueva" className="rounded-lg bg-sygos-navy px-3 py-2 text-sm text-white">
            Nueva O.C.
          </Link>
        )}
      </div>
      <table className="min-w-full rounded-xl border bg-white text-sm shadow-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Folio</th>
            <th className="px-4 py-3 text-left">Concepto</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-right">Autorizado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ order: o }) => (
            <tr key={o.id} className="border-b border-slate-100">
              <td className="px-4 py-3">
                <Link href={`/operacion/oc/${o.id}`} className="text-sygos-teal">
                  {formatPurchaseOrderFolio(o.folioNumber)}
                </Link>
              </td>
              <td className="px-4 py-3">{o.concept}</td>
              <td className="px-4 py-3">{o.status.replace(/_/g, " ")}</td>
              <td className="px-4 py-3 text-right">{o.authorizedAmountMxn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
