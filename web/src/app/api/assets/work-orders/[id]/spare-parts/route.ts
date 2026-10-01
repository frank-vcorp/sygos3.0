import { NextResponse } from "next/server";
import { z } from "zod";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import { createSparePartRequest } from "@/server/assets/work-orders";
import { canManageWorkOrders } from "@/server/rbac/assets";

type Params = { params: Promise<{ id: string }> };

const postSchema = z.object({
  partNumber: z.string().min(1),
  description: z.string().min(1),
  quantityRequested: z.number().int().min(1),
  linkUrl: z.string().optional(),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canManageWorkOrders(auth.effective.role, slug)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = postSchema.parse(await request.json());
    const requestRow = await createSparePartRequest({
      companyId: auth.activeCompany.id,
      workOrderId: id,
      actorUserId: auth.actor.id,
      ...body,
    });
    if (!requestRow) {
      return NextResponse.json({ error: "OS no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ request: requestRow });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
