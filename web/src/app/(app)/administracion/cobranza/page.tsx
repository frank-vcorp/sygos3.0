import Link from "next/link";
import { redirect } from "next/navigation";
import { ListShell } from "@/components/masters/list-shell";
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
    <ListShell
      title="Cobranza (CxC)"
      description="§7.3 — saldos abiertos por cliente; navegación al documento fiscal y pagos validados."
    >
      <table className="min-w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Documento</th>
            <th className="px-4 py-3">Vence</th>
            <th className="px-4 py-3 text-right">Saldo</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.arId}>
              <td className="px-4 py-3">{r.clientName}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/administracion/cobranza/${r.arId}`}
                  className="font-medium text-sygos-teal hover:underline"
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
    </ListShell>
  );
}
