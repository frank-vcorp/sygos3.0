import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import {
  approveVacationRequest,
  createVacationRequest,
  listVacationRequests,
} from "@/server/hr/vacations";
import { canApproveVacations, canSeeHrModule } from "@/server/rbac/hr";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !canSeeHrModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const rows = await listVacationRequests(auth.activeCompany.id);
  return NextResponse.json({ requests: rows });
}

const postSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    employeeId: z.string().uuid(),
    startDate: z.string(),
    endDate: z.string(),
    note: z.string().optional(),
  }),
  z.object({
    action: z.literal("approve"),
    requestId: z.string().uuid(),
  }),
]);

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    if (body.action === "create") {
      if (!canSeeHrModule(auth.effective.role)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const row = await createVacationRequest({
        companyId: auth.activeCompany.id,
        employeeId: body.employeeId,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        requestedByUserId: auth.actor.id,
        note: body.note,
      });
      return NextResponse.json({ request: row }, { status: 201 });
    }
    if (!canApproveVacations(auth.effective.role)) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }
    const row = await approveVacationRequest({
      companyId: auth.activeCompany.id,
      requestId: body.requestId,
      approverUserId: auth.actor.id,
    });
    return NextResponse.json({ request: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "Saldo insuficiente." }, { status: 400 });
    }
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
