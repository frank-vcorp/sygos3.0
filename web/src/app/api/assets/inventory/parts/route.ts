import { NextResponse } from "next/server";
import { z } from "zod";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import {
  createInventoryPart,
  listInventoryParts,
} from "@/server/assets/inventory";
import { getCompanySettings } from "@/server/config/company-settings";
import { canManageInventory } from "@/server/rbac/assets";

async function inventoryAllowed(auth: NonNullable<Awaited<ReturnType<typeof getAuthContext>>>) {
  const slug = auth.activeCompany.slug as CompanySlug;
  const settings = await getCompanySettings(auth.activeCompany.id);
  return canManageInventory(
    auth.effective.role,
    slug,
    settings.servomotoresInventoryEnabled,
  );
}

export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !(await inventoryAllowed(auth))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const q = new URL(request.url).searchParams.get("q") ?? undefined;
  const parts = await listInventoryParts({
    companyId: auth.activeCompany.id,
    q,
  });
  return NextResponse.json({ parts });
}

const postSchema = z.object({
  partNumber: z.string().min(1),
  description: z.string().min(1),
  minQty: z.number().int().min(0).nullable().optional(),
  maxQty: z.number().int().min(0).nullable().optional(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !(await inventoryAllowed(auth))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    const part = await createInventoryPart({
      companyId: auth.activeCompany.id,
      ...body,
    });
    return NextResponse.json({ part });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
