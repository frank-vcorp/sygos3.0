import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ProcessPurchaseForm,
  PurchaseActionButton,
} from "@/components/purchases/purchase-forms";
import { ensureDefaultFinancialAccounts } from "@/server/finance/accounts";
import { formatPurchaseOrderFolio } from "@/server/masters/folios";
import { getPurchaseOrder } from "@/server/purchases/orders";
import { getAuthContext } from "@/server/auth/session";
import {
  canAuthorizePurchaseOrder,
  canProcessPurchases,
  canSeePurchasesModule,
} from "@/server/rbac/purchases";
import { JourneyPanel } from "@/components/journey/journey-panel";
import { getPurchaseOrderJourneyHint } from "@/server/journey/purchase-handoffs";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OcDetallePage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeePurchasesModule(auth.effective.role)) redirect("/inicio");

  const { id } = await params;
  const order = await getPurchaseOrder(auth.activeCompany.id, id);
  if (!order) redirect("/operacion/oc");

  const accounts = await ensureDefaultFinancialAccounts(auth.activeCompany.id);
  const canCeo = canAuthorizePurchaseOrder(auth.effective.role);
  const canCoord = canProcessPurchases(auth.effective.role);
  const journeyHint = getPurchaseOrderJourneyHint({ status: order.status });

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/operacion/oc" className="text-sm text-sygos-teal">
        ← O.C.
      </Link>
      <h1 className="text-xl font-semibold">{formatPurchaseOrderFolio(order.folioNumber)}</h1>
      <p className="text-sm">{order.concept}</p>
      <JourneyPanel hint={journeyHint} />
      <p className="text-sm text-slate-600">
        {order.status.replace(/_/g, " ")} · autorizado {order.authorizedAmountMxn} MXN
      </p>
      {canCeo && order.status === "PENDIENTE_AUTORIZACION" && (
        <div className="flex flex-wrap gap-2">
          <PurchaseActionButton
            href={`/api/purchases/orders/${id}`}
            body={{ action: "authorize" }}
            label="Autorizar"
          />
          <PurchaseActionButton
            href={`/api/purchases/orders/${id}`}
            body={{ action: "reject", reason: "Rechazada por CEO" }}
            label="Rechazar"
            variant="danger"
          />
        </div>
      )}
      {canCoord && order.status === "PENDIENTE_PROCESAR" && (
        <div className="rounded-xl border bg-slate-50 p-4 text-sm">
          <p className="font-medium">Procesar compra</p>
          <ProcessPurchaseForm
            href={`/api/purchases/orders/${id}`}
            accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
            showAmount
            defaultAmount={order.authorizedAmountMxn}
          />
          <div className="mt-2">
            <PurchaseActionButton
              href={`/api/purchases/orders/${id}`}
              body={{ action: "cancel", reason: "Cancelada por Coordinación" }}
              label="Cancelar O.C."
              variant="danger"
            />
          </div>
        </div>
      )}
    </div>
  );
}
