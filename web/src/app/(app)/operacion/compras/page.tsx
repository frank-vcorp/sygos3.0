import Link from "next/link";
import { redirect } from "next/navigation";
import { ListShell } from "@/components/masters/list-shell";
import { directPurchaseStatusLabel } from "@/lib/discovery/labels/purchases";
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
    <ListShell
      title="Compras directas"
      description="§6.2 — límites mensuales/individuales; rebasa límite → O.C.; validación Coordinación; 1 egreso o 1 CxP."
      createHref={
        canRegisterDirectPurchase(auth.effective.role)
          ? "/operacion/compras/directas/nueva"
          : undefined
      }
      createLabel="Nueva compra directa"
    >
      <table className="min-w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Folio</th>
            <th className="px-4 py-3">Concepto</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ purchase: p }) => (
            <tr key={p.id} className="border-b border-slate-100">
              <td className="px-4 py-3">
                <Link
                  href={`/operacion/compras/directas/${p.id}`}
                  className="font-medium text-sygos-teal"
                >
                  {formatDirectPurchaseFolio(p.folioNumber)}
                </Link>
              </td>
              <td className="px-4 py-3">{p.concept}</td>
              <td className="px-4 py-3">
                {directPurchaseStatusLabel[p.status] ?? p.status.replace(/_/g, " ")}
              </td>
              <td className="px-4 py-3 text-right">{p.amountMxn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListShell>
  );
}
