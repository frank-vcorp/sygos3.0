import Link from "next/link";
import { redirect } from "next/navigation";
import { FiscalListTabs } from "@/components/billing/fiscal-list-tabs";
import { ListShell } from "@/components/masters/list-shell";
import { listFiscalDocuments } from "@/server/billing/fiscal-documents";
import { formatMxn } from "@/server/commercial/money";
import { getAuthContext } from "@/server/auth/session";
import {
  canEmitFiscalDocument,
  canSeeBillingModule,
} from "@/server/rbac/billing";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ vista?: string }> };

export default async function FacturacionPage({ searchParams }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeBillingModule(auth.effective.role)) redirect("/inicio");

  const { vista } = await searchParams;
  const activeView = vista === "pendientes" ? "pendientes" : "todas";
  const canEmit = canEmitFiscalDocument(auth.effective.role);
  if (activeView === "pendientes" && !canEmit) {
    redirect("/administracion/facturacion");
  }

  const docs = await listFiscalDocuments({
    companyId: auth.activeCompany.id,
    pendingOnly: activeView === "pendientes",
  });

  const description =
    activeView === "pendientes"
      ? "Bandeja del módulo Facturación — solicitudes comerciales pendientes de emitir (§7.1)."
      : "Facturas y remisiones emitidas. El folio abre detalle con relaciones al origen operativo.";

  return (
    <div className="space-y-4">
      <FiscalListTabs active={activeView} showPendingTab={canEmit} />
      <ListShell
        title="Facturación"
        description={description}
        createHref={canEmit ? "/administracion/facturacion/libre" : undefined}
        createLabel="Factura libre"
      >
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {docs.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/administracion/facturacion/${d.id}`}
                    className="font-medium text-sygos-teal hover:underline"
                  >
                    {d.folio}
                  </Link>
                </td>
                <td className="px-4 py-3">{d.clientName}</td>
                <td className="px-4 py-3">{d.docKind.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">{d.status.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-right">{formatMxn(d.totalMxn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListShell>
    </div>
  );
}
