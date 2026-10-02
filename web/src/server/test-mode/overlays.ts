import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { testModeOverlays } from "@/db/schema";

export function entityKey(table: string, id: string) {
  return `${table}:${id}`;
}

export async function putTestOverlay(params: {
  sessionId: string;
  entityKey: string;
  payload: Record<string, unknown>;
  isDeleted?: boolean;
}) {
  const db = getDb();
  await db
    .insert(testModeOverlays)
    .values({
      sessionId: params.sessionId,
      entityKey: params.entityKey,
      payload: params.payload,
      isDeleted: params.isDeleted ?? false,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [testModeOverlays.sessionId, testModeOverlays.entityKey],
      set: {
        payload: params.payload,
        isDeleted: params.isDeleted ?? false,
        updatedAt: new Date(),
      },
    });
}

export async function getTestOverlay<T extends Record<string, unknown>>(params: {
  sessionId: string;
  entityKey: string;
}): Promise<T | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(testModeOverlays)
    .where(
      and(
        eq(testModeOverlays.sessionId, params.sessionId),
        eq(testModeOverlays.entityKey, params.entityKey),
      ),
    )
    .limit(1);
  if (!row || row.isDeleted) return null;
  return row.payload as T;
}

export async function clearTestOverlays(sessionId: string) {
  const db = getDb();
  await db
    .delete(testModeOverlays)
    .where(eq(testModeOverlays.sessionId, sessionId));
}
