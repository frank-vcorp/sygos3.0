import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { createOvertimeRequest, listOvertimeForCompany } from "@/server/hr/overtime";
import { canSeeHrModule, canSeeOwnOvertime } from "@/server/rbac/hr";
import { getEmployee } from "@/server/hr/employees";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !canSeeHrModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const rows = await listOvertimeForCompany(auth.activeCompany.id);
  return NextResponse.json({ requests: rows });
}

const postSchema = z.object({
  employeeId: z.string().uuid(),
  workDate: z.string(),
  hours: z.number().int().min(1).max(24),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canSeeOwnOvertime(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    const emp = await getEmployee(auth.activeCompany.id, body.employeeId);
    if (!emp) {
      return NextResponse.json({ error: "Colaborador no encontrado." }, { status: 404 });
    }
    const row = await createOvertimeRequest({
      companyId: auth.activeCompany.id,
      employeeId: body.employeeId,
      workDate: new Date(body.workDate),
      hours: body.hours,
      requestedByUserId: auth.effective.id,
    });
    return NextResponse.json({ request: row }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
