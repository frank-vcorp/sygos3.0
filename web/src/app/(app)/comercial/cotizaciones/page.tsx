import Link from "next/link";
import { redirect } from "next/navigation";
import { ListShell } from "@/components/masters/list-shell";
import { listQuotes } from "@/server/commercial/quotes";
import { formatMxn } from "@/server/commercial/money";
import { getAuthContext } from "@/server/auth/session";
import {
  canCreateQuoteAsVendor,
  canSeeCommercialModule,
  vendorQuoteScopeUserId,
} from "@/server/rbac/commercial";
import type { CompanySlug } from "@/lib/company";

export const dynamic = "force-dynamic";

export default async function CotizacionesPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeCommercialModule(auth.effective.role)) redirect("/inicio");

  const scope = vendorQuoteScopeUserId(auth.effective.role, auth.effective.id);
  const rows = await listQuotes({
    companyId: auth.activeCompany.id,
    vendorUserId: scope ?? undefined,
  });
  const slug = auth.activeCompany.slug as CompanySlug;
  const canCreate = canCreateQuoteAsVendor(auth.effective.role, slug);

  return (
    <ListShell
      title="Cotizaciones"
      description="Determinación de precio, seguimiento y decisión comercial."
      createHref={canCreate ? "/comercial/cotizaciones/nueva" : undefined}
    >
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Folio</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q) => (
            <tr key={q.id} className="border-b border-slate-100">
              <td className="px-4 py-3">
                <Link
                  href={`/comercial/cotizaciones/${q.id}`}
                  className="font-medium text-sygos-teal hover:underline"
                >
                  {q.folio}
                </Link>
              </td>
              <td className="px-4 py-3">{q.clientName}</td>
              <td className="px-4 py-3">{q.status.replace(/_/g, " ")}</td>
              <td className="px-4 py-3">{formatMxn(q.totalMxn)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListShell>
  );
}
