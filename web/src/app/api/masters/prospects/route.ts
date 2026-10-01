import { NextResponse } from "next/server";
import { z } from "zod";
import { createProspect, listProspects } from "@/server/masters/prospects";
import { getMastersSession } from "@/server/masters/auth";
import { resolveInitialCommercialResponsible } from "@/server/masters/responsible";
import {
  canCreateProspect,
  canSeeProspects,
} from "@/server/rbac/masters";

export async function GET(request: Request) {
  const auth = await getMastersSession();
  if (!auth || !canSeeProspects(auth.effectiveRole)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const q = new URL(request.url).searchParams.get("q") ?? undefined;
  const rows = await listProspects({
    companyId: auth.activeCompany.id,
    q,
  });
  return NextResponse.json({ prospects: rows });
}

const postSchema = z.object({
  name: z.string().min(1),
  responsibleUserId: z.string().uuid().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await getMastersSession();
  if (
    !auth ||
    !canCreateProspect(auth.effectiveRole, auth.companySlug)
  ) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    const responsibleUserId =
      body.responsibleUserId ??
      (await resolveInitialCommercialResponsible({
        creatorRole: auth.effectiveRole,
        creatorUserId: auth.actorUserId,
        companySlug: auth.companySlug,
      }));
    const prospect = await createProspect({
      companyId: auth.activeCompany.id,
      actorUserId: auth.actorUserId,
      name: body.name,
      responsibleUserId,
      source: body.source,
      notes: body.notes,
    });
    return NextResponse.json({ prospect });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
