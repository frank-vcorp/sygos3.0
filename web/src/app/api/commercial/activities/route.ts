import { NextResponse } from "next/server";
import { z } from "zod";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import { createActivity, listActivities } from "@/server/commercial/agenda";
import { canUseCommercialAgenda } from "@/server/rbac/commercial";

export async function GET(request: Request) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canUseCommercialAgenda(auth.effective.role, slug)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const url = new URL(request.url);
  const owner =
    url.searchParams.get("mine") === "1" ? auth.effective.id : undefined;
  const rows = await listActivities({
    companyId: auth.activeCompany.id,
    ownerUserId: owner,
  });
  return NextResponse.json({ activities: rows });
}

const createSchema = z.object({
  title: z.string().min(2),
  occurredAt: z.string().datetime(),
  categoryId: z.string().uuid().optional(),
  categoryLabel: z.string().optional(),
  clientId: z.string().uuid().optional(),
  prospectId: z.string().uuid().optional(),
  notes: z.string().optional(),
  evidenceUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canUseCommercialAgenda(auth.effective.role, slug)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = createSchema.parse(await request.json());
    const row = await createActivity({
      companyId: auth.activeCompany.id,
      ownerUserId: auth.effective.id,
      title: body.title,
      occurredAt: new Date(body.occurredAt),
      categoryId: body.categoryId,
      categoryLabel: body.categoryLabel,
      clientId: body.clientId,
      prospectId: body.prospectId,
      notes: body.notes,
      evidenceUrl: body.evidenceUrl,
    });
    return NextResponse.json({ activity: row }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
