import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { equiUnits, quotes } from "@/db/schema";
import { formatQuoteFolio } from "@/server/masters/folios";

export async function listClientRelationLinks(params: {
  companyId: string;
  clientId: string;
}) {
  const db = getDb();
  const equi = await db
    .select({ id: equiUnits.id, folioNumber: equiUnits.folioNumber })
    .from(equiUnits)
    .where(
      and(
        eq(equiUnits.clientId, params.clientId),
        eq(equiUnits.companyId, params.companyId),
      ),
    )
    .orderBy(desc(equiUnits.updatedAt))
    .limit(8);

  const quoteRows = await db
    .select({ id: quotes.id, folioNumber: quotes.folioNumber, status: quotes.status })
    .from(quotes)
    .where(
      and(eq(quotes.clientId, params.clientId), eq(quotes.companyId, params.companyId)),
    )
    .orderBy(desc(quotes.updatedAt))
    .limit(8);

  const links: { href: string; label: string }[] = [];
  for (const e of equi) {
    links.push({
      href: `/activos/equi/${e.id}`,
      label: `EQUI-${e.folioNumber}`,
    });
  }
  for (const q of quoteRows) {
    links.push({
      href: `/comercial/cotizaciones/${q.id}`,
      label: `Cotización ${formatQuoteFolio(q.folioNumber)} (${q.status.replace(/_/g, " ")})`,
    });
  }
  return links;
}
