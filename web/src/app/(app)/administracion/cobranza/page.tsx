import Link from "next/link";
import { redirect } from "next/navigation";
import { listReceivables } from "@/server/billing/ar-ap";
import { formatMxn } from "@/server/commercial/money";
import { getAuthContext } from "@/server/auth/session";
import { canSeeBillingModule, vendorClientScopeUserId } from "@/server/rbac/billing";

export const dynamic = "force-dynamic";

export default async function CobranzaPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeBillingModule(auth.effective.role)) redirect("/inicio");

  const vendorScope = vendorClientScopeUserId(
    auth.effective.role,
    auth.effective.id,
  );

  const rows = await listReceivables(auth.activeCompany.id, {
    vendorUserId: vendorScope ?? undefined,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cobranza (CxC)</h1>
      <table className="min-w-full rounded-xl border bg-white text-sm shadow-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Cliente</th>
            <th className="px-4 py-3 text-left">Documento</th>
            <th className="px-4 py-3 text-left">Vence</th>
            <th className="px-4 py-3 text-right">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.arId} className="border-b border-slate-100">
              <td className="px-4 py-3">{r.clientName}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/administracion/cobranza/${r.arId}`}
                  className="text-sygos-teal hover:underline"
                >
                  {r.docKind}-{r.fiscalFolio}
                </Link>
                {r.isOverdue && (
                  <span className="ml-2 text-xs text-red-600">Vencida</span>
                )}
              </td>
              <td className="px-4 py-3">
                {r.dueDate?.toLocaleDateString("es-MX") ?? "—"}
              </td>
              <td className="px-4 py-3 text-right">{formatMxn(r.balanceMxn)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
