import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  diagnostics,
  productionEntries,
  quotes,
  users,
  workOrders,
} from "@/db/schema";
import { currentMonthKey } from "@/server/finance/dashboard";

function monthRange(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return { start, end };
}

export async function getProductionAnalytics(
  companyId: string,
  monthKey?: string,
) {
  const key = monthKey ?? currentMonthKey();
  const { start, end } = monthRange(key);
  const db = getDb();

  const hoursByTech = await db
    .select({
      technicianUserId: productionEntries.technicianUserId,
      displayName: users.displayName,
      hoursTenths: sql<number>`coalesce(sum(${productionEntries.hoursTenths}), 0)`,
      entries: sql<number>`count(*)::int`,
    })
    .from(productionEntries)
    .innerJoin(users, eq(users.id, productionEntries.technicianUserId))
    .where(
      and(
        eq(productionEntries.companyId, companyId),
        gte(productionEntries.recordedAt, start),
        lte(productionEntries.recordedAt, end),
      ),
    )
    .groupBy(productionEntries.technicianUserId, users.displayName);

  const validatedByTech = await db
    .select({
      assignedUserId: diagnostics.assignedUserId,
      displayName: users.displayName,
      count: sql<number>`count(*)::int`,
    })
    .from(diagnostics)
    .innerJoin(users, eq(users.id, diagnostics.assignedUserId))
    .where(
      and(
        eq(diagnostics.companyId, companyId),
        eq(diagnostics.status, "VALIDADO"),
        gte(diagnostics.validatedAt, start),
        lte(diagnostics.validatedAt, end),
      ),
    )
    .groupBy(diagnostics.assignedUserId, users.displayName);

  const repairsClosed = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(workOrders)
    .where(
      and(
        eq(workOrders.companyId, companyId),
        inArray(workOrders.repairStatus, [
          "REPARACION_TERMINADA",
          "SIN_REPARACION",
        ]),
        gte(workOrders.updatedAt, start),
        lte(workOrders.updatedAt, end),
      ),
    );

  const [quoteStats] = await db
    .select({
      authorized: sql<number>`count(*) filter (where ${quotes.status} = 'AUTORIZADA')::int`,
      pending: sql<number>`count(*) filter (where ${quotes.status} in ('PENDIENTE_DECISION', 'PENDIENTE_COTIZAR'))::int`,
      rejected: sql<number>`count(*) filter (where ${quotes.status} = 'NO_AUTORIZADA')::int`,
    })
    .from(quotes)
    .where(
      and(
        eq(quotes.companyId, companyId),
        gte(quotes.updatedAt, start),
        lte(quotes.updatedAt, end),
      ),
    );

  const slaOverdueOpen = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(diagnostics)
    .where(
      and(
        eq(diagnostics.companyId, companyId),
        inArray(diagnostics.status, [
          "EN_ESPERA",
          "EN_DIAGNOSTICO",
          "PENDIENTE_VALIDACION_GERENTE",
          "DEVUELTO_CORRECCION",
        ]),
        lte(diagnostics.slaDueAt, new Date()),
      ),
    );

  const techMap = new Map<
    string,
    {
      userId: string;
      name: string;
      hours: number;
      productionEntries: number;
      diagnosticsValidated: number;
    }
  >();

  for (const row of hoursByTech) {
    techMap.set(row.technicianUserId, {
      userId: row.technicianUserId,
      name: row.displayName ?? "—",
      hours: row.hoursTenths / 10,
      productionEntries: row.entries,
      diagnosticsValidated: 0,
    });
  }
  for (const row of validatedByTech) {
    if (!row.assignedUserId) continue;
    const existing = techMap.get(row.assignedUserId);
    if (existing) {
      existing.diagnosticsValidated = row.count;
    } else {
      techMap.set(row.assignedUserId, {
        userId: row.assignedUserId,
        name: row.displayName ?? "—",
        hours: 0,
        productionEntries: 0,
        diagnosticsValidated: row.count,
      });
    }
  }

  const decided =
    (quoteStats?.authorized ?? 0) + (quoteStats?.rejected ?? 0);
  const conversionPct =
    decided > 0
      ? Math.round(((quoteStats?.authorized ?? 0) / decided) * 1000) / 10
      : null;

  return {
    monthKey: key,
    byTechnician: [...techMap.values()].sort(
      (a, b) => b.hours - a.hours || b.diagnosticsValidated - a.diagnosticsValidated,
    ),
    summary: {
      repairsClosed: repairsClosed[0]?.count ?? 0,
      slaOverdueOpen: slaOverdueOpen[0]?.count ?? 0,
      quotesAuthorized: quoteStats?.authorized ?? 0,
      quotesPending: quoteStats?.pending ?? 0,
      conversionPct,
    },
  };
}
