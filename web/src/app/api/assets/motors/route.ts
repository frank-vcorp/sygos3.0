import { NextResponse } from "next/server";
import { z } from "zod";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import { resolveCompanyIds } from "@/server/assets/context";
import { createMotor, listMotors } from "@/server/assets/motors";
import { canCreateMotor, canSeeMotors } from "@/server/rbac/assets";

export async function GET(request: Request) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canSeeMotors(auth.effective.role, slug)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const url = new URL(request.url);
  const ids = await resolveCompanyIds();
  const rows = await listMotors({
    activeSlug: slug,
    systronCompanyId: ids.systronId,
    servomotoresCompanyId: ids.servomotoresId,
    q: url.searchParams.get("q") ?? undefined,
    intakeFilter:
      (url.searchParams.get("intake") as "PENDING_INTAKE" | "IN_CUSTODY") ??
      undefined,
  });
  return NextResponse.json({ motors: rows });
}

const postSchema = z.object({
  clientId: z.string().uuid(),
  identification: z.string().min(1),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canCreateMotor(auth.effective.role, slug)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    const ids = await resolveCompanyIds();
    const motor = await createMotor({
      activeSlug: slug,
      systronCompanyId: ids.systronId,
      servomotoresCompanyId: ids.servomotoresId,
      actorUserId: auth.actor.id,
      ...body,
    });
    return NextResponse.json({ motor });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
