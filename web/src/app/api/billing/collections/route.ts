import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { addCollectionLog } from "@/server/billing/collections";
import { canSeeBillingModule } from "@/server/rbac/billing";

const postSchema = z.object({
  arEntryId: z.string().uuid(),
  note: z.string().min(2),
  promiseDate: z.string().datetime().optional(),
  nextFollowUpAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canSeeBillingModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    const row = await addCollectionLog({
      companyId: auth.activeCompany.id,
      arEntryId: body.arEntryId,
      authorUserId: auth.actor.id,
      note: body.note,
      promiseDate: body.promiseDate ? new Date(body.promiseDate) : undefined,
      nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : undefined,
    });
    return NextResponse.json({ log: row }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
