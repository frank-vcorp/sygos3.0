import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  accountsPayable,
  accountsReceivable,
  financialMovements,
  fiscalDocuments,
  quotes,
  workOrders,
} from "@/db/schema";
import { computeArDisplayStatus } from "@/server/billing/ar-ap";
import { listPayables } from "@/server/billing/ar-ap";
import { currentMonthKey } from "@/server/finance/dashboard";
import { getProductionAnalytics } from "@/server/ops/production-analytics";

function monthRange(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return { start, end };
}

export async function buildExtendedCompanyReport(
  companyId: string,
  monthKey?: string,
) {
  const key = monthKey ?? currentMonthKey();
  const { start, end } = monthRange(key);
  const db = getDb();

  const [quotesByStatus] = await db
    .select({
      total: sql<number>`count(*)::int`,
      authorized: sql<number>`count(*) filter (where ${quotes.status} = 'AUTORIZADA')::int`,
      pendingDecision: sql<number>`count(*) filter (where ${quotes.status} = 'PENDIENTE_DECISION')::int`,
      pendingPricing: sql<number>`count(*) filter (where ${quotes.status} = 'PENDIENTE_COTIZAR')::int`,
      rejected: sql<number>`count(*) filter (where ${quotes.status} = 'NO_AUTORIZADA')::int`,
    })
    .from(quotes)
    .where(eq(quotes.companyId, companyId));

  const [movements] = await db
    .select({
      ingresos: sql<number>`coalesce(sum(${financialMovements.amountMxn}) filter (where ${financialMovements.kind} = 'INGRESO'), 0)`,
      egresos: sql<number>`coalesce(sum(${financialMovements.amountMxn}) filter (where ${financialMovements.kind} = 'EGRESO'), 0)`,
    })
    .from(financialMovements)
    .where(
      and(
        eq(financialMovements.companyId, companyId),
        gte(financialMovements.occurredAt, start),
        lte(financialMovements.occurredAt, end),
      ),
    );

  const [fiscalMonth] = await db
    .select({
      emitidas: sql<number>`count(*) filter (where ${fiscalDocuments.status} = 'EMITIDA')::int`,
      remisiones: sql<number>`count(*) filter (where ${fiscalDocuments.docKind} = 'REMISION')::int`,
    })
    .from(fiscalDocuments)
    .where(
      and(
        eq(fiscalDocuments.companyId, companyId),
        gte(fiscalDocuments.createdAt, start),
        lte(fiscalDocuments.createdAt, end),
      ),
    );

  const arRows = await db
    .select({ ar: accountsReceivable })
    .from(accountsReceivable)
    .where(eq(accountsReceivable.companyId, companyId));

  let cxcOpenMxn = 0;
  let cxcOverdueMxn = 0;
  for (const { ar } of arRows) {
    const view = computeArDisplayStatus(ar);
    if (view.balanceMxn <= 0) continue;
    cxcOpenMxn += view.balanceMxn;
    if (view.isOverdue) cxcOverdueMxn += view.balanceMxn;
  }

  const apRows = await listPayables(companyId);
  const cxpOpenMxn = apRows
    .filter((p) => p.balanceMxn > 0)
    .reduce((a, p) => a + p.balanceMxn, 0);
  const now = Date.now();
  const cxpOverdueMxn = apRows
    .filter(
      (p) =>
        p.balanceMxn > 0 &&
        p.dueDate &&
        p.dueDate.getTime() < now,
    )
    .reduce((a, p) => a + p.balanceMxn, 0);

  const repairsByStatus = await db
    .select({
      status: workOrders.repairStatus,
      count: sql<number>`count(*)::int`,
    })
    .from(workOrders)
    .where(eq(workOrders.companyId, companyId))
    .groupBy(workOrders.repairStatus);

  const production = await getProductionAnalytics(companyId, key);

  return {
    monthKey: key,
    quotes: quotesByStatus ?? {
      total: 0,
      authorized: 0,
      pendingDecision: 0,
      pendingPricing: 0,
      rejected: 0,
    },
    movements: movements ?? { ingresos: 0, egresos: 0 },
    fiscal: fiscalMonth ?? { emitidas: 0, remisiones: 0 },
    cxcOpenMxn,
    cxcOverdueMxn,
    cxpOpenMxn,
    cxpOverdueMxn,
    repairsByStatus,
    production,
  };
}
