import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { QuoteBillingRequest } from "@/components/billing/billing-forms";
import { QuoteJourneyPanel } from "@/components/commercial/quote-journey-panel";
import { QuoteWorkflowPanel } from "@/components/commercial/quote-workflow-panel";
import { JourneyPanel } from "@/components/journey/journey-panel";
import {
  formatAssetSummary,
  formatQuoteType,
  quoteOriginLabel,
  quoteStatusLabel,
} from "@/lib/commercial/quote-labels";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
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
  canCreateEqui,
} from "@/server/rbac/assets";
import {
  canManageQuoteFollowUp,
  canManageQuotePricing,
  canRecordQuoteDecision,
  canSeeCommercialModule,
  canSeeIntercompanyBase,
  canViewQuoteEconomics,
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
  const slug = auth.activeCompany.slug as CompanySlug;
  const canPrice = canManageQuotePricing(auth.effective.role);
  const canFollowUp = canManageQuoteFollowUp(auth.effective.role, slug);
  const showEconomics = canViewQuoteEconomics(auth.effective.role, q.status);
  const showRepairBase =
    canManageQuotePricing(auth.effective.role) &&
    q.quoteOrigin === "REPARACION_TERMINADA" &&
    q.repairBaseMxn != null;

  const db = getDb();
  const [actorDiscount] = await db
    .select({ vendorDiscountLimitPct: users.vendorDiscountLimitPct })
    .from(users)
    .where(eq(users.id, auth.effective.id))
    .limit(1);

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

  const assetSummary = formatAssetSummary({
    assetLabel: detail.assetLabel,
    prelimEquipmentType: q.prelimEquipmentType,
    prelimBrand: q.prelimBrand,
    prelimModel: q.prelimModel,
  });

  const showJourneyExtras =
    q.status === "AUTORIZADA_PENDIENTE_INGRESO" ||
    (q.status === "PENDIENTE_DECISION" &&
      q.quoteType === "VENTA_EQUIPO" &&
      detail.lines.length > 1);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{q.folio}</h1>
          <p className="text-sm text-slate-500">
            {quoteStatusLabel[q.status] ?? q.status.replace(/_/g, " ")}
            {detail.vendorName ? ` · Responsable: ${detail.vendorName}` : ""}
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

      {hint && (
        <JourneyPanel title="Qué falta para avanzar" hint={hint} />
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-sm space-y-3">
        <h2 className="font-medium text-slate-900">Cliente y contactos</h2>
        <p>
          <Link href={`/comercial/clientes/${q.clientId}`} className="text-sygos-teal font-medium">
            {detail.client?.legalName}
          </Link>
        </p>
        {detail.recipients.length > 0 ? (
          <ul className="list-disc pl-5 text-slate-700">
            {detail.recipients.map((r) => (
              <li key={r.contactId}>
                {r.name}
                {r.email ? ` · ${r.email}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">Sin destinatarios registrados todavía.</p>
        )}
        {q.creditDays != null && (
          <p>
            <span className="text-slate-500">Crédito (congelado):</span> {q.creditDays} días
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-sm space-y-2">
        <h2 className="font-medium text-slate-900">Contexto</h2>
        <p>
          <span className="text-slate-500">Tipo:</span> {formatQuoteType(q.quoteType)}
        </p>
        <p>
          <span className="text-slate-500">Origen:</span>{" "}
          {quoteOriginLabel[q.quoteOrigin] ?? q.quoteOrigin.replace(/_/g, " ")}
        </p>
        <p>
          <span className="text-slate-500">Equipo / preliminar:</span> {assetSummary}
          {q.prelimSerial ? ` · S/N ${q.prelimSerial}` : ""}
        </p>
        {q.commercialReference && (
          <p>
            <span className="text-slate-500">Referencia comercial:</span> {q.commercialReference}
          </p>
        )}
        {q.complementNotes && (
          <p>
            <span className="text-slate-500">Información complementaria:</span> {q.complementNotes}
          </p>
        )}
        {showBase && (
          <p className="text-amber-800">
            Base intercompañía Servomotores: {formatMxn(q.intercompanyBaseTotalMxn)}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
          {q.diagnosticId && (
            <Link href={`/operacion/diagnosticos/${q.diagnosticId}`} className="text-sygos-teal">
              Diagnóstico origen
            </Link>
          )}
          {q.workOrderId && (
            <Link href={`/operacion/os/${q.workOrderId}`} className="text-sygos-teal">
              OS / reparación
            </Link>
          )}
          {detail.linkedQuote && canSeeIntercompanyBase(auth.effective.role) && (
            <Link
              href={`/comercial/cotizaciones/${detail.linkedQuote.id}`}
              className="text-sygos-teal"
            >
              Cotización vinculada {detail.linkedQuote.folio}
            </Link>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium">Conceptos</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {detail.lines.map((l) => (
            <li key={l.id} className="flex justify-between border-b border-slate-100 py-2">
              <span>
                {l.concept} × {l.quantity}
              </span>
              {showEconomics && l.unitPriceMxn != null && (
                <span>{formatMxn(l.unitPriceMxn)}</span>
              )}
            </li>
          ))}
        </ul>
        {showEconomics ? (
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500">Subtotal</dt>
            <dd>{formatMxn(q.subtotalMxn)}</dd>
            {q.discountPct != null && q.discountPct > 0 && (
              <>
                <dt className="text-slate-500">Descuento</dt>
                <dd>
                  {q.discountPct}% ({formatMxn(q.discountMxn)})
                </dd>
              </>
            )}
            <dt className="text-slate-500">IVA 16%</dt>
            <dd>{formatMxn(q.ivaMxn)}</dd>
            <dt className="text-slate-500 font-medium">Total</dt>
            <dd className="font-semibold">{formatMxn(q.totalMxn)}</dd>
            {showRepairBase && (
              <>
                <dt className="text-slate-500">Base reparación (interno)</dt>
                <dd>{formatMxn(q.repairBaseMxn)}</dd>
              </>
            )}
          </dl>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Los importes se mostrarán cuando CEO/Administrador asigne el precio.
          </p>
        )}
      </section>

      <QuoteWorkflowPanel
        quoteId={id}
        clientId={q.clientId}
        status={q.status}
        quoteOrigin={q.quoteOrigin}
        canPrice={canPrice}
        canFollowUp={canFollowUp}
        vendorDiscountLimitPct={actorDiscount?.vendorDiscountLimitPct ?? null}
        unlimitedDiscount={canManageQuotePricing(auth.effective.role)}
        initialRecipientIds={detail.recipients.map((r) => r.contactId)}
        sentAt={q.sentAt}
      />

      {showJourneyExtras && (
        <QuoteJourneyPanel
          quoteId={id}
          status={q.status}
          hint={null}
          clientId={q.clientId}
          canLinkAsset={
            canManageQuotePricing(auth.effective.role) ||
            canCreateEqui(auth.effective.role, slug)
          }
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
          canDecide={canRecordQuoteDecision(auth.effective.role, slug)}
        />
      )}

      {["AUTORIZADA", "AUTORIZADA_PENDIENTE_INGRESO"].includes(q.status) &&
        canRequestFiscalDocument(auth.effective.role, slug) && (
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-medium">Facturación / remisión</h2>
            <div className="mt-2">
              <QuoteBillingRequest quoteId={id} pendingInvoiceMxn={pendingInvoiceMxn} />
            </div>
          </section>
        )}

      {detail.revisions.length > 0 && showEconomics && (
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
