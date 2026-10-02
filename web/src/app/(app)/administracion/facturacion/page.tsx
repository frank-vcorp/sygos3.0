import Link from "next/link";
import { redirect } from "next/navigation";
import { listFiscalDocuments } from "@/server/billing/fiscal-documents";
import { getAuthContext } from "@/server/auth/session";
import { canEmitFiscalDocument, canSeeBillingModule } from "@/server/rbac/billing";

export const dynamic = "force-dynamic";

export default async function FacturacionPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeBillingModule(auth.effective.role)) redirect("/inicio");

  const docs = await listFiscalDocuments({ companyId: auth.activeCompany.id });
  const canEmit = canEmitFiscalDocument(auth.effective.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Facturación</h1>
          <p className="text-sm text-slate-500">Facturas, remisiones y factura libre</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/administracion/facturacion/pendientes"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            Pendientes coordinación
          </Link>
          {canEmit && (
            <Link
              href="/administracion/facturacion/libre"
              className="rounded-lg bg-sygos-navy px-3 py-2 text-sm text-white"
            >
              Factura libre
            </Link>
          )}
        </div>
      </div>
      <table className="min-w-full rounded-xl border bg-white text-sm shadow-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Folio</th>
            <th className="px-4 py-3 text-left">Cliente</th>
            <th className="px-4 py-3 text-left">Tipo</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id} className="border-b border-slate-100">
              <td className="px-4 py-3">
                <Link
                  href={`/administracion/facturacion/${d.id}`}
                  className="text-sygos-teal hover:underline"
                >
                  {d.folio}
                </Link>
              </td>
              <td className="px-4 py-3">{d.clientName}</td>
              <td className="px-4 py-3">{d.docKind}</td>
              <td className="px-4 py-3">{d.status.replace(/_/g, " ")}</td>
              <td className="px-4 py-3 text-right">{d.totalMxn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
