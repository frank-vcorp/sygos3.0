import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { clients, motors, quotes } from "@/db/schema";
import { resolveCompanyIds } from "@/server/assets/context";
import { formatQuoteFolio, nextFolioValue } from "@/server/masters/folios";
import { insertQuoteLinesHelper } from "@/server/commercial/quote-helpers";

/** Cotización base Servomotores → SYSTRON (cliente fijo SYSTRON en SM). */
export async function ensureSystronMirrorFromServomotoresQuote(params: {
  servomotoresQuoteId: string;
  actorUserId: string;
}) {
  const db = getDb();
  const [smQuote] = await db
    .select()
    .from(quotes)
    .where(eq(quotes.id, params.servomotoresQuoteId))
    .limit(1);
  if (!smQuote || smQuote.quoteOrigin !== "MOT_BASE_SERVOMOTORES") return null;

  if (smQuote.linkedQuoteId) {
    return smQuote.linkedQuoteId;
  }

  const ids = await resolveCompanyIds();
  if (smQuote.companyId !== ids.servomotoresId) return null;

  const [systronClientOnSm] = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.companyId, ids.servomotoresId),
        eq(clients.legalName, "SYSTRON"),
      ),
    )
    .limit(1);

  if (!smQuote.motorId || !systronClientOnSm) return null;

  const [motor] = await db
    .select()
    .from(motors)
    .where(eq(motors.id, smQuote.motorId))
    .limit(1);
  if (!motor || motor.origin !== "SYSTRON") return null;

  const [systronEndClient] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, motor.clientId))
    .limit(1);
  if (!systronEndClient || systronEndClient.companyId !== ids.systronId) {
    return null;
  }

  const folioNumber = await nextFolioValue(ids.systronId, "COT");
  const [systronQuote] = await db
    .insert(quotes)
    .values({
      companyId: ids.systronId,
      folioNumber,
      clientId: systronEndClient.id,
      vendorUserId: systronEndClient.commercialResponsibleUserId,
      quoteType: "REPARACION_SERVICIO",
      quoteOrigin: "MOT_BASE_SERVOMOTORES",
      status: "PENDIENTE_COTIZAR",
      motorId: smQuote.motorId,
      linkedQuoteId: smQuote.id,
      intercompanyBaseTotalMxn: smQuote.totalMxn,
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  await db
    .update(quotes)
    .set({ linkedQuoteId: systronQuote.id, updatedAt: new Date() })
    .where(eq(quotes.id, smQuote.id));

  await insertQuoteLinesHelper(systronQuote.id, [
    {
      concept: `Servicio MOT ${motor.identification} (intercompañía)`,
      quantity: 1,
    },
  ]);

  return systronQuote.id;
}

export async function syncIntercompanyDecision(params: {
  quoteId: string;
  authorized: boolean;
  actorUserId: string;
}) {
  const db = getDb();
  const [q] = await db.select().from(quotes).where(eq(quotes.id, params.quoteId)).limit(1);
  if (!q?.linkedQuoteId) return;

  const peerId = q.linkedQuoteId;
  const [peer] = await db.select().from(quotes).where(eq(quotes.id, peerId)).limit(1);
  if (!peer) return;

  const status = params.authorized ? "AUTORIZADA" : "NO_AUTORIZADA";
  await db
    .update(quotes)
    .set({
      status,
      decisionByUserId: params.actorUserId,
      decisionAt: new Date(),
      authorizedAt: params.authorized ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, peerId));
}

export async function createServomotoresBaseQuoteForMotor(params: {
  motorId: string;
  actorUserId: string;
  vendorUserId: string;
  lines: { concept: string; quantity: number }[];
}) {
  const db = getDb();
  const ids = await resolveCompanyIds();
  const [motor] = await db
    .select()
    .from(motors)
    .where(eq(motors.id, params.motorId))
    .limit(1);
  if (!motor || motor.origin !== "SYSTRON") return null;

  const [systronClientOnSm] = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.companyId, ids.servomotoresId),
        eq(clients.legalName, "SYSTRON"),
      ),
    )
    .limit(1);
  if (!systronClientOnSm) return null;

  const folioNumber = await nextFolioValue(ids.servomotoresId, "COT");
  const [inserted] = await db
    .insert(quotes)
    .values({
      companyId: ids.servomotoresId,
      folioNumber,
      clientId: systronClientOnSm.id,
      vendorUserId: params.vendorUserId,
      quoteType: "REPARACION_SERVICIO",
      quoteOrigin: "MOT_BASE_SERVOMOTORES",
      status: "PENDIENTE_COTIZAR",
      motorId: params.motorId,
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  await insertQuoteLinesHelper(inserted.id, params.lines);

  await ensureSystronMirrorFromServomotoresQuote({
    servomotoresQuoteId: inserted.id,
    actorUserId: params.actorUserId,
  });

  return { ...inserted, folio: formatQuoteFolio(folioNumber) };
}
