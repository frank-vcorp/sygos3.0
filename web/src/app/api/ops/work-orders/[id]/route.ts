import { NextResponse } from "next/server";
import { z } from "zod";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import {
  getWorkOrder,
  updateWorkOrderRepair,
} from "@/server/assets/work-orders";
import { canExecuteDiagnostic, canSeeTechnicalOps } from "@/server/rbac/ops";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canSeeTechnicalOps(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const detail = await getWorkOrder(auth.activeCompany.id, id);
  if (!detail) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  return NextResponse.json(detail);
}

const patchSchema = z.object({
  repairStatus: z
    .enum([
      "EN_ESPERA",
      "EN_REPARACION",
      "EN_ESPERA_REFACCIONES",
      "REPARACION_TERMINADA",
      "SIN_REPARACION",
    ])
    .optional(),
  assignedUserId: z.string().uuid().optional(),
  technicalResult: z.string().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canExecuteDiagnostic(auth.effective.role, slug)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = patchSchema.parse(await request.json());
    const updated = await updateWorkOrderRepair({
      companyId: auth.activeCompany.id,
      workOrderId: id,
      patch: body,
    });
    if (!updated) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }
    if (updated.repairStatus === "REPARACION_TERMINADA") {
      const { ensureQuoteFromWorkOrder } = await import(
        "@/server/commercial/quotes"
      );
      await ensureQuoteFromWorkOrder({
        workOrderId: id,
        actorUserId: auth.actor.id,
      });
    }
    return NextResponse.json({ workOrder: updated });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
