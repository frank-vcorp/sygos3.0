import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { folioSequences, testModeFolioSnapshots } from "@/db/schema";

export async function snapshotFoliosForSession(sessionId: string) {
  const db = getDb();
  const rows = await db.select().from(folioSequences);
  if (!rows.length) return;
  await db.insert(testModeFolioSnapshots).values(
    rows.map((r) => ({
      sessionId,
      companyId: r.companyId,
      folioType: r.folioType,
      lastValue: r.lastValue,
    })),
  );
}

export async function nextTestFolioValue(params: {
  sessionId: string;
  companyId: string;
  folioType: string;
}): Promise<number> {
  const db = getDb();
  const [row] = await db
    .insert(testModeFolioSnapshots)
    .values({
      sessionId: params.sessionId,
      companyId: params.companyId,
      folioType: params.folioType,
      lastValue: 1,
    })
    .onConflictDoUpdate({
      target: [
        testModeFolioSnapshots.sessionId,
        testModeFolioSnapshots.companyId,
        testModeFolioSnapshots.folioType,
      ],
      set: {
        lastValue: sql`${testModeFolioSnapshots.lastValue} + 1`,
      },
    })
    .returning({ lastValue: testModeFolioSnapshots.lastValue });

  if (row) return row.lastValue;

  const [existing] = await db
    .select({ lastValue: testModeFolioSnapshots.lastValue })
    .from(testModeFolioSnapshots)
    .where(
      and(
        eq(testModeFolioSnapshots.sessionId, params.sessionId),
        eq(testModeFolioSnapshots.companyId, params.companyId),
        eq(testModeFolioSnapshots.folioType, params.folioType),
      ),
    )
    .limit(1);
  return existing?.lastValue ?? 1;
}

export async function restoreFolioSnapshots(sessionId: string) {
  const db = getDb();
  const snaps = await db
    .select()
    .from(testModeFolioSnapshots)
    .where(eq(testModeFolioSnapshots.sessionId, sessionId));

  for (const s of snaps) {
    await db
      .update(folioSequences)
      .set({ lastValue: s.lastValue, updatedAt: new Date() })
      .where(
        and(
          eq(folioSequences.companyId, s.companyId),
          eq(folioSequences.folioType, s.folioType),
        ),
      );
  }
  await db
    .delete(testModeFolioSnapshots)
    .where(eq(testModeFolioSnapshots.sessionId, sessionId));
}
