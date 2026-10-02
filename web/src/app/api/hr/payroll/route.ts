import { NextResponse } from "next/server";
import { getAuthContext } from "@/server/auth/session";
import {
  generatePayrollDraft,
  listPayrollRuns,
} from "@/server/hr/payroll";
import { canRunPayroll, canSeeHrModule } from "@/server/rbac/hr";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !canSeeHrModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const runs = await listPayrollRuns(auth.activeCompany.id);
  return NextResponse.json({ runs });
}

export async function POST() {
  const auth = await getAuthContext();
  if (!auth || !canRunPayroll(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const run = await generatePayrollDraft({ companyId: auth.activeCompany.id });
  return NextResponse.json({ run }, { status: 201 });
}
