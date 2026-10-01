import { NextResponse } from "next/server";
import { z } from "zod";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import {
  applyInventoryImport,
  previewInventoryImport,
} from "@/server/assets/inventory";
import { getCompanySettings } from "@/server/config/company-settings";
import { canManageInventory } from "@/server/rbac/assets";

const bodySchema = z.object({
  action: z.enum(["preview", "apply"]),
  lines: z.array(
    z.object({
      partNumber: z.string().min(1),
      countedQty: z.number().int().min(0),
    }),
  ),
});

export async function POST(request: Request) {
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
  try {
    const body = bodySchema.parse(await request.json());
    if (body.action === "preview") {
      const preview = await previewInventoryImport({
        companyId: auth.activeCompany.id,
        lines: body.lines,
      });
      return NextResponse.json({ preview });
    }
    await applyInventoryImport({
      companyId: auth.activeCompany.id,
      actorUserId: auth.actor.id,
      lines: body.lines,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
