import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { technicalLogEntries, users } from "@/db/schema";

export async function appendBitacora(params: {
  companyId: string;
  authorUserId: string;
  body: string;
  diagnosticId?: string;
  workOrderId?: string;
}) {
  if (!params.diagnosticId && !params.workOrderId) {
    throw new Error("SUBJECT_REQUIRED");
  }
  const db = getDb();
  const [inserted] = await db
    .insert(technicalLogEntries)
    .values({
      companyId: params.companyId,
      diagnosticId: params.diagnosticId ?? null,
      workOrderId: params.workOrderId ?? null,
      body: params.body.trim(),
      authorUserId: params.authorUserId,
    })
    .returning();
  return inserted;
}

export async function listBitacora(params: {
  diagnosticId?: string;
  workOrderId?: string;
}) {
  const db = getDb();
  const condition = params.diagnosticId
    ? eq(technicalLogEntries.diagnosticId, params.diagnosticId)
    : eq(technicalLogEntries.workOrderId, params.workOrderId!);

  return db
    .select({
      id: technicalLogEntries.id,
      body: technicalLogEntries.body,
      createdAt: technicalLogEntries.createdAt,
      authorName: users.displayName,
    })
    .from(technicalLogEntries)
    .innerJoin(users, eq(users.id, technicalLogEntries.authorUserId))
    .where(condition)
    .orderBy(desc(technicalLogEntries.createdAt));
}
