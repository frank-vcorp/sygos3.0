import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { clients } from "@/db/schema";
import { resolveCompanyIds } from "@/server/assets/context";

export async function ensureServomotoresSystronClient(actorUserId: string) {
  const ids = await resolveCompanyIds();
  const db = getDb();
  const [existing] = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.companyId, ids.servomotoresId),
        eq(clients.legalName, "SYSTRON"),
      ),
    )
    .limit(1);
  if (existing) return existing;

  const [inserted] = await db
    .insert(clients)
    .values({
      companyId: ids.servomotoresId,
      legalName: "SYSTRON",
      commercialResponsibleUserId: actorUserId,
      createdByActorUserId: actorUserId,
      requiresInvoice: true,
    })
    .returning();
  return inserted;
}
