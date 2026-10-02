import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import type { CompanySlug } from "@/lib/company";
import { createVendorQuote, listQuotes } from "@/server/commercial/quotes";
import {
  canCreateQuoteAsVendor,
  canSeeCommercialModule,
  vendorQuoteScopeUserId,
} from "@/server/rbac/commercial";

export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canSeeCommercialModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const url = new URL(request.url);
  const pending = url.searchParams.get("pendingPricing") === "1";
  const scope = vendorQuoteScopeUserId(
    auth.effective.role,
    auth.effective.id,
  );
  const rows = await listQuotes({
    companyId: auth.activeCompany.id,
    pendingPricingOnly: pending,
    vendorUserId: scope ?? undefined,
  });
  return NextResponse.json({ quotes: rows });
}

const createSchema = z.object({
  clientId: z.string().uuid(),
  vendorUserId: z.string().uuid().optional(),
  quoteType: z.enum([
    "DIAGNOSTICO",
    "REPARACION_SERVICIO",
    "SERVICIO_CAMPO",
    "VENTA_EQUIPO",
  ]),
  equiId: z.string().uuid().optional(),
  motorId: z.string().uuid().optional(),
  prelimEquipmentType: z.string().optional(),
  prelimBrand: z.string().optional(),
  prelimModel: z.string().optional(),
  prelimSerial: z.string().optional(),
  commercialReference: z.string().optional(),
  complementNotes: z.string().optional(),
  contactIds: z.array(z.string().uuid()).optional(),
  lines: z
    .array(
      z.object({
        concept: z.string().min(1),
        quantity: z.number().int().min(1),
        unitPriceMxn: z.number().int().optional(),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canCreateQuoteAsVendor(auth.effective.role, slug)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = createSchema.parse(await request.json());
    const vendorUserId =
      body.vendorUserId ??
      vendorQuoteScopeUserId(auth.effective.role, auth.effective.id) ??
      auth.effective.id;
    const quote = await createVendorQuote({
      companyId: auth.activeCompany.id,
      actorUserId: auth.actor.id,
      vendorUserId,
      clientId: body.clientId,
      quoteType: body.quoteType,
      equiId: body.equiId,
      motorId: body.motorId,
      prelimEquipmentType: body.prelimEquipmentType,
      prelimBrand: body.prelimBrand,
      prelimModel: body.prelimModel,
      prelimSerial: body.prelimSerial,
      commercialReference: body.commercialReference,
      complementNotes: body.complementNotes,
      contactIds: body.contactIds,
      lines: body.lines,
      awaitingPhysicalAsset: !body.equiId && !body.motorId,
    });
    return NextResponse.json({ quote }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
