import { NextResponse } from "next/server";
import { getAuthContext } from "@/server/auth/session";
import { stampPayrollRun } from "@/server/hr/payroll-fiscal";
import { getPayrollDetail } from "@/server/hr/payroll";
import { canAuthorizePayroll } from "@/server/rbac/hr";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canAuthorizePayroll(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const detail = await getPayrollDetail(auth.activeCompany.id, id);
  if (!detail || detail.run.status !== "BORRADOR") {
    return NextResponse.json({ error: "Solo borrador." }, { status: 400 });
  }
  try {
    const result = await stampPayrollRun({
      companyId: auth.activeCompany.id,
      payrollRunId: id,
      actorUserId: auth.actor.id,
      actorRole: auth.effective.role,
    });
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reintento falló." },
      { status: 502 },
    );
  }
}
