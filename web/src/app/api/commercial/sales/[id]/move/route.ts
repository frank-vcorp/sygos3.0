import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { recordSaleLineMovement } from "@/server/commercial/sales";
import { canSeeCommercialModule } from "@/server/rbac/commercial";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  lineId: z.string().uuid(),
  kind: z.enum(["receive", "deliver"]),
  quantity: z.number().int().min(1),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canSeeCommercialModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = bodySchema.parse(await request.json());
    const line = await recordSaleLineMovement({
      companyId: auth.activeCompany.id,
      saleId: id,
      lineId: body.lineId,
      kind: body.kind,
      quantity: body.quantity,
    });
    return NextResponse.json({ line });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
