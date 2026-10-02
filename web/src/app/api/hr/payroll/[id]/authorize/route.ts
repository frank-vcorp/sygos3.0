import { NextResponse } from "next/server";
import { getAuthContext } from "@/server/auth/session";
import { authorizePayroll } from "@/server/hr/payroll";
import { canRunPayroll } from "@/server/rbac/hr";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canRunPayroll(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const run = await authorizePayroll({
      companyId: auth.activeCompany.id,
      payrollRunId: id,
      authorizerUserId: auth.actor.id,
    });
    return NextResponse.json({ run });
  } catch {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }
}
