import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { financialAccounts } from "@/db/schema";

export async function listFinancialAccounts(companyId: string) {
  const db = getDb();
  return db
    .select()
    .from(financialAccounts)
    .where(
      and(
        eq(financialAccounts.companyId, companyId),
        eq(financialAccounts.isActive, true),
      ),
    );
}

export async function ensureDefaultFinancialAccounts(companyId: string) {
  const db = getDb();
  const existing = await listFinancialAccounts(companyId);
  if (existing.length) return existing;
  const defaults: { kind: "BANCO" | "EFECTIVO" | "TARJETA"; name: string }[] = [
    { kind: "BANCO", name: "Banco principal" },
    { kind: "EFECTIVO", name: "Caja" },
    { kind: "TARJETA", name: "Tarjeta corporativa" },
  ];
  await db.insert(financialAccounts).values(
    defaults.map((d) => ({
      companyId,
      kind: d.kind,
      name: d.name,
      balanceMxn: 0,
    })),
  );
  return listFinancialAccounts(companyId);
}

export async function adjustAccountBalance(params: {
  accountId: string;
  companyId: string;
  deltaMxn: number;
}) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(financialAccounts)
    .where(
      and(
        eq(financialAccounts.id, params.accountId),
        eq(financialAccounts.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!row) throw new Error("ACCOUNT_NOT_FOUND");
  const [updated] = await db
    .update(financialAccounts)
    .set({
      balanceMxn: row.balanceMxn + params.deltaMxn,
      updatedAt: new Date(),
    })
    .where(eq(financialAccounts.id, params.accountId))
    .returning();
  return updated;
}

export async function createFinancialAccount(params: {
  companyId: string;
  kind: (typeof financialAccounts.$inferSelect)["kind"];
  name: string;
}) {
  const db = getDb();
  const [row] = await db
    .insert(financialAccounts)
    .values({
      companyId: params.companyId,
      kind: params.kind,
      name: params.name.trim(),
    })
    .returning();
  return row;
}
