import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { recordQuoteDecision } from "@/server/commercial/quotes";
import { canSeeCommercialModule } from "@/server/rbac/commercial";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  authorized: z.boolean(),
  authorizedLineIds: z.array(z.string().uuid()).optional(),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canSeeCommercialModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = bodySchema.parse(await request.json());
    const updated = await recordQuoteDecision({
      companyId: auth.activeCompany.id,
      quoteId: id,
      actorUserId: auth.actor.id,
      authorized: body.authorized,
      authorizedLineIds: body.authorizedLineIds,
    });
    return NextResponse.json({ quote: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INVALID_STATUS") {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
