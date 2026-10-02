import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  accountsPayable,
  accountsReceivable,
  clients,
  fiscalDocuments,
  suppliers,
} from "@/db/schema";

export async function createReceivableFromFiscalDocument(fiscalDocumentId: string) {
  const db = getDb();
  const [doc] = await db
    .select()
    .from(fiscalDocuments)
    .where(eq(fiscalDocuments.id, fiscalDocumentId))
    .limit(1);
  if (!doc || doc.docKind === "REMISION" || doc.docKind === "NOTA_CREDITO") {
    return null;
  }

  const [existing] = await db
    .select({ id: accountsReceivable.id })
    .from(accountsReceivable)
    .where(eq(accountsReceivable.fiscalDocumentId, fiscalDocumentId))
    .limit(1);
  if (existing) return existing;

  let dueDate: Date | null = null;
  if (doc.creditDays != null && doc.issuedAt) {
    dueDate = new Date(doc.issuedAt);
    dueDate.setDate(dueDate.getDate() + doc.creditDays);
  }

  const [row] = await db
    .insert(accountsReceivable)
    .values({
      companyId: doc.companyId,
      clientId: doc.clientId,
      fiscalDocumentId: doc.id,
      originalMxn: doc.totalMxn,
      balanceMxn: doc.totalMxn,
      dueDate,
      status: "ABIERTA",
    })
    .returning();
  return row;
}

export async function createPayableMirror(params: {
  systronCompanyId: string;
  supplierId: string;
  fiscalDocumentId: string;
  motorId?: string | null;
  totalMxn: number;
  creditDays?: number | null;
  linkedArEntryId: string;
}) {
  const db = getDb();
  let dueDate: Date | null = null;
  if (params.creditDays != null) {
    dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + params.creditDays);
  }
  const [ap] = await db
    .insert(accountsPayable)
    .values({
      companyId: params.systronCompanyId,
      supplierId: params.supplierId,
      fiscalDocumentId: params.fiscalDocumentId,
      motorId: params.motorId ?? null,
      originalMxn: params.totalMxn,
      balanceMxn: params.totalMxn,
      dueDate,
      status: "ABIERTA",
      linkedArEntryId: params.linkedArEntryId,
    })
    .returning();

  await db
    .update(accountsReceivable)
    .set({ linkedApEntryId: ap.id, updatedAt: new Date() })
    .where(eq(accountsReceivable.id, params.linkedArEntryId));

  return ap;
}

export function computeArDisplayStatus(
  row: typeof accountsReceivable.$inferSelect,
) {
  const overdue =
    row.balanceMxn > 0 &&
    row.dueDate &&
    row.dueDate.getTime() < Date.now();
  return { ...row, isOverdue: Boolean(overdue) };
}

export async function listReceivables(
  companyId: string,
  opts?: { clientIds?: string[]; vendorUserId?: string },
) {
  const db = getDb();
  const rows = await db
    .select({
      ar: accountsReceivable,
      clientName: clients.legalName,
      folioNumber: fiscalDocuments.folioNumber,
      docKind: fiscalDocuments.docKind,
    })
    .from(accountsReceivable)
    .innerJoin(clients, eq(clients.id, accountsReceivable.clientId))
    .innerJoin(
      fiscalDocuments,
      eq(fiscalDocuments.id, accountsReceivable.fiscalDocumentId),
    )
    .where(eq(accountsReceivable.companyId, companyId));

  let filtered = rows;
  if (opts?.clientIds?.length) {
    filtered = filtered.filter((r) => opts.clientIds!.includes(r.ar.clientId));
  }
  if (opts?.vendorUserId) {
    const db2 = getDb();
    const clientRows = await db2
      .select({ id: clients.id })
      .from(clients)
      .where(
        and(
          eq(clients.companyId, companyId),
          eq(clients.commercialResponsibleUserId, opts.vendorUserId),
        ),
      );
    const ids = new Set(clientRows.map((c) => c.id));
    filtered = filtered.filter((r) => ids.has(r.ar.clientId));
  }

  return filtered.map((r) => ({
    ...computeArDisplayStatus(r.ar),
    clientName: r.clientName,
    fiscalFolio: r.folioNumber,
    docKind: r.docKind,
    arId: r.ar.id,
  }));
}

export async function listPayables(companyId: string) {
  const db = getDb();
  const rows = await db
    .select({
      ap: accountsPayable,
      supplierName: suppliers.legalName,
    })
    .from(accountsPayable)
    .innerJoin(suppliers, eq(suppliers.id, accountsPayable.supplierId))
    .where(eq(accountsPayable.companyId, companyId));
  return rows.map((r) => ({
    ...r.ap,
    supplierName: r.supplierName,
  }));
}

export async function applyPaymentToReceivable(params: {
  arEntryId: string;
  amountMxn: number;
}) {
  const db = getDb();
  const [ar] = await db
    .select()
    .from(accountsReceivable)
    .where(eq(accountsReceivable.id, params.arEntryId))
    .limit(1);
  if (!ar) return null;

  const newBalance = Math.max(0, ar.balanceMxn - params.amountMxn);
  const status =
    newBalance === 0 ? "SALDADA"
    : newBalance < ar.originalMxn ? "PARCIAL"
    : "ABIERTA";

  const [updated] = await db
    .update(accountsReceivable)
    .set({ balanceMxn: newBalance, status, updatedAt: new Date() })
    .where(eq(accountsReceivable.id, params.arEntryId))
    .returning();
  return updated;
}

export async function applyPaymentToPayable(params: {
  apEntryId: string;
  amountMxn: number;
}) {
  const db = getDb();
  const [ap] = await db
    .select()
    .from(accountsPayable)
    .where(eq(accountsPayable.id, params.apEntryId))
    .limit(1);
  if (!ap) return null;

  const newBalance = Math.max(0, ap.balanceMxn - params.amountMxn);
  const status =
    newBalance === 0 ? "SALDADA"
    : newBalance < ap.originalMxn ? "PARCIAL"
    : "ABIERTA";

  const [updated] = await db
    .update(accountsPayable)
    .set({ balanceMxn: newBalance, status, updatedAt: new Date() })
    .where(eq(accountsPayable.id, params.apEntryId))
    .returning();
  return updated;
}
