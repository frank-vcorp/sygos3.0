import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collectionLogs } from "@/db/schema";

export async function addCollectionLog(params: {
  companyId: string;
  arEntryId: string;
  authorUserId: string;
  note: string;
  promiseDate?: Date;
  nextFollowUpAt?: Date;
}) {
  const db = getDb();
  const [row] = await db
    .insert(collectionLogs)
    .values({
      companyId: params.companyId,
      arEntryId: params.arEntryId,
      authorUserId: params.authorUserId,
      note: params.note.trim(),
      promiseDate: params.promiseDate ?? null,
      nextFollowUpAt: params.nextFollowUpAt ?? null,
    })
    .returning();
  return row;
}

export async function listCollectionLogs(arEntryId: string) {
  const db = getDb();
  return db
    .select()
    .from(collectionLogs)
    .where(eq(collectionLogs.arEntryId, arEntryId))
    .orderBy(desc(collectionLogs.createdAt));
}
