import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import {
  generateAguinaldoDraft,
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

const postSchema = z.object({
  kind: z.enum(["semanal", "aguinaldo"]).default("semanal"),
  year: z.number().int().optional(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canRunPayroll(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = postSchema.parse(await request.json().catch(() => ({})));
  const run =
    body.kind === "aguinaldo" ?
      await generateAguinaldoDraft({
        companyId: auth.activeCompany.id,
        year: body.year,
      })
    : await generatePayrollDraft({ companyId: auth.activeCompany.id });
  return NextResponse.json({ run }, { status: 201 });
}
