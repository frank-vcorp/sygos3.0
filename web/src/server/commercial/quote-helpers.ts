import { getDb } from "@/db/client";
import { quoteLines } from "@/db/schema";

export async function insertQuoteLinesHelper(
  quoteId: string,
  lines: { concept: string; quantity: number; unitPriceMxn?: number }[],
) {
  const db = getDb();
  if (lines.length === 0) {
    await db.insert(quoteLines).values({
      quoteId,
      sortOrder: 0,
      concept: "Concepto",
      quantity: 1,
    });
    return;
  }
  await db.insert(quoteLines).values(
    lines.map((l, i) => ({
      quoteId,
      sortOrder: i,
      concept: l.concept.trim(),
      quantity: Math.max(1, l.quantity),
      unitPriceMxn: l.unitPriceMxn ?? null,
    })),
  );
}
