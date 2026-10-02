import Link from "next/link";
import { PrintButton } from "@/components/hr/print-button";
import { redirect } from "next/navigation";
import { formatMxn } from "@/server/commercial/money";
import { listPayrollFiscalReceipts } from "@/server/hr/payroll-fiscal";
import { getPayrollDetail } from "@/server/hr/payroll";
import { getAuthContext } from "@/server/auth/session";
import { canSeeHrModule } from "@/server/rbac/hr";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function NominaImprimirPage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeHrModule(auth.effective.role)) redirect("/inicio");

  const { id } = await params;
  const detail = await getPayrollDetail(auth.activeCompany.id, id);
  if (!detail) redirect("/capital-humano/nomina");

  const receipts = await listPayrollFiscalReceipts(id);
  const total = detail.lines.reduce((a, l) => a + l.amountMxn, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6 bg-white p-8 print:p-4">
      <div className="flex justify-between print:hidden">
        <Link href="/capital-humano/nomina" className="text-sm text-sygos-teal">
          ← Nómina
        </Link>
        <PrintButton />
      </div>
      <header>
        <h1 className="text-xl font-semibold">Recibo interno de nómina</h1>
        <p className="text-sm text-slate-600">
          {detail.run.folio} · {detail.run.weekKey} · {detail.run.runKind} ·{" "}
          {auth.activeCompany.name}
        </p>
        <p className="text-sm">Estado: {detail.run.status} · Fiscal: {detail.run.fiscalStatus}</p>
      </header>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-slate-500">
            <th className="py-2">Concepto</th>
            <th className="py-2 text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {detail.lines.map((l) => (
            <tr key={l.id} className="border-b">
              <td className="py-2">{l.concept}</td>
              <td className="py-2 text-right">{formatMxn(l.amountMxn)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="py-2 font-semibold">Total</td>
            <td className="py-2 text-right font-semibold">{formatMxn(total)}</td>
          </tr>
        </tfoot>
      </table>
      {receipts.length > 0 && (
        <section className="text-sm">
          <h2 className="font-semibold">Timbrado (parte fiscal)</h2>
          <ul className="mt-2 divide-y">
            {receipts.map(({ receipt, legalName }) => (
              <li key={receipt.id} className="py-1">
                {legalName} · {formatMxn(receipt.amountStampedMxn)} · {receipt.status}
                {receipt.facturapiUuid ? ` · UUID ${receipt.facturapiUuid}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-xs text-slate-500">
        Documento interno SYGOS 3.0 · CFDI de nómina cuando aplica vía Facturapi.
      </p>
    </div>
  );
}
