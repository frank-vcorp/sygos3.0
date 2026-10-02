import Link from "next/link";
import { redirect } from "next/navigation";
import { OcListTabs } from "@/components/purchases/oc-list-tabs";
import { ListShell } from "@/components/masters/list-shell";
import { purchaseOrderStatusLabel } from "@/lib/discovery/labels/purchases";
import { formatPurchaseOrderFolio } from "@/server/masters/folios";
import { listPurchaseOrders } from "@/server/purchases/orders";
import { getAuthContext } from "@/server/auth/session";
import {
  canAuthorizePurchaseOrder,
  canManagePurchaseOrders,
  canProcessPurchases,
  canSeePurchasesModule,
} from "@/server/rbac/purchases";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ vista?: string }> };

export default async function OcListPage({ searchParams }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeePurchasesModule(auth.effective.role)) redirect("/inicio");

  const { vista } = await searchParams;
  const activeView =
    vista === "pendientes-ceo"
      ? "pendientes-ceo"
      : vista === "pendientes-procesar"
        ? "pendientes-procesar"
        : "todas";
  const showCeoTab = canAuthorizePurchaseOrder(auth.effective.role);
  const showProcessTab = canProcessPurchases(auth.effective.role);
  if (activeView === "pendientes-ceo" && !showCeoTab) {
    redirect("/operacion/oc");
  }
  if (activeView === "pendientes-procesar" && !showProcessTab) {
    redirect("/operacion/oc");
  }

  const rows = await listPurchaseOrders(auth.activeCompany.id, {
    pendingCeoOnly: activeView === "pendientes-ceo",
    pendingProcessOnly: activeView === "pendientes-procesar",
  });

  const description =
    activeView === "pendientes-ceo"
      ? "Bandeja O.C. — pendientes de autorización CEO (§6.2)."
      : activeView === "pendientes-procesar"
        ? "Bandeja O.C. — Coordinación procesa → egreso o CxP 1:1."
        : "Órdenes de compra · autorización CEO · procesamiento Coordinación.";

  return (
    <div className="space-y-4">
      <OcListTabs
        active={activeView}
        showCeoTab={showCeoTab}
        showProcessTab={showProcessTab}
      />
      <ListShell
        title="Órdenes de compra"
        description={description}
        createHref={
          canManagePurchaseOrders(auth.effective.role) ? "/operacion/oc/nueva" : undefined
        }
        createLabel="Nueva O.C."
      >
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Concepto</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Autorizado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ order: o, supplierName }) => (
              <tr key={o.id}>
                <td className="px-4 py-3">
                  <Link href={`/operacion/oc/${o.id}`} className="font-medium text-sygos-teal">
                    {formatPurchaseOrderFolio(o.folioNumber)}
                  </Link>
                </td>
                <td className="px-4 py-3">{o.concept}</td>
                <td className="px-4 py-3">{supplierName ?? "—"}</td>
                <td className="px-4 py-3">
                  {purchaseOrderStatusLabel[o.status] ?? o.status.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3 text-right">{o.authorizedAmountMxn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListShell>
    </div>
  );
}
