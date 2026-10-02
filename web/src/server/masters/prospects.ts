import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { clients, prospects, users } from "@/db/schema";
import type { CompanySlug } from "@/lib/company";
import { createClient } from "@/server/masters/clients";
import type { UserRole } from "@/db/schema";

export async function listProspects(params: {
  companyId: string;
  q?: string;
  status?: (typeof prospects.$inferSelect)["status"];
  activePipelineOnly?: boolean;
}) {
  const db = getDb();
  const conditions = [eq(prospects.companyId, params.companyId)];
  if (params.q?.trim()) {
    conditions.push(ilike(prospects.name, `%${params.q.trim()}%`));
  }
  if (params.status) {
    conditions.push(eq(prospects.status, params.status));
  } else if (params.activePipelineOnly) {
    conditions.push(
      inArray(prospects.status, ["NUEVO", "EN_SEGUIMIENTO"]),
    );
  }
  return db
    .select({
      id: prospects.id,
      name: prospects.name,
      status: prospects.status,
      source: prospects.source,
      responsibleName: users.displayName,
      convertedClientId: prospects.convertedClientId,
      createdAt: prospects.createdAt,
    })
    .from(prospects)
    .innerJoin(users, eq(users.id, prospects.responsibleUserId))
    .where(and(...conditions))
    .orderBy(desc(prospects.createdAt));
}

export async function getProspectDetail(params: {
  companyId: string;
  prospectId: string;
}) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(prospects)
    .where(
      and(
        eq(prospects.id, params.prospectId),
        eq(prospects.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!row) return null;

  const [responsible] = await db
    .select({ displayName: users.displayName })
    .from(users)
    .where(eq(users.id, row.responsibleUserId))
    .limit(1);

  let convertedClientName: string | null = null;
  if (row.convertedClientId) {
    const [c] = await db
      .select({ legalName: clients.legalName })
      .from(clients)
      .where(eq(clients.id, row.convertedClientId))
      .limit(1);
    convertedClientName = c?.legalName ?? null;
  }

  return { prospect: row, responsible, convertedClientName };
}

export async function createProspect(params: {
  companyId: string;
  actorUserId: string;
  name: string;
  responsibleUserId: string;
  source?: string;
  notes?: string;
}) {
  const db = getDb();
  const [inserted] = await db
    .insert(prospects)
    .values({
      companyId: params.companyId,
      name: params.name.trim(),
      responsibleUserId: params.responsibleUserId,
      source: params.source?.trim() || null,
      notes: params.notes?.trim() || null,
      createdByActorUserId: params.actorUserId,
    })
    .returning();
  return inserted;
}

export async function updateProspect(params: {
  companyId: string;
  prospectId: string;
  patch: Partial<{
    name: string;
    responsibleUserId: string;
    source: string | null;
    notes: string | null;
    status: "NUEVO" | "EN_SEGUIMIENTO" | "CONVERTIDO" | "DESCARTADO";
  }>;
}) {
  const db = getDb();
  const [updated] = await db
    .update(prospects)
    .set({ ...params.patch, updatedAt: new Date() })
    .where(
      and(
        eq(prospects.id, params.prospectId),
        eq(prospects.companyId, params.companyId),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function convertProspectToClient(params: {
  companyId: string;
  companySlug: CompanySlug;
  prospectId: string;
  actorUserId: string;
  creatorRole: UserRole;
  existingClientId?: string;
  legalNameOverride?: string;
}) {
  const detail = await getProspectDetail({
    companyId: params.companyId,
    prospectId: params.prospectId,
  });
  if (!detail) return { error: "Prospecto no encontrado." as const };
  if (detail.prospect.status === "CONVERTIDO" && detail.prospect.convertedClientId) {
    return { error: "Este prospecto ya fue convertido." as const };
  }
  if (detail.prospect.status === "DESCARTADO") {
    return { error: "No se puede convertir un prospecto descartado." as const };
  }

  const db = getDb();
  let clientId = params.existingClientId;

  if (clientId) {
    const [existing] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(
        and(eq(clients.id, clientId), eq(clients.companyId, params.companyId)),
      )
      .limit(1);
    if (!existing) return { error: "Cliente seleccionado no válido." as const };
  } else {
    const created = await createClient({
      companyId: params.companyId,
      companySlug: params.companySlug,
      actorUserId: params.actorUserId,
      creatorRole: params.creatorRole,
      legalName: params.legalNameOverride?.trim() || detail.prospect.name,
      requiresInvoice: false,
      commercialResponsibleUserId: detail.prospect.responsibleUserId,
    });
    clientId = created.id;
    await db
      .update(clients)
      .set({ originProspectId: detail.prospect.id })
      .where(eq(clients.id, clientId));
  }

  await db
    .update(prospects)
    .set({
      status: "CONVERTIDO",
      convertedClientId: clientId,
      updatedAt: new Date(),
    })
    .where(eq(prospects.id, params.prospectId));

  return { clientId };
}
