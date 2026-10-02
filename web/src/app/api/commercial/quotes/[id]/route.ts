import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { getAuthContext } from "@/server/auth/session";
import {
  applyVendorDiscount,
  getQuoteDetail,
  linkQuoteToAsset,
  markQuoteSent,
  reviseAuthorizedPrice,
} from "@/server/commercial/quotes";
import type { CompanySlug } from "@/lib/company";
import {
  canManageQuoteFollowUp,
  canManageQuotePricing,
  canSeeCommercialModule,
  canSeeIntercompanyBase,
} from "@/server/rbac/commercial";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canSeeCommercialModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const detail = await getQuoteDetail(auth.activeCompany.id, id);
  if (!detail) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  if (
    !canSeeIntercompanyBase(auth.effective.role) &&
    detail.quote.intercompanyBaseTotalMxn != null
  ) {
    detail.quote.intercompanyBaseTotalMxn = null;
    detail.linkedQuote = null;
  }
  return NextResponse.json(detail);
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("send"),
    contactIds: z.array(z.string().uuid()).min(1),
    nextFollowUpAt: z.string().datetime().optional(),
  }),
  z.object({
    action: z.literal("discount"),
    discountPct: z.number().min(0).max(100),
  }),
  z.object({
    action: z.literal("link_asset"),
    equiId: z.string().uuid().optional(),
    motorId: z.string().uuid().optional(),
  }),
  z.object({
    action: z.literal("revise_price"),
    subtotalMxn: z.number().int().min(0),
    note: z.string().min(3),
  }),
]);

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canSeeCommercialModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = patchSchema.parse(await request.json());
    if (body.action === "send") {
      if (
        !canManageQuoteFollowUp(
          auth.effective.role,
          auth.activeCompany.slug as CompanySlug,
        )
      ) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const updated = await markQuoteSent({
        companyId: auth.activeCompany.id,
        quoteId: id,
        contactIds: body.contactIds,
        nextFollowUpAt: body.nextFollowUpAt
          ? new Date(body.nextFollowUpAt)
          : undefined,
      });
      return NextResponse.json({ quote: updated });
    }
    if (body.action === "discount") {
      if (
        !canManageQuoteFollowUp(
          auth.effective.role,
          auth.activeCompany.slug as CompanySlug,
        )
      ) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const db = getDb();
      const [u] = await db
        .select({ vendorDiscountLimitPct: users.vendorDiscountLimitPct })
        .from(users)
        .where(eq(users.id, auth.effective.id))
        .limit(1);
      const updated = await applyVendorDiscount({
        companyId: auth.activeCompany.id,
        quoteId: id,
        actorUserId: auth.actor.id,
        discountPct: body.discountPct,
        maxVendorPct: u?.vendorDiscountLimitPct ?? null,
        unlimited: canManageQuotePricing(auth.effective.role),
      });
      return NextResponse.json({ quote: updated });
    }
    if (body.action === "link_asset") {
      const updated = await linkQuoteToAsset({
        companyId: auth.activeCompany.id,
        quoteId: id,
        equiId: body.equiId,
        motorId: body.motorId,
      });
      return NextResponse.json({ quote: updated });
    }
    if (body.action === "revise_price") {
      if (!canManageQuotePricing(auth.effective.role)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const updated = await reviseAuthorizedPrice({
        companyId: auth.activeCompany.id,
        quoteId: id,
        actorUserId: auth.actor.id,
        subtotalMxn: body.subtotalMxn,
        note: body.note,
      });
      return NextResponse.json({ quote: updated });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INVALID";
    if (msg === "DISCOUNT_LIMIT") {
      return NextResponse.json({ error: "Descuento fuera de límite." }, { status: 400 });
    }
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
}
