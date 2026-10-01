import { NextResponse } from "next/server";
import { z } from "zod";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import { createWorkOrder, listWorkOrders } from "@/server/assets/work-orders";
import { canManageWorkOrders } from "@/server/rbac/assets";

export async function GET() {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canManageWorkOrders(auth.effective.role, slug)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const orders = await listWorkOrders(auth.activeCompany.id);
  return NextResponse.json({ workOrders: orders });
}

const postSchema = z.object({
  equiId: z.string().uuid().optional(),
  motorId: z.string().uuid().optional(),
  summary: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canManageWorkOrders(auth.effective.role, slug)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    const workOrder = await createWorkOrder({
      companyId: auth.activeCompany.id,
      actorUserId: auth.actor.id,
      ...body,
    });
    return NextResponse.json({ workOrder });
  } catch (err) {
    if (err instanceof Error && err.message === "ASSET_REQUIRED") {
      return NextResponse.json(
        { error: "Indica EQUI o MOT para la OS." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
