import { listCeoPendingPurchaseOrders } from "@/server/purchases/orders";
import { listDirectPurchases } from "@/server/purchases/direct";
import { listFiscalDocuments } from "@/server/billing/fiscal-documents";
import { listOvertimePendingCeo } from "@/server/hr/overtime";
import { listVacationRequests } from "@/server/hr/vacations";
import { listQuotes } from "@/server/commercial/quotes";

export async function buildCeoPanel(companyId: string) {
  const [ocPending, vacations, overtime, pricing] = await Promise.all([
    listCeoPendingPurchaseOrders(companyId),
    listVacationRequests(companyId),
    listOvertimePendingCeo(companyId),
    listQuotes({ companyId, pendingPricingOnly: true }),
  ]);
  return {
    purchaseOrders: ocPending,
    vacations: vacations.filter((v) => v.status === "PENDIENTE"),
    overtime,
    quotesPendingPricing: pricing,
  };
}

export async function buildCoordinationPanel(companyId: string) {
  const [direct, fiscalPending] = await Promise.all([
    listDirectPurchases(companyId),
    listFiscalDocuments({ companyId, pendingOnly: true }),
  ]);
  const directPending = direct.filter(
    (d) => d.purchase.status === "PENDIENTE_VALIDAR",
  );
  const orders = await import("@/server/purchases/orders").then((m) =>
    m.listPurchaseOrders(companyId),
  );
  const authorizedOc = orders.filter(
    (o) => o.order.status === "PENDIENTE_PROCESAR",
  );
  return {
    directPurchases: directPending,
    fiscalDocuments: fiscalPending,
    purchaseOrdersToProcess: authorizedOc,
  };
}

export async function buildGerenteSmPanel(companyId: string) {
  const quotes = await listQuotes({ companyId, pendingPricingOnly: true });
  const direct = await listDirectPurchases(companyId);
  return {
    pendingQuotes: quotes,
    directPurchases: direct.slice(0, 10),
  };
}
