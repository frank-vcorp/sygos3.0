import { and, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  accountsPayable,
  accountsReceivable,
  financialAccounts,
  financialMovements,
  fiscalDocuments,
  payments,
} from "@/db/schema";

function monthRange(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return { start, end };
}

export function currentMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function getFinanceDashboard(companyId: string, monthKey?: string) {
  const key = monthKey ?? currentMonthKey();
  const { start, end } = monthRange(key);
  const db = getDb();

  const [invoiced] = await db
    .select({
      total: sql<number>`coalesce(sum(${fiscalDocuments.totalMxn}), 0)`,
    })
    .from(fiscalDocuments)
    .where(
      and(
        eq(fiscalDocuments.companyId, companyId),
        eq(fiscalDocuments.status, "EMITIDA"),
        inArray(fiscalDocuments.docKind, ["FACTURA"]),
        gte(fiscalDocuments.issuedAt, start),
        lte(fiscalDocuments.issuedAt, end),
        isNull(fiscalDocuments.testSessionId),
      ),
    );

  const [collected] = await db
    .select({
      total: sql<number>`coalesce(sum(${payments.amountMxn}), 0)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.companyId, companyId),
        eq(payments.status, "VALIDADO"),
        gte(payments.validatedAt, start),
        lte(payments.validatedAt, end),
        isNull(payments.testSessionId),
      ),
    );

  const [expenses] = await db
    .select({
      total: sql<number>`coalesce(sum(${financialMovements.amountMxn}), 0)`,
    })
    .from(financialMovements)
    .where(
      and(
        eq(financialMovements.companyId, companyId),
        eq(financialMovements.kind, "EGRESO"),
        gte(financialMovements.occurredAt, start),
        lte(financialMovements.occurredAt, end),
        isNull(financialMovements.testSessionId),
      ),
    );

  const accounts = await db
    .select()
    .from(financialAccounts)
    .where(eq(financialAccounts.companyId, companyId));

  const [arOpen] = await db
    .select({
      total: sql<number>`coalesce(sum(${accountsReceivable.balanceMxn}), 0)`,
    })
    .from(accountsReceivable)
    .where(eq(accountsReceivable.companyId, companyId));

  const [apOpen] = await db
    .select({
      total: sql<number>`coalesce(sum(${accountsPayable.balanceMxn}), 0)`,
    })
    .from(accountsPayable)
    .where(eq(accountsPayable.companyId, companyId));

  const cardDebt = accounts
    .filter((a) => a.kind === "TARJETA")
    .reduce((s, a) => s + Math.max(0, -a.balanceMxn), 0);

  const facturado = Number(invoiced?.total ?? 0);
  const cobrado = Number(collected?.total ?? 0);
  const egresos = Number(expenses?.total ?? 0);

  return {
    monthKey: key,
    facturadoMxn: facturado,
    cobradoMxn: cobrado,
    egresosMxn: egresos,
    utilidadGerencialMxn: facturado - egresos,
    flujoNetoMxn: cobrado - egresos,
    accountBalances: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      kind: a.kind,
      balanceMxn: a.balanceMxn,
    })),
    cxcMxn: Number(arOpen?.total ?? 0),
    cxpMxn: Number(apOpen?.total ?? 0),
    tarjetaDeudaMxn: cardDebt,
  };
}
