import { NextResponse } from "next/server";
import { z } from "zod";
import { probeFacturapiConnection } from "@/server/billing/facturapi-client";
import { getAuthContext } from "@/server/auth/session";
import { canManageIntegrations } from "@/server/rbac/roles";

const bodySchema = z.object({
  provider: z.enum(["facturapi"]),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canManageIntegrations(auth.actor.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = bodySchema.parse(await request.json());
  if (body.provider === "facturapi") {
    const result = await probeFacturapiConnection(auth.activeCompany.id);
    return NextResponse.json(result);
  }
  return NextResponse.json({ ok: false, message: "Proveedor no soportado." });
}
