import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPurchaseOrderFolio } from "@/server/masters/folios";
import { listDirectPurchases } from "@/server/purchases/direct";
import { listCeoPendingPurchaseOrders } from "@/server/purchases/orders";
import { getAuthContext } from "@/server/auth/session";
import { canAuthorizePurchaseOrder, canProcessPurchases } from "@/server/rbac/purchases";
import { isSuperAdmin } from "@/server/rbac/roles";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const showCeo =
    canAuthorizePurchaseOrder(auth.effective.role) || isSuperAdmin(auth.effective.role);
  const showCoord = canProcessPurchases(auth.effective.role);

  const [ceoOrders, directRows] = await Promise.all([
    showCeo ? listCeoPendingPurchaseOrders(auth.activeCompany.id) : [],
    showCoord ? listDirectPurchases(auth.activeCompany.id) : [],
  ]);

  const pendingDirect = directRows.filter(
    (r) => r.purchase.status === "PENDIENTE_VALIDAR",
  );

  const hasBlocks = ceoOrders.length > 0 || pendingDirect.length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Inicio</h1>
      {!hasBlocks && (
        <p className="text-sm text-slate-500">
          Sin pendientes ejecutivos en esta empresa. Usa el menú lateral para operar.
        </p>
      )}
      {ceoOrders.length > 0 && (
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">O.C. pendientes de autorización (CEO)</h2>
          <ul className="mt-3 divide-y text-sm">
            {ceoOrders.map((o) => (
              <li key={o.id} className="flex justify-between py-2">
                <Link href={`/operacion/oc/${o.id}`} className="text-sygos-teal">
                  {formatPurchaseOrderFolio(o.folioNumber)} · {o.concept}
                </Link>
                <span>{o.authorizedAmountMxn} MXN</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {pendingDirect.length > 0 && (
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Compras directas por validar</h2>
          <ul className="mt-3 divide-y text-sm">
            {pendingDirect.map(({ purchase: p }) => (
              <li key={p.id} className="py-2">
                <Link href={`/operacion/compras/directas/${p.id}`} className="text-sygos-teal">
                  CD-{p.folioNumber} · {p.concept}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
