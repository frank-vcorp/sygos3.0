import { NextResponse } from "next/server";
import { z } from "zod";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import { resolveCompanyIds } from "@/server/assets/context";
import { confirmMotorCustodyMovement } from "@/server/assets/custody";
import { canOperateServomotoresCustody } from "@/server/rbac/assets";

type Params = { params: Promise<{ id: string }> };

const postSchema = z.object({
  movementType: z.enum([
    "INGRESO",
    "EGRESO",
    "TRIAL_OUT",
    "TRIAL_RETURN",
    "DEFINITIVE_EXIT",
  ]),
  motive: z.string().optional(),
  receiverName: z.string().optional(),
  receiverNotes: z.string().optional(),
  enablingDocumentRef: z.string().optional(),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canOperateServomotoresCustody(auth.effective.role, slug)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = postSchema.parse(await request.json());
    const ids = await resolveCompanyIds();
    const result = await confirmMotorCustodyMovement({
      servomotoresCompanyId: ids.servomotoresId,
      motorId: id,
      actorUserId: auth.actor.id,
      ...body,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
