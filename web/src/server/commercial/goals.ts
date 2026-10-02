import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  clientFirstOperations,
  commercialActivities,
  commercialActivityCategories,
  commercialGoalTargets,
  commercialGoalTypes,
  quotes,
} from "@/db/schema";

export async function recordClientFirstOperationIfNeeded(params: {
  companyId: string;
  clientId: string;
  attributedUserId: string;
  quoteId: string;
}) {
  const db = getDb();
  const [existing] = await db
    .select({ id: clientFirstOperations.id })
    .from(clientFirstOperations)
    .where(
      and(
        eq(clientFirstOperations.companyId, params.companyId),
        eq(clientFirstOperations.clientId, params.clientId),
      ),
    )
    .limit(1);
  if (existing) return;

  await db.insert(clientFirstOperations).values({
    companyId: params.companyId,
    clientId: params.clientId,
    attributedUserId: params.attributedUserId,
    quoteId: params.quoteId,
  });
}

export async function listGoalTypes(companyId: string) {
  const db = getDb();
  return db
    .select()
    .from(commercialGoalTypes)
    .where(
      and(
        eq(commercialGoalTypes.companyId, companyId),
        eq(commercialGoalTypes.isActive, true),
      ),
    );
}

export async function upsertGoalTarget(params: {
  companyId: string;
  userId: string;
  goalTypeId: string;
  year: number;
  month: number;
  targetValue: number;
}) {
  const db = getDb();
  await db
    .insert(commercialGoalTargets)
    .values({
      companyId: params.companyId,
      userId: params.userId,
      goalTypeId: params.goalTypeId,
      year: params.year,
      month: params.month,
      targetValue: params.targetValue,
    })
    .onConflictDoUpdate({
      target: [
        commercialGoalTargets.companyId,
        commercialGoalTargets.userId,
        commercialGoalTargets.goalTypeId,
        commercialGoalTargets.year,
        commercialGoalTargets.month,
      ],
      set: { targetValue: params.targetValue },
    });
}

export async function getVendorPerformance(params: {
  companyId: string;
  userId: string;
  year: number;
  month: number;
}) {
  const db = getDb();
  const start = new Date(Date.UTC(params.year, params.month - 1, 1));
  const end = new Date(Date.UTC(params.year, params.month, 1));

  const firstOps = await db
    .select({ id: clientFirstOperations.id })
    .from(clientFirstOperations)
    .where(
      and(
        eq(clientFirstOperations.companyId, params.companyId),
        eq(clientFirstOperations.attributedUserId, params.userId),
        gte(clientFirstOperations.occurredAt, start),
        lt(clientFirstOperations.occurredAt, end),
      ),
    );

  const authorizedQuotes = await db
    .select({ total: quotes.totalMxn })
    .from(quotes)
    .where(
      and(
        eq(quotes.companyId, params.companyId),
        eq(quotes.vendorUserId, params.userId),
        inArray(quotes.status, ["AUTORIZADA", "AUTORIZADA_PENDIENTE_INGRESO"]),
        gte(quotes.authorizedAt, start),
        lt(quotes.authorizedAt, end),
      ),
    );

  const activitiesWithEvidence = await db
    .select({ id: commercialActivities.id, evidenceUrl: commercialActivities.evidenceUrl })
    .from(commercialActivities)
    .leftJoin(
      commercialActivityCategories,
      eq(commercialActivityCategories.id, commercialActivities.categoryId),
    )
    .where(
      and(
        eq(commercialActivities.companyId, params.companyId),
        eq(commercialActivities.ownerUserId, params.userId),
        gte(commercialActivities.occurredAt, start),
        lt(commercialActivities.occurredAt, end),
      ),
    );

  const targets = await db
    .select({
      target: commercialGoalTargets,
      type: commercialGoalTypes,
    })
    .from(commercialGoalTargets)
    .innerJoin(
      commercialGoalTypes,
      eq(commercialGoalTypes.id, commercialGoalTargets.goalTypeId),
    )
    .where(
      and(
        eq(commercialGoalTargets.companyId, params.companyId),
        eq(commercialGoalTargets.userId, params.userId),
        eq(commercialGoalTargets.year, params.year),
        eq(commercialGoalTargets.month, params.month),
      ),
    );

  const pipelineTotal = authorizedQuotes.reduce(
    (acc, q) => acc + (q.total ?? 0),
    0,
  );

  return {
    newClientsCount: firstOps.length,
    authorizedQuotesCount: authorizedQuotes.length,
    authorizedQuotesTotalMxn: pipelineTotal,
    activitiesWithEvidenceCount: activitiesWithEvidence.filter((a) =>
      Boolean(a.evidenceUrl?.trim()),
    ).length,
    targets,
  };
}
