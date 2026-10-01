import { NextResponse } from "next/server";
import { z } from "zod";
import { convertProspectToClient } from "@/server/masters/prospects";
import { getMastersSession } from "@/server/masters/auth";
import { canConvertProspect } from "@/server/rbac/masters";

type Params = { params: Promise<{ id: string }> };

const postSchema = z.object({
  existingClientId: z.string().uuid().optional(),
  legalNameOverride: z.string().optional(),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await getMastersSession();
  if (
    !auth ||
    !canConvertProspect(auth.effectiveRole, auth.companySlug)
  ) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = postSchema.parse(await request.json());
    const result = await convertProspectToClient({
      companyId: auth.activeCompany.id,
      companySlug: auth.companySlug,
      prospectId: id,
      actorUserId: auth.actorUserId,
      creatorRole: auth.effectiveRole,
      existingClientId: body.existingClientId,
      legalNameOverride: body.legalNameOverride,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
