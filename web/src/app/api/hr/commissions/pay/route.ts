import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { markCommissionsPaid } from "@/server/hr/commissions";
import { canPayCommissions, canSeeHrModule } from "@/server/rbac/hr";

const bodySchema = z.object({
  periodKey: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canSeeHrModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  if (!canPayCommissions(auth.effective.role)) {
    return NextResponse.json({ error: "Solo CEO/Administrador." }, { status: 403 });
  }
  const body = bodySchema.parse(await request.json());
  await markCommissionsPaid(auth.activeCompany.id, body.periodKey);
  return NextResponse.json({ ok: true });
}
