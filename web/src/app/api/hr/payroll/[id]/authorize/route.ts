import { NextResponse } from "next/server";
import { getAuthContext } from "@/server/auth/session";
import { authorizePayroll } from "@/server/hr/payroll";
import { canAuthorizePayroll } from "@/server/rbac/hr";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canAuthorizePayroll(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const run = await authorizePayroll({
      companyId: auth.activeCompany.id,
      payrollRunId: id,
      authorizerUserId: auth.actor.id,
      authorizerRole: auth.effective.role,
    });
    return NextResponse.json({ run });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "PAYROLL_FISCAL_DATA_MISSING") {
      const issues = (e as Error & { issues?: unknown }).issues;
      return NextResponse.json(
        { error: "Faltan datos fiscales de colaboradores.", issues },
        { status: 422 },
      );
    }
    if (msg === "PAYROLL_STAMP_FAILED" || msg.includes("Facturapi")) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Timbrado falló." },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }
}
