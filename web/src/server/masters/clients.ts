import { and, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  clientContacts,
  clients,
  users,
} from "@/db/schema";
import type { CompanySlug } from "@/lib/company";
import { resolveInitialCommercialResponsible } from "@/server/masters/responsible";
import type { UserRole } from "@/db/schema";

export async function listClients(params: {
  companyId: string;
  q?: string;
}) {
  const db = getDb();
  const conditions = [eq(clients.companyId, params.companyId)];
  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    conditions.push(
      or(ilike(clients.legalName, term), ilike(clients.taxRfc, term))!,
    );
  }
  return db
    .select({
      id: clients.id,
      legalName: clients.legalName,
      classification: clients.classification,
      requiresInvoice: clients.requiresInvoice,
      isActive: clients.isActive,
      responsibleName: users.displayName,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .innerJoin(
      users,
      eq(users.id, clients.commercialResponsibleUserId),
    )
    .where(and(...conditions))
    .orderBy(desc(clients.createdAt));
}

export async function getClientDetail(params: {
  companyId: string;
  clientId: string;
}) {
  const db = getDb();
  const [client] = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.id, params.clientId),
        eq(clients.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!client) return null;

  const contacts = await db
    .select()
    .from(clientContacts)
    .where(eq(clientContacts.clientId, client.id))
    .orderBy(desc(clientContacts.isPrimary));

  const [responsible] = await db
    .select({ displayName: users.displayName, role: users.role })
    .from(users)
    .where(eq(users.id, client.commercialResponsibleUserId))
    .limit(1);

  return { client, contacts, responsible };
}

export async function createClient(params: {
  companyId: string;
  companySlug: CompanySlug;
  actorUserId: string;
  creatorRole: UserRole;
  legalName: string;
  classification?: "NORMAL" | "PREMIUM" | null;
  requiresInvoice: boolean;
  creditDays?: number | null;
  deliveryAddress?: string | null;
  taxLegalName?: string | null;
  taxRfc?: string | null;
  taxRegime?: string | null;
  taxZip?: string | null;
  commercialResponsibleUserId?: string;
  primaryContact?: {
    name: string;
    phone?: string;
    jobTitle?: string;
    email?: string;
  };
}) {
  const db = getDb();
  const responsibleId =
    params.commercialResponsibleUserId ??
    (await resolveInitialCommercialResponsible({
      creatorRole: params.creatorRole,
      creatorUserId: params.actorUserId,
      companySlug: params.companySlug,
    }));

  const [inserted] = await db
    .insert(clients)
    .values({
      companyId: params.companyId,
      legalName: params.legalName.trim(),
      classification: params.classification ?? null,
      commercialResponsibleUserId: responsibleId,
      requiresInvoice: params.requiresInvoice,
      creditDays: params.creditDays ?? null,
      deliveryAddress: params.deliveryAddress?.trim() || null,
      taxLegalName: params.taxLegalName?.trim() || null,
      taxRfc: params.taxRfc?.trim() || null,
      taxRegime: params.taxRegime?.trim() || null,
      taxZip: params.taxZip?.trim() || null,
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  if (params.primaryContact?.name.trim()) {
    await db.insert(clientContacts).values({
      clientId: inserted.id,
      name: params.primaryContact.name.trim(),
      phone: params.primaryContact.phone?.trim() || null,
      jobTitle: params.primaryContact.jobTitle?.trim() || null,
      email: params.primaryContact.email?.trim() || null,
      isPrimary: true,
    });
  }

  return inserted;
}

export async function updateClient(params: {
  companyId: string;
  clientId: string;
  patch: Partial<{
    legalName: string;
    classification: "NORMAL" | "PREMIUM" | null;
    requiresInvoice: boolean;
    creditDays: number | null;
    deliveryAddress: string | null;
    taxLegalName: string | null;
    taxRfc: string | null;
    taxRegime: string | null;
    taxZip: string | null;
    isActive: boolean;
    commercialResponsibleUserId: string;
  }>;
}) {
  const db = getDb();
  const [updated] = await db
    .update(clients)
    .set({ ...params.patch, updatedAt: new Date() })
    .where(
      and(
        eq(clients.id, params.clientId),
        eq(clients.companyId, params.companyId),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function addClientContact(params: {
  clientId: string;
  companyId: string;
  name: string;
  phone?: string;
  jobTitle?: string;
  email?: string;
  isPrimary?: boolean;
}) {
  const db = getDb();
  const detail = await getClientDetail({
    companyId: params.companyId,
    clientId: params.clientId,
  });
  if (!detail) return null;

  if (params.isPrimary) {
    await db
      .update(clientContacts)
      .set({ isPrimary: false })
      .where(eq(clientContacts.clientId, params.clientId));
  }

  const [contact] = await db
    .insert(clientContacts)
    .values({
      clientId: params.clientId,
      name: params.name.trim(),
      phone: params.phone?.trim() || null,
      jobTitle: params.jobTitle?.trim() || null,
      email: params.email?.trim() || null,
      isPrimary: params.isPrimary ?? false,
    })
    .returning();
  return contact;
}
