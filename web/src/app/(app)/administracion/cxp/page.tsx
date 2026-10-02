import { redirect } from "next/navigation";
import { IntercompanyPaymentForm } from "@/components/billing/intercompany-payment-form";
import { PayApForm } from "@/components/finance/finance-forms";
import { ListShell } from "@/components/masters/list-shell";
import type { CompanySlug } from "@/lib/company";
import { listPayables } from "@/server/billing/ar-ap";
import { formatMxn } from "@/server/commercial/money";
import { ensureDefaultFinancialAccounts } from "@/server/finance/accounts";
import { getAuthContext } from "@/server/auth/session";
import { canRegisterPayments } from "@/server/rbac/billing";
import { canSeeFinanceModule } from "@/server/rbac/finance";

export const dynamic = "force-dynamic";

export default async function CxpPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeFinanceModule(auth.effective.role)) redirect("/inicio");

  const slug = auth.activeCompany.slug as CompanySlug;
  const rows = await listPayables(auth.activeCompany.id);
  const accounts = await ensureDefaultFinancialAccounts(auth.activeCompany.id);
  const canIntercompanyPay =
    slug === "SYSTRON" && canRegisterPayments(auth.effective.role);

  return (
    <div className="space-y-6">
      <ListShell
        title="Cuentas por pagar"
        description="§8.2 — O.C./compra a crédito, intercompañía SM→SYSTRON; pago 1:1 con egreso."
      >
      <table className="min-w-full text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Proveedor</th>
            <th className="px-4 py-3 text-left">Origen</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-right">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-100">
              <td className="px-4 py-3">{r.supplierName}</td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {r.description ??
                  (r.linkedArEntryId ?
                    "Intercompañía SM→SYSTRON"
                  : r.purchaseOrderId ?
                    "O.C."
                  : r.directPurchaseId ?
                    "Compra directa"
                  : "Manual")}
                {r.pendingVerification && " · pend. comprobación"}
                {canIntercompanyPay &&
                  r.linkedArEntryId &&
                  r.balanceMxn > 0 && (
                    <IntercompanyPaymentForm
                      apEntryId={r.id}
                      linkedArEntryId={r.linkedArEntryId}
                      supplierId={r.supplierId}
                      maxMxn={r.balanceMxn}
                    />
                  )}
                {!r.linkedArEntryId && r.balanceMxn > 0 && (
                  <PayApForm
                    apId={r.id}
                    maxMxn={r.balanceMxn}
                    accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
                  />
                )}
              </td>
              <td className="px-4 py-3">{r.status}</td>
              <td className="px-4 py-3 text-right">{formatMxn(r.balanceMxn)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                Sin CxP activa.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </ListShell>
    </div>
  );
}
