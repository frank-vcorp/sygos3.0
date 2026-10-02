import { NextResponse } from "next/server";
import { getAuthContext } from "@/server/auth/session";
import { listEquipmentSales } from "@/server/commercial/sales";
import { canSeeCommercialModule } from "@/server/rbac/commercial";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !canSeeCommercialModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const sales = await listEquipmentSales(auth.activeCompany.id);
  return NextResponse.json({ sales });
}
