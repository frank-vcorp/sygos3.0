import type { CompanySlug } from "@/lib/company";
import { listMotors } from "@/server/assets/motors";
import { listReceivables, listPayables } from "@/server/billing/ar-ap";
import { listFiscalDocuments } from "@/server/billing/fiscal-documents";
import { listPayments } from "@/server/billing/payments";
import { listPendingDeliveries } from "@/server/commercial/sales";
import { listQuotes } from "@/server/commercial/quotes";
import { getFinanceDashboard } from "@/server/finance/dashboard";
import { listCommissions, syncCommissionsForAuthorizedQuotes } from "@/server/hr/commissions";
import { listOvertimePendingCeo } from "@/server/hr/overtime";
import { listPayrollRuns } from "@/server/hr/payroll";
import { listVacationRequests } from "@/server/hr/vacations";
import { formatFiscalFolio } from "@/server/masters/folios";
import { listDiagnostics } from "@/server/ops/diagnostics";
import { listWarrantyCeoPending } from "@/server/ops/warranty";
import { formatDiagFolio } from "@/server/ops/diagnostics";
import { getProductionAnalytics } from "@/server/ops/production-analytics";
import { listDirectPurchases } from "@/server/purchases/direct";
import { listCeoPendingPurchaseOrders, listPurchaseOrders } from "@/server/purchases/orders";
import type { PanelLink } from "@/server/panels/technical";

function fiscalLink(
  id: string,
  docKind: string,
  folioNumber: number,
  clientName: string,
  status: string,
): PanelLink {
  return {
    href: `/administracion/facturacion/${id}`,
    label: `${formatFiscalFolio(docKind as "FACTURA", folioNumber)} · ${clientName} · ${status}`,
  };
}

export async function buildCeoPanel(companyId: string) {
  await syncCommissionsForAuthorizedQuotes(companyId);
  const [
    ocPending,
    vacations,
    overtime,
    pricing,
    payrollRuns,
    cancellations,
    creditNotes,
    finance,
    production,
    commissions,
    warrantyCeo,
  ] = await Promise.all([
    listCeoPendingPurchaseOrders(companyId),
    listVacationRequests(companyId),
    listOvertimePendingCeo(companyId),
    listQuotes({ companyId, pendingPricingOnly: true }),
    listPayrollRuns(companyId),
    listFiscalDocuments({
      companyId,
      status: ["CANCELACION_SOLICITADA"],
    }),
    listFiscalDocuments({
      companyId,
      status: ["SOLICITUD_PENDIENTE"],
    }).then((rows) => rows.filter((d) => d.docKind === "NOTA_CREDITO")),
    getFinanceDashboard(companyId),
    getProductionAnalytics(companyId),
    listCommissions(companyId),
    listWarrantyCeoPending(companyId),
  ]);

  const payrollDraft = payrollRuns.filter((r) => r.status === "BORRADOR").slice(0, 8);
  const commissionPendingMxn = commissions
    .filter((c) => c.status === "DEVENGADA")
    .reduce((a, c) => a + c.amountMxn, 0);

  const commercialSummary = {
    quotesToPrice: pricing.length,
    facturadoMesMxn: finance.facturadoMxn,
    cobradoMesMxn: finance.cobradoMxn,
    cxcMxn: finance.cxcMxn,
  };

  const productionSummary = {
    slaOverdue: production.summary.slaOverdueOpen,
    repairsClosedMonth: production.summary.repairsClosed,
    conversionPct: production.summary.conversionPct,
  };

  return {
    purchaseOrders: ocPending,
    vacations: vacations.filter((v) => v.status === "PENDIENTE"),
    overtime,
    quotesPendingPricing: pricing,
    payrollDraft,
    fiscalCancellations: cancellations.map((d) =>
      fiscalLink(d.id, d.docKind, d.folioNumber, d.clientName, d.status),
    ),
    creditNotesPending: creditNotes.map((d) =>
      fiscalLink(d.id, d.docKind, d.folioNumber, d.clientName, d.status),
    ),
    commercialSummary,
    productionSummary,
    financeSummary: {
      facturadoMxn: finance.facturadoMxn,
      egresosMxn: finance.egresosMxn,
      flujoNetoMxn: finance.flujoNetoMxn,
      cxpMxn: finance.cxpMxn,
    },
    commissionPendingMxn,
    warrantyCommercialPending: warrantyCeo.map((w) => ({
      href: `/operacion/diagnosticos/${w.diagnostic.id}`,
      label: `${formatDiagFolio(w.diagnostic.folioNumber)} · Garantía no procedente`,
    })),
  };
}

