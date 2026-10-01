import { NextResponse } from "next/server";
import { z } from "zod";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import { applyInventoryDelta } from "@/server/assets/inventory";
import { getCompanySettings } from "@/server/config/company-settings";
import { canManageInventory } from "@/server/rbac/assets";

type Params = { params: Promise<{ id: string }> };

const postSchema = z.object({
  kind: z.enum(["RECEIPT", "ISSUE", "ADJUSTMENT"]),
  quantityDelta: z.number().int(),
  reference: z.string().optional(),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const slug = auth.activeCompany.slug as CompanySlug;
  const settings = await getCompanySettings(auth.activeCompany.id);
  if (
    !canManageInventory(
      auth.effective.role,
      slug,
      settings.servomotoresInventoryEnabled,
    )
  ) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = postSchema.parse(await request.json());
    const result = await applyInventoryDelta({
      companyId: auth.activeCompany.id,
      partId: id,
      actorUserId: auth.actor.id,
      ...body,
    });
    if (!result) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
