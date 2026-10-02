import Link from "next/link";
import { redirect } from "next/navigation";
import { FiscalDocActions } from "@/components/billing/billing-forms";
import { formatMxn } from "@/server/commercial/money";
import { getFiscalDocumentDetail } from "@/server/billing/fiscal-documents";
import { getAuthContext } from "@/server/auth/session";
import {
  canApproveFiscalCancellation,
  canEmitFiscalDocument,
  canSeeBillingModule,
} from "@/server/rbac/billing";
import { JourneyPanel } from "@/components/journey/journey-panel";
import { getFiscalDocumentJourneyHint } from "@/server/journey/fiscal-handoffs";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function FiscalDocumentPage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeBillingModule(auth.effective.role)) redirect("/inicio");

  const { id } = await params;
  const detail = await getFiscalDocumentDetail(auth.activeCompany.id, id);
  if (!detail) redirect("/administracion/facturacion");

  const journeyHint = getFiscalDocumentJourneyHint({
    status: detail.doc.status,
    docKind: detail.doc.docKind,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/administracion/facturacion" className="text-sm text-sygos-teal">
        ← Facturación
      </Link>
      <h1 className="text-2xl font-semibold">{detail.doc.folio}</h1>
      <p className="text-sm text-slate-500">
        {detail.client?.legalName} · {detail.doc.status.replace(/_/g, " ")}
        {detail.doc.fiscalSimulated && detail.doc.status === "EMITIDA" ? (
          <span className="ml-2 rounded bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-950">
            PRUEBA / SIN VALIDEZ
          </span>
        ) : null}
      </p>
      <JourneyPanel hint={journeyHint} />
      {detail.doc.fiscalRetryCount > 0 && (
        <p className="text-xs text-slate-500">
          Reintentos fiscales: {detail.doc.fiscalRetryCount}
        </p>
      )}
      <ul className="rounded-xl border bg-white p-4 text-sm">
        {detail.lines.map((l) => (
          <li key={l.id} className="flex justify-between py-1">
            <span>
              {l.concept} × {l.quantity}
            </span>
            <span>{formatMxn(l.unitPriceMxn * l.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="font-semibold">Total: {formatMxn(detail.doc.totalMxn)}</p>
      {detail.doc.quoteId && (
        <Link href={`/comercial/cotizaciones/${detail.doc.quoteId}`} className="text-sm text-sygos-teal">
          Ver cotización origen
        </Link>
      )}
      <FiscalDocActions
        documentId={id}
        status={detail.doc.status}
        docKind={detail.doc.docKind}
        canEmit={canEmitFiscalDocument(auth.effective.role)}
        canApproveCancel={canApproveFiscalCancellation(auth.effective.role)}
        lastError={detail.doc.lastFiscalError}
      />
    </div>
  );
}