export async function buildCoordinationPanel(companyId: string) {
  const [direct, fiscalPending, payments, payrollRuns, arRows, apRows, orders] =
    await Promise.all([
      listDirectPurchases(companyId),
      listFiscalDocuments({ companyId, pendingOnly: true }),
      listPayments(companyId),
      listPayrollRuns(companyId),
      listReceivables(companyId),
      listPayables(companyId),
      listPurchaseOrders(companyId),
    ]);

  const directPending = direct.filter(
    (d) => d.purchase.status === "PENDIENTE_VALIDAR",
  );
  const authorizedOc = orders.filter(
    (o) => o.order.status === "PENDIENTE_PROCESAR",
  );
  const paymentsToValidate = payments
    .filter((p) => p.status === "PENDIENTE_VALIDACION")
    .slice(0, 20);
  const remisiones = fiscalPending.filter((d) => d.docKind === "REMISION");
  const facturas = fiscalPending.filter((d) => d.docKind === "FACTURA");
  const cxcOverdue = arRows
    .filter((r) => r.balanceMxn > 0 && r.isOverdue)
    .slice(0, 15);
  const now = Date.now();
  const cxpOverdue = apRows
    .filter((p) => p.balanceMxn > 0 && p.dueDate && p.dueDate.getTime() < now)
    .slice(0, 15);
  const payrollDraft = payrollRuns.filter((r) => r.status === "BORRADOR").slice(0, 5);
  const pendingVerification = apRows
    .filter((p) => p.pendingVerification && p.balanceMxn > 0)
    .slice(0, 12);

  return {
    directPurchases: directPending,
    remisiones,
    facturasPendientes: facturas,
    purchaseOrdersToProcess: authorizedOc,
    paymentsToValidate,
    cxcOverdue,
    cxpOverdue,
    payrollDraft,
    pendingVerification,
  };
}

export async function buildGerenteSmPanel(params: {
  companyId: string;
  activeSlug: CompanySlug;
  systronCompanyId: string;
  servomotoresCompanyId: string;
}) {
  const [
    quotes,
    direct,
    deliveries,
    diagnostics,
    motorsPendingIntake,
  ] = await Promise.all([
    listQuotes({ companyId: params.companyId, pendingPricingOnly: true }),
    listDirectPurchases(params.companyId),
    listPendingDeliveries(params.companyId),
    listDiagnostics({
      activeSlug: params.activeSlug,
      companyId: params.companyId,
      activeOnly: true,
      limit: 15,
    }),
    listMotors({
      activeSlug: "SERVOMOTORES",
      systronCompanyId: params.systronCompanyId,
      servomotoresCompanyId: params.servomotoresCompanyId,
      intakeFilter: "PENDING_INTAKE",
    }),
  ]);

  const warrantyOpen = diagnostics.filter(
    (d) =>
      d.attentionType === "DIAGNOSTICO_GARANTIA" &&
      d.status !== "VALIDADO",
  );
  const directRecent = direct.slice(0, 10);

  return {
    pendingQuotes: quotes,
    directPurchases: directRecent,
    pendingDeliveries: deliveries.slice(0, 12),
    pendingIntakeMotors: motorsPendingIntake.slice(0, 12),
    activeDiagnostics: diagnostics.slice(0, 12),
    warrantyDiagnostics: warrantyOpen.slice(0, 12),
    quickLinks: [
      { href: "/comercial/pendientes-cotizar", label: "Pendientes de cotizar" },
      { href: "/operacion/compras", label: "Compras directas" },
      { href: "/comercial/ventas", label: "Entregas de venta" },
      { href: "/activos/mot", label: "Ingreso físico MOT" },
      { href: "/operacion/diagnosticos", label: "Diagnósticos" },
      { href: "/operacion/os", label: "Órdenes de servicio" },
    ] satisfies PanelLink[],
  };
}
