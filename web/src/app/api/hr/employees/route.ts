import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { createEmployee, listEmployees } from "@/server/hr/employees";
import { canManageEmployees, canSeeHrModule } from "@/server/rbac/hr";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !canSeeHrModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const rows = await listEmployees(auth.activeCompany.id);
  return NextResponse.json({ employees: rows });
}

const postSchema = z.object({
  legalName: z.string().min(2),
  hireType: z.enum(["NUEVO", "MIGRADO"]),
  hireDate: z.string(),
  userId: z.string().uuid().optional(),
  managerEmployeeId: z.string().uuid().optional(),
  dailySalaryStampedMxn: z.number().int().min(0),
  dailySalaryCashMxn: z.number().int().min(0),
  vacationBalanceDays: z.number().int().min(0).optional(),
  taxRfc: z.string().optional(),
  taxCurp: z.string().optional(),
  taxZip: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canManageEmployees(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    const employee = await createEmployee({
      companyId: auth.activeCompany.id,
      legalName: body.legalName,
      hireType: body.hireType,
      hireDate: new Date(body.hireDate),
      userId: body.userId,
      managerEmployeeId: body.managerEmployeeId,
      dailySalaryStampedMxn: body.dailySalaryStampedMxn,
      dailySalaryCashMxn: body.dailySalaryCashMxn,
      vacationBalanceDays: body.vacationBalanceDays,
      taxRfc: body.taxRfc,
      taxCurp: body.taxCurp,
      taxZip: body.taxZip,
    });
    return NextResponse.json({ employee }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
