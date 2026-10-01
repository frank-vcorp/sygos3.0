import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { companies } from "@/db/schema";
import { getAuthContext } from "@/server/auth/session";
import {
  listIntegrationsForCompany,
  upsertIntegration,
} from "@/server/integrations/status";
import { canManageIntegrations } from "@/server/rbac/roles";

export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canManageIntegrations(auth.actor.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const slug = new URL(request.url).searchParams.get("company");
  const db = getDb();
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, slug ?? auth.activeCompany.slug))
    .limit(1);

  if (!company || !auth.companyIds.includes(company.id)) {
    return NextResponse.json({ error: "Empresa no permitida." }, { status: 403 });
  }

  const integrations = await listIntegrationsForCompany(company.id);
  return NextResponse.json({ company: company.name, integrations });
}

const patchSchema = z.object({
  companySlug: z.enum(["SYSTRON", "SERVOMOTORES"]),
  provider: z.enum(["facturapi", "sendgrid", "whatsapp"]),
  enabled: z.boolean(),
  config: z.record(z.string(), z.string()).optional(),
});

export async function PATCH(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canManageIntegrations(auth.actor.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  try {
    const body = patchSchema.parse(await request.json());
    const db = getDb();
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, body.companySlug))
      .limit(1);

    if (!company || !auth.companyIds.includes(company.id)) {
      return NextResponse.json({ error: "Empresa no permitida." }, { status: 403 });
    }

    await upsertIntegration({
      companyId: company.id,
      provider: body.provider,
      enabled: body.enabled,
      config: body.config,
      mergeConfig: true,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
