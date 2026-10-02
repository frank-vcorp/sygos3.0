import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { approveOvertimeByBoss, approveOvertimeByCeo } from "@/server/hr/overtime";
import { canApproveOvertimeBoss, canApproveOvertimeCeo } from "@/server/rbac/hr";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({ stage: z.enum(["jefe", "ceo"]) });

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const body = bodySchema.parse(await request.json());
  try {
    if (body.stage === "jefe") {
      if (!canApproveOvertimeBoss(auth.effective.role)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const row = await approveOvertimeByBoss({
        companyId: auth.activeCompany.id,
        requestId: id,
        bossUserId: auth.actor.id,
      });
      return NextResponse.json({ request: row });
    }
    if (!canApproveOvertimeCeo(auth.effective.role)) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }
    const row = await approveOvertimeByCeo({
      companyId: auth.activeCompany.id,
      requestId: id,
      ceoUserId: auth.actor.id,
    });
    return NextResponse.json({ request: row });
  } catch {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }
}
