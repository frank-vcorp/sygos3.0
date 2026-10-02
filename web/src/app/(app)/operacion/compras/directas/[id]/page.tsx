import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ProcessPurchaseForm,
  PurchaseActionButton,
} from "@/components/purchases/purchase-forms";
import { ensureDefaultFinancialAccounts } from "@/server/finance/accounts";
import { formatDirectPurchaseFolio } from "@/server/masters/folios";
import { getDirectPurchase } from "@/server/purchases/direct";
import { getAuthContext } from "@/server/auth/session";
import { canProcessPurchases, canSeePurchasesModule } from "@/server/rbac/purchases";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CompraDirectaDetallePage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeePurchasesModule(auth.effective.role)) redirect("/inicio");

  const { id } = await params;
  const purchase = await getDirectPurchase(auth.activeCompany.id, id);
  if (!purchase) redirect("/operacion/compras");

  const accounts = await ensureDefaultFinancialAccounts(auth.activeCompany.id);
  const canProcess = canProcessPurchases(auth.effective.role);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/operacion/compras" className="text-sm text-sygos-teal">
        ← Compras
      </Link>
      <h1 className="text-xl font-semibold">
        {formatDirectPurchaseFolio(purchase.folioNumber)}
      </h1>
      <p className="text-sm text-slate-600">{purchase.concept}</p>
      <p className="text-sm">
        {purchase.status.replace(/_/g, " ")} · {purchase.amountMxn} MXN ·{" "}
        {purchase.paymentTerms}
      </p>
      {canProcess && purchase.status === "PENDIENTE_VALIDAR" && (
        <div className="rounded-xl border bg-slate-50 p-4 text-sm">
          <p className="font-medium">Procesamiento Coordinación</p>
          {purchase.paymentTerms === "CONTADO" && (
            <ProcessPurchaseForm
              href={`/api/purchases/direct/${id}`}
              accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
              defaultAmount={purchase.amountMxn}
            />
          )}
          {purchase.paymentTerms === "CREDITO" && (
            <ProcessPurchaseForm
              href={`/api/purchases/direct/${id}`}
              accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
              defaultAmount={purchase.amountMxn}
            />
          )}
          <div className="mt-3">
            <PurchaseActionButton
              href={`/api/purchases/direct/${id}`}
              body={{ action: "delete" }}
              label="Eliminar (libera presupuesto)"
              variant="danger"
            />
          </div>
        </div>
      )}
    </div>
  );
}
