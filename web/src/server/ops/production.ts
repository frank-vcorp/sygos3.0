import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { productionEntries, workOrders } from "@/db/schema";
import { formatOsFolio } from "@/server/masters/folios";

export async function recordProductionEntry(params: {
  companyId: string;
  workOrderId: string;
  technicianUserId: string;
  hoursTenths: number;
  note?: string;
}) {
  const db = getDb();
  const [row] = await db
    .insert(productionEntries)
    .values({
      companyId: params.companyId,
      workOrderId: params.workOrderId,
      technicianUserId: params.technicianUserId,
      hoursTenths: params.hoursTenths,
      note: params.note ?? null,
    })
    .returning();
  return row;
}

export async function listProductionEntries(companyId: string) {
  const db = getDb();
  return db
    .select({
      entry: productionEntries,
      folio: workOrders.folioNumber,
    })
    .from(productionEntries)
    .innerJoin(workOrders, eq(workOrders.id, productionEntries.workOrderId))
    .where(eq(productionEntries.companyId, companyId))
    .orderBy(desc(productionEntries.recordedAt))
    .limit(100)
    .then((rows) =>
      rows.map((r) => ({
        ...r.entry,
        workOrderFolio: formatOsFolio(r.folio),
      })),
    );
}
