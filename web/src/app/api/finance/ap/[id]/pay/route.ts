import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { payAccountsPayable } from "@/server/finance/payables";
import { ensureDefaultFinancialAccounts } from "@/server/finance/accounts";
import { canSeeFinanceModule } from "@/server/rbac/finance";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  amountMxn: z.number().int().min(1),
  accountId: z.string().uuid(),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canSeeFinanceModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = bodySchema.parse(await request.json());
    await ensureDefaultFinancialAccounts(auth.activeCompany.id);
    const ap = await payAccountsPayable({
      companyId: auth.activeCompany.id,
      apEntryId: id,
      amountMxn: body.amountMxn,
      accountId: body.accountId,
      actorUserId: auth.actor.id,
      description: `Pago CxP`,
    });
    return NextResponse.json({ ap });
  } catch {
    return NextResponse.json({ error: "No se pudo pagar." }, { status: 400 });
  }
}
