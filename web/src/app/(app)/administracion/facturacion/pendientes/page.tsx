import Link from "next/link";
import { redirect } from "next/navigation";
import { listFiscalDocuments } from "@/server/billing/fiscal-documents";
import { getAuthContext } from "@/server/auth/session";
import { canEmitFiscalDocument } from "@/server/rbac/billing";

export const dynamic = "force-dynamic";

export default async function FacturacionPendientesPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canEmitFiscalDocument(auth.effective.role)) redirect("/inicio");

  const docs = await listFiscalDocuments({
    companyId: auth.activeCompany.id,
    pendingOnly: true,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pendientes de facturación / remisión</h1>
      <ul className="divide-y rounded-xl border bg-white shadow-sm">
        {docs.map((d) => (
          <li key={d.id} className="px-4 py-3 text-sm">
            <Link href={`/administracion/facturacion/${d.id}`} className="text-sygos-teal">
              {d.folio}
            </Link>{" "}
            · {d.clientName} · {d.status}
          </li>
        ))}
        {docs.length === 0 && (
          <li className="px-4 py-8 text-center text-slate-500">Sin pendientes.</li>
        )}
      </ul>
    </div>
  );
}
