import { getFinanceDashboard } from "@/server/finance/dashboard";
import { listCommissions, syncCommissionsForAuthorizedQuotes } from "@/server/hr/commissions";
import { listProductionEntries } from "@/server/ops/production";

export async function buildCompanyReport(companyId: string) {
  await syncCommissionsForAuthorizedQuotes(companyId);
  const [finance, commissions, production] = await Promise.all([
    getFinanceDashboard(companyId),
    listCommissions(companyId),
    listProductionEntries(companyId),
  ]);
  const commissionTotal = commissions
    .filter((c) => c.status === "DEVENGADA")
    .reduce((a, c) => a + c.amountMxn, 0);
  const productionHours =
    production.reduce((a, p) => a + p.hoursTenths, 0) / 10;
  return {
    finance,
    commissionTotalMxn: commissionTotal,
    productionHours,
    productionEntries: production.length,
  };
}
