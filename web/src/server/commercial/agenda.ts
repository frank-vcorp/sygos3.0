import { and, desc, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  clients,
  commercialActivities,
  commercialActivityCategories,
  prospects,
} from "@/db/schema";

export async function listActivities(params: {
  companyId: string;
  ownerUserId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const db = getDb();
  const conditions = [eq(commercialActivities.companyId, params.companyId)];
  if (params.ownerUserId) {
    conditions.push(eq(commercialActivities.ownerUserId, params.ownerUserId));
  }
  if (params.from) {
    conditions.push(gte(commercialActivities.occurredAt, params.from));
  }
  if (params.to) {
    conditions.push(lte(commercialActivities.occurredAt, params.to));
  }

  return db
    .select({
      activity: commercialActivities,
      clientName: clients.legalName,
      prospectName: prospects.name,
      categoryName: commercialActivityCategories.name,
    })
    .from(commercialActivities)
    .leftJoin(clients, eq(clients.id, commercialActivities.clientId))
    .leftJoin(prospects, eq(prospects.id, commercialActivities.prospectId))
    .leftJoin(
      commercialActivityCategories,
      eq(commercialActivityCategories.id, commercialActivities.categoryId),
    )
    .where(and(...conditions))
    .orderBy(desc(commercialActivities.occurredAt))
    .limit(params.limit ?? 200);
}

export async function createActivity(params: {
  companyId: string;
  ownerUserId: string;
  title: string;
  occurredAt: Date;
  categoryId?: string;
  categoryLabel?: string;
  clientId?: string;
  prospectId?: string;
  notes?: string;
  evidenceUrl?: string;
}) {
  const db = getDb();
  const [row] = await db
    .insert(commercialActivities)
    .values({
      companyId: params.companyId,
      ownerUserId: params.ownerUserId,
      title: params.title.trim(),
      occurredAt: params.occurredAt,
      categoryId: params.categoryId ?? null,
      categoryLabel: params.categoryLabel?.trim() || null,
      clientId: params.clientId ?? null,
      prospectId: params.prospectId ?? null,
      notes: params.notes?.trim() || null,
      evidenceUrl: params.evidenceUrl?.trim() || null,
    })
    .returning();
  return row;
}

export async function listUpcomingActivities(params: {
  companyId: string;
  ownerUserId: string;
  daysAhead?: number;
}) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + (params.daysAhead ?? 14));
  return listActivities({
    companyId: params.companyId,
    ownerUserId: params.ownerUserId,
    from: now,
    to: end,
    limit: 8,
  });
}
