import Link from "next/link";
import { redirect } from "next/navigation";
import { QuoteBillingRequest } from "@/components/billing/billing-forms";
import { QuoteActions } from "@/components/commercial/commercial-forms";
import { QuoteJourneyPanel } from "@/components/commercial/quote-journey-panel";
import { getClientDetail } from "@/server/masters/clients";
import { listEquiUnits } from "@/server/assets/equi";
import { listMotors } from "@/server/assets/motors";
import { resolveCompanyIds } from "@/server/assets/context";
import { getQuoteJourneyHint } from "@/server/commercial/quote-handoffs";
import { canRequestFiscalDocument } from "@/server/rbac/billing";
import type { CompanySlug } from "@/lib/company";
import { formatMxn } from "@/server/commercial/money";
import { getQuotePendingInvoiceMxn } from "@/server/billing/fiscal-documents";
import { getQuoteDetail } from "@/server/commercial/quotes";
import { getAuthContext } from "@/server/auth/session";
import {
  canManageQuotePricing,
  canSeeCommercialModule,
  canSeeIntercompanyBase,
} from "@/server/rbac/commercial";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CotizacionDetallePage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeCommercialModule(auth.effective.role)) redirect("/inicio");

  const { id } = await params;
  const detail = await getQuoteDetail(auth.activeCompany.id, id);
  if (!detail) redirect("/comercial/cotizaciones");

  const q = detail.quote;
  const pendingInvoiceMxn =
    ["AUTORIZADA", "AUTORIZADA_PENDIENTE_INGRESO"].includes(q.status) ?
      await getQuotePendingInvoiceMxn(id)
    : 0;
  const showBase =
    canSeeIntercompanyBase(auth.effective.role) &&
    detail.quote.intercompanyBaseTotalMxn != null;

  const hint = await getQuoteJourneyHint({
    companyId: auth.activeCompany.id,
    quoteId: id,
  });
  const ids = await resolveCompanyIds();
  const slug = auth.activeCompany.slug as CompanySlug;
  const clientDetail = await getClientDetail({
    companyId: auth.activeCompany.id,
    clientId: q.clientId,
  });
  const equiRows = await listEquiUnits({
    companyId: auth.activeCompany.id,
    clientId: q.clientId,
  });
  const motorRows = await listMotors({
    activeSlug: slug,
    systronCompanyId: ids.systronId,
    servomotoresCompanyId: ids.servomotoresId,
    clientId: q.clientId,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{q.folio}</h1>
          <p className="text-sm text-slate-500">
            {detail.client?.legalName} · {q.status.replace(/_/g, " ")}
          </p>
        </div>
        <Link
          href={`/comercial/cotizaciones/${id}/imprimir`}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          target="_blank"
        >
          PDF / Imprimir
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-sm space-y-2">
        <p>
          <span className="text-slate-500">Tipo:</span> {q.quoteType.replace(/_/g, " ")}
        </p>
        <p>
          <span className="text-slate-500">Origen:</span> {q.quoteOrigin.replace(/_/g, " ")}
        </p>
        {detail.assetLabel && (
          <p>
            <span className="text-slate-500">Equipo:</span> {detail.assetLabel}
          </p>
        )}
        {(q.prelimBrand || q.prelimModel) && (
          <p>
            <span className="text-slate-500">Preliminar:</span>{" "}
            {[q.prelimEquipmentType, q.prelimBrand, q.prelimModel, q.prelimSerial]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {showBase && (
          <p className="text-amber-800">
            Base intercompañía Servomotores: {formatMxn(q.intercompanyBaseTotalMxn)}
          </p>
        )}
        {q.diagnosticId && (
          <p>
            <Link href={`/operacion/diagnosticos/${q.diagnosticId}`} className="text-sygos-teal">
              Ver diagnóstico origen
            </Link>
          </p>
        )}
        {q.workOrderId && (
          <p>
            <Link href={`/operacion/os/${q.workOrderId}`} className="text-sygos-teal">
              Ver OS origen
            </Link>
          </p>
        )}
      </section>

      <QuoteJourneyPanel
        quoteId={id}
        status={q.status}
        hint={hint}
        clientId={q.clientId}
        canLinkAsset={canManageQuotePricing(auth.effective.role)}
        equiOptions={equiRows.map((e) => ({
          id: e.id,
          label: `${e.folio} · ${e.clientName}`,
        }))}
        motorOptions={motorRows.map((m) => ({
          id: m.id,
          label: m.folio,
        }))}
        quoteType={q.quoteType}
        lineIds={detail.lines.map((l) => ({
          id: l.id,
          concept: l.concept,
          lineAuthorized: l.lineAuthorized,
        }))}
        canDecide={canSeeCommercialModule(auth.effective.role)}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium">Conceptos</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {detail.lines.map((l) => (
            <li key={l.id} className="flex justify-between border-b border-slate-100 py-2">
              <span>
                {l.concept} × {l.quantity}
              </span>
              {l.unitPriceMxn != null && <span>{formatMxn(l.unitPriceMxn)}</span>}
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-500">Subtotal</dt>
          <dd>{formatMxn(q.subtotalMxn)}</dd>
          <dt className="text-slate-500">IVA 16%</dt>
          <dd>{formatMxn(q.ivaMxn)}</dd>
          <dt className="text-slate-500 font-medium">Total</dt>
          <dd className="font-semibold">{formatMxn(q.totalMxn)}</dd>
        </dl>
      </section>

      {["AUTORIZADA", "AUTORIZADA_PENDIENTE_INGRESO"].includes(q.status) &&
        canRequestFiscalDocument(
          auth.effective.role,
          auth.activeCompany.slug as CompanySlug,
        ) && (
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-medium">Facturación / remisión</h2>
            <div className="mt-2">
              <QuoteBillingRequest
                quoteId={id}
                pendingInvoiceMxn={pendingInvoiceMxn}
              />
            </div>
          </section>
        )}

      <QuoteActions
        quoteId={id}
        status={q.status}
        canPrice={canManageQuotePricing(auth.effective.role)}
        canDecide={canSeeCommercialModule(auth.effective.role)}
        contacts={
          clientDetail?.contacts.map((c) => ({ id: c.id, name: c.name })) ?? []
        }
      />

      {detail.revisions.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-sm">
          <h2 className="font-medium">Historial de precio</h2>
          <ul className="mt-2 space-y-1 text-slate-600">
            {detail.revisions.map((r) => (
              <li key={r.id}>
                {r.note} — {formatMxn(r.totalMxn)} ·{" "}
                {r.createdAt?.toLocaleString("es-MX")}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
