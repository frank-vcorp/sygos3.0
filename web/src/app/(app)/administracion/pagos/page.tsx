import { redirect } from "next/navigation";
import { PaymentValidateButton } from "@/components/billing/billing-forms";
import { PaymentRegisterForm } from "@/components/billing/payment-register-form";
import { listReceivables } from "@/server/billing/ar-ap";
import { listPayments } from "@/server/billing/payments";
import { listClients } from "@/server/masters/clients";
import { getAuthContext } from "@/server/auth/session";
import {
  canRegisterPayments,
  canSeeBillingModule,
  canValidatePayments,
  vendorClientScopeUserId,
} from "@/server/rbac/billing";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeBillingModule(auth.effective.role)) redirect("/inicio");

  const vendorScope = vendorClientScopeUserId(
    auth.effective.role,
    auth.effective.id,
  );
  const [payments, clients, receivables] = await Promise.all([
    listPayments(auth.activeCompany.id),
    listClients({ companyId: auth.activeCompany.id }),
    listReceivables(auth.activeCompany.id, {
      vendorUserId: vendorScope ?? undefined,
    }),
  ]);
  const canValidate = canValidatePayments(auth.effective.role);
  const canRegister = canRegisterPayments(auth.effective.role);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pagos</h1>
      <p className="text-sm text-slate-500">
        Registro con comprobante · validación de Coordinación reduce CxC.
      </p>
      {canRegister && clients.length > 0 && (
        <PaymentRegisterForm
          clients={clients.map((c) => ({ id: c.id, legalName: c.legalName }))}
          receivables={receivables.map((r) => ({
            arId: r.arId,
            clientId: r.clientId,
            clientName: r.clientName,
            balanceMxn: r.balanceMxn,
            fiscalFolio: r.fiscalFolio,
          }))}
          isVendor={auth.effective.role === "VENTAS_SYSTRON"}
        />
      )}
      <table className="min-w-full rounded-xl border bg-white text-sm shadow-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Folio</th>
            <th className="px-4 py-3 text-left">Cliente</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-right">Importe</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b border-slate-100">
              <td className="px-4 py-3">{p.folio}</td>
              <td className="px-4 py-3">{p.clientName ?? "—"}</td>
              <td className="px-4 py-3">{p.status.replace(/_/g, " ")}</td>
              <td className="px-4 py-3 text-right">{p.amountMxn}</td>
              <td className="px-4 py-3">
                {canValidate && p.status === "PENDIENTE_VALIDACION" && (
                  <PaymentValidateButton paymentId={p.id} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
