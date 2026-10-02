import { redirect } from "next/navigation";
import { IntercompanyPaymentForm } from "@/components/billing/intercompany-payment-form";
import type { CompanySlug } from "@/lib/company";
import { listPayables } from "@/server/billing/ar-ap";
import { formatMxn } from "@/server/commercial/money";
import { getAuthContext } from "@/server/auth/session";
import { canEmitFiscalDocument, canRegisterPayments } from "@/server/rbac/billing";

export const dynamic = "force-dynamic";

export default async function CxpPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canEmitFiscalDocument(auth.effective.role)) redirect("/inicio");

  const slug = auth.activeCompany.slug as CompanySlug;
  const rows = await listPayables(auth.activeCompany.id);
  const canPay = slug === "SYSTRON" && canRegisterPayments(auth.effective.role);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">CxP · intercompañía</h1>
      <p className="text-sm text-slate-500">
        Espejo SYSTRON por facturas Servomotores → SYSTRON (Fase 5). CxP operativa completa en Fase 6.
      </p>
      <table className="min-w-full rounded-xl border bg-white text-sm shadow-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Proveedor</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-right">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-100">
              <td className="px-4 py-3">
                {r.supplierName}
                {canPay &&
                  r.linkedArEntryId &&
                  r.balanceMxn > 0 && (
                    <IntercompanyPaymentForm
                      apEntryId={r.id}
                      linkedArEntryId={r.linkedArEntryId}
                      supplierId={r.supplierId}
                      maxMxn={r.balanceMxn}
                    />
                  )}
              </td>
              <td className="px-4 py-3">{r.status}</td>
              <td className="px-4 py-3 text-right">{formatMxn(r.balanceMxn)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                Sin CxP intercompañía activa.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
