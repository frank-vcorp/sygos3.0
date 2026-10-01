import { and, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { suppliers } from "@/db/schema";

export async function listSuppliers(params: {
  companyId: string;
  q?: string;
}) {
  const db = getDb();
  const conditions = [eq(suppliers.companyId, params.companyId)];
  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    conditions.push(
      or(
        ilike(suppliers.legalName, term),
        ilike(suppliers.taxRfc, term),
      )!,
    );
  }
  return db
    .select()
    .from(suppliers)
    .where(and(...conditions))
    .orderBy(desc(suppliers.isSystemFixed), suppliers.legalName);
}

export async function getSupplier(params: {
  companyId: string;
  supplierId: string;
}) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(suppliers)
    .where(
      and(
        eq(suppliers.id, params.supplierId),
        eq(suppliers.companyId, params.companyId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createSupplier(params: {
  companyId: string;
  actorUserId: string;
  legalName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  creditDays?: number | null;
  emitsFiscalInvoice: boolean;
  category?: string;
  taxRfc?: string;
}) {
  const db = getDb();
  const [inserted] = await db
    .insert(suppliers)
    .values({
      companyId: params.companyId,
      legalName: params.legalName.trim(),
      contactName: params.contactName?.trim() || null,
      phone: params.phone?.trim() || null,
      email: params.email?.trim() || null,
      creditDays: params.creditDays ?? null,
      emitsFiscalInvoice: params.emitsFiscalInvoice,
      category: params.category?.trim() || null,
      taxRfc: params.taxRfc?.trim() || null,
      createdByActorUserId: params.actorUserId,
    })
    .returning();
  return inserted;
}

export async function updateSupplier(params: {
  companyId: string;
  supplierId: string;
  patch: Partial<{
    legalName: string;
    contactName: string | null;
    phone: string | null;
    email: string | null;
    creditDays: number | null;
    emitsFiscalInvoice: boolean;
    category: string | null;
    taxRfc: string | null;
    isActive: boolean;
  }>;
}) {
  const db = getDb();
  const existing = await getSupplier(params);
  if (!existing) return null;
  const patch = { ...params.patch };
  if (existing.isSystemFixed) {
    delete patch.legalName;
    if (patch.isActive === false) return null;
  }

  const [updated] = await db
    .update(suppliers)
    .set({ ...patch, updatedAt: new Date() })
    .where(
      and(
        eq(suppliers.id, params.supplierId),
        eq(suppliers.companyId, params.companyId),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function ensureSystronServomotoresSupplier(params: {
  systronCompanyId: string;
  actorUserId: string;
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(suppliers)
    .where(
      and(
        eq(suppliers.companyId, params.systronCompanyId),
        eq(suppliers.legalName, "Servomotores"),
      ),
    )
    .limit(1);
  if (existing) return existing;

  const [inserted] = await db
    .insert(suppliers)
    .values({
      companyId: params.systronCompanyId,
      legalName: "Servomotores",
      emitsFiscalInvoice: true,
      isSystemFixed: true,
      category: "Intercompañía",
      createdByActorUserId: params.actorUserId,
    })
    .returning();
  return inserted;
}
