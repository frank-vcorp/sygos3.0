import { listReceivables } from "@/server/billing/ar-ap";
import { listBillingPendingForClients } from "@/server/billing/fiscal-documents";
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
  const [followUpQuotes, pendingDeliveries, agenda, performance, billingPending, arRows] =
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
      listBillingPendingForClients({
        companyId: params.companyId,
        vendorUserId: params.vendorUserId,
      }),
      listReceivables(params.companyId, {
        vendorUserId: params.vendorUserId,
      }),
    ]);

  const collections = arRows
    .filter((r) => r.balanceMxn > 0)
    .sort((a, b) => {
      const ad = a.dueDate?.getTime() ?? 0;
      const bd = b.dueDate?.getTime() ?? 0;
      return ad - bd;
    })
    .slice(0, 12)
    .map((r) => ({
      label: `${r.clientName} · saldo ${r.balanceMxn} MXN${r.isOverdue ? " · vencida" : ""}`,
      href: `/administracion/cobranza/${r.arId}`,
    }));

  return {
    followUpQuotes,
    pendingDeliveries,
    billingPending,
    collections,
    agenda,
    performance,
  };
}
