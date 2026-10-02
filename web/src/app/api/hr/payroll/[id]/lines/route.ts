import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import {
  addPayrollAdjustment,
  removePayrollLine,
} from "@/server/hr/payroll";
import {
  canAdjustPayrollExtras,
  canAuthorizePayroll,
} from "@/server/rbac/hr";

type Params = { params: Promise<{ id: string }> };

const postSchema = z.object({
  employeeId: z.string().uuid(),
  kind: z.enum(["EXTRA_INGRESO", "EXTRA_DESCUENTO"]),
  concept: z.string().min(1),
  amountMxn: z.number().int().positive(),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canAdjustPayrollExtras(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = postSchema.parse(await request.json());
    const line = await addPayrollAdjustment({
      payrollRunId: id,
      companyId: auth.activeCompany.id,
      employeeId: body.employeeId,
      kind: body.kind,
      concept: body.concept,
      amountMxn: body.amountMxn,
      actorUserId: auth.actor.id,
    });
    return NextResponse.json({ line }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INVALID_STATUS") {
      return NextResponse.json({ error: "Nómina no editable." }, { status: 400 });
    }
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}

const deleteSchema = z.object({ lineId: z.string().uuid() });

export async function DELETE(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canAuthorizePayroll(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = deleteSchema.parse(await request.json());
  try {
    await removePayrollLine({
      lineId: body.lineId,
      companyId: auth.activeCompany.id,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "PROTECTED_LINE") {
      return NextResponse.json({ error: "Línea protegida del sistema." }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo eliminar." }, { status: 400 });
  }
}
