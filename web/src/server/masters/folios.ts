import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { folioSequences } from "@/db/schema";

/** Reserva el siguiente folio entero para tipo + empresa (transaccional). */
export async function nextFolioValue(
  companyId: string,
  folioType: string,
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .insert(folioSequences)
    .values({ companyId, folioType, lastValue: 1 })
    .onConflictDoUpdate({
      target: [folioSequences.companyId, folioSequences.folioType],
      set: {
        lastValue: sql`${folioSequences.lastValue} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({ lastValue: folioSequences.lastValue });

  if (row) return row.lastValue;

  const [existing] = await db
    .select({ lastValue: folioSequences.lastValue })
    .from(folioSequences)
    .where(
      and(
        eq(folioSequences.companyId, companyId),
        eq(folioSequences.folioType, folioType),
      ),
    )
    .limit(1);
  return existing?.lastValue ?? 1;
}
