import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { ensureDefaultFinancialAccounts } from "@/server/finance/accounts";
import {
  listFinancialMovements,
  recordExpense,
  recordIncome,
  recordTransfer,
} from "@/server/finance/movements";
import { canRecordManualMovements, canSeeFinanceModule } from "@/server/rbac/finance";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !canSeeFinanceModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const movements = await listFinancialMovements(auth.activeCompany.id);
  return NextResponse.json({ movements });
}

const postSchema = z.object({
  kind: z.enum(["INGRESO", "EGRESO", "TRANSFERENCIA"]),
  accountId: z.string().uuid(),
  counterAccountId: z.string().uuid().optional(),
  amountMxn: z.number().int().min(1),
  description: z.string().min(3),
  category: z.string().optional(),
  pendingVerification: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canRecordManualMovements(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    await ensureDefaultFinancialAccounts(auth.activeCompany.id);
    if (body.kind === "INGRESO") {
      const movement = await recordIncome({
        companyId: auth.activeCompany.id,
        accountId: body.accountId,
        amountMxn: body.amountMxn,
        description: body.description,
        category: body.category,
        createdByUserId: auth.actor.id,
      });
      return NextResponse.json({ movement }, { status: 201 });
    }
    if (body.kind === "EGRESO") {
      const movement = await recordExpense({
        companyId: auth.activeCompany.id,
        accountId: body.accountId,
        amountMxn: body.amountMxn,
        description: body.description,
        category: body.category,
        createdByUserId: auth.actor.id,
        pendingVerification: body.pendingVerification,
      });
      return NextResponse.json({ movement }, { status: 201 });
    }
    if (!body.counterAccountId) {
      return NextResponse.json({ error: "Falta cuenta destino." }, { status: 400 });
    }
    const movement = await recordTransfer({
      companyId: auth.activeCompany.id,
      fromAccountId: body.accountId,
      toAccountId: body.counterAccountId,
      amountMxn: body.amountMxn,
      description: body.description,
      createdByUserId: auth.actor.id,
    });
    return NextResponse.json({ movement }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
