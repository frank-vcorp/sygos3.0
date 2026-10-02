import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { functionalHistoryEntries } from "@/db/schema";

export async function logFunctionalHistory(params: {
  companyId: string;
  entityType: string;
  entityId: string;
  action: string;
  detail?: string;
  actorUserId: string;
}) {
  const db = getDb();
  await db.insert(functionalHistoryEntries).values({
    companyId: params.companyId,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    detail: params.detail ?? null,
    actorUserId: params.actorUserId,
  });
}

export async function listFunctionalHistory(params: {
  entityType: string;
  entityId: string;
  limit?: number;
}) {
  const db = getDb();
  return db
    .select()
    .from(functionalHistoryEntries)
    .where(
      and(
        eq(functionalHistoryEntries.entityType, params.entityType),
        eq(functionalHistoryEntries.entityId, params.entityId),
      ),
    )
    .orderBy(desc(functionalHistoryEntries.createdAt))
    .limit(params.limit ?? 40);
}
