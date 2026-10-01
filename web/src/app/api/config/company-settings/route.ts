import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCompanySettings,
  updateCompanySettings,
} from "@/server/config/company-settings";
import { getAuthContext } from "@/server/auth/session";
import {
  canManageCompanyCapabilities,
  canManageCompanySettings,
} from "@/server/rbac/users-admin";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !canManageCompanySettings(auth.actor.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const settings = await getCompanySettings(auth.activeCompany.id);
  return NextResponse.json({
    company: auth.activeCompany.name,
    settings,
    canEditCapabilities: canManageCompanyCapabilities(auth.actor.role),
  });
}

const patchSchema = z.object({
  tradeName: z.string().nullable().optional(),
  taxLegalName: z.string().nullable().optional(),
  taxRfc: z.string().nullable().optional(),
  taxRegime: z.string().nullable().optional(),
  taxZip: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  directPurchaseMonthlyLimitMxn: z.number().int().min(0).optional(),
  directPurchaseIndividualLimitMxn: z.number().int().min(0).optional(),
  servomotoresInventoryEnabled: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canManageCompanySettings(auth.actor.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = patchSchema.parse(await request.json());
    if (
      body.servomotoresInventoryEnabled !== undefined &&
      !canManageCompanyCapabilities(auth.actor.role)
    ) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }
    if (
      auth.activeCompany.slug !== "SERVOMOTORES" &&
      body.servomotoresInventoryEnabled !== undefined
    ) {
      return NextResponse.json(
        { error: "Inventario Servomotores solo aplica a esa empresa." },
        { status: 400 },
      );
    }
    const settings = await updateCompanySettings(auth.activeCompany.id, body);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
