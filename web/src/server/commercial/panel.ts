import { listUpcomingActivities } from "@/server/commercial/agenda";
import { listQuotes } from "@/server/commercial/quotes";
import { getVendorPerformance } from "@/server/commercial/goals";
import { listPendingDeliveries } from "@/server/commercial/sales";

export async function buildSalesPanel(params: {
  companyId: string;
  vendorUserId: string;
  year: number;
  month: number;
}) {
  const [followUpQuotes, pendingDeliveries, agenda, performance] =
    await Promise.all([
      listQuotes({
        companyId: params.companyId,
        vendorUserId: params.vendorUserId,
        status: ["PENDIENTE_DECISION"],
      }),
      listPendingDeliveries(params.companyId),
      listUpcomingActivities({
        companyId: params.companyId,
        ownerUserId: params.vendorUserId,
      }),
      getVendorPerformance({
        companyId: params.companyId,
        userId: params.vendorUserId,
        year: params.year,
        month: params.month,
      }),
    ]);

  const vendorDeliveries = pendingDeliveries;

  return {
    followUpQuotes,
    pendingDeliveries: vendorDeliveries,
    billingPending: [] as { label: string; href: string }[],
    collections: [] as { label: string; href: string }[],
    agenda,
    performance,
    phase5Note:
      "Facturación pendiente y cobranza se conectan en Fase 5 (facturación y CxC).",
  };
}
