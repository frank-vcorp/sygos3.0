import { NextResponse } from "next/server";
import { getAuthContext } from "@/server/auth/session";
import {
  applyCommercialWarrantyOverride,
  createWarrantyRepairWorkOrder,
} from "@/server/ops/warranty";
import { isSuperAdmin } from "@/server/rbac/roles";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (
    !auth ||
    !(
      auth.effective.role === "CEO" ||
      auth.effective.role === "ADMINISTRADOR" ||
      isSuperAdmin(auth.effective.role)
    )
  ) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const updated = await applyCommercialWarrantyOverride({
      companyId: auth.activeCompany.id,
      diagnosticId: id,
      actorUserId: auth.actor.id,
    });
    await createWarrantyRepairWorkOrder({
      companyId: auth.activeCompany.id,
      diagnosticId: id,
      actorUserId: auth.actor.id,
    });
    return NextResponse.json({ diagnostic: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
