import { redirect } from "next/navigation";
import { formatMxn } from "@/server/commercial/money";
import { getQuoteDetail } from "@/server/commercial/quotes";
import { getCompanySettings } from "@/server/config/company-settings";
import { getAuthContext } from "@/server/auth/session";
import { canSeeCommercialModule } from "@/server/rbac/commercial";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CotizacionImprimirPage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeCommercialModule(auth.effective.role)) redirect("/inicio");

  const { id } = await params;
  const detail = await getQuoteDetail(auth.activeCompany.id, id);
  if (!detail) redirect("/comercial/cotizaciones");

  const settings = await getCompanySettings(auth.activeCompany.id);
  const q = detail.quote;

  return (
    <div className="mx-auto max-w-2xl bg-white p-10 text-slate-900 print:p-8">
      <header className="border-b border-slate-300 pb-4">
        <h1 className="text-xl font-bold">
          {settings?.tradeName ?? auth.activeCompany.name}
        </h1>
        <p className="text-sm text-slate-600">Cotización {q.folio}</p>
      </header>
      <section className="mt-6 text-sm">
        <p className="font-medium">{detail.client?.legalName}</p>
        {q.commercialReference && <p>Ref: {q.commercialReference}</p>}
      </section>
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left">Concepto</th>
            <th className="py-2 text-right">Cant.</th>
            <th className="py-2 text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {detail.lines.map((l) => (
            <tr key={l.id} className="border-b border-slate-100">
              <td className="py-2">{l.concept}</td>
              <td className="py-2 text-right">{l.quantity}</td>
              <td className="py-2 text-right">
                {l.unitPriceMxn != null ? formatMxn(l.unitPriceMxn * l.quantity) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-6 ml-auto w-56 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatMxn(q.subtotalMxn)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>IVA 16%</dt>
          <dd>{formatMxn(q.ivaMxn)}</dd>
        </div>
        <div className="flex justify-between font-bold">
          <dt>Total MXN</dt>
          <dd>{formatMxn(q.totalMxn)}</dd>
        </div>
      </dl>
      <p className="mt-8 text-xs text-slate-500">
        Precios antes de IVA · MXN · Documento generado por SYGOS 3.0
      </p>
    </div>
  );
}
