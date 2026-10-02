import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import {
  getVendorPerformance,
  listGoalTypes,
  upsertGoalTarget,
} from "@/server/commercial/goals";
import {
  canManageCommercialGoals,
  canSeeCommercialModule,
} from "@/server/rbac/commercial";

export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canSeeCommercialModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year") ?? new Date().getFullYear());
  const month = Number(url.searchParams.get("month") ?? new Date().getMonth() + 1);
  const userId = url.searchParams.get("userId") ?? auth.effective.id;

  const [types, performance] = await Promise.all([
    listGoalTypes(auth.activeCompany.id),
    getVendorPerformance({
      companyId: auth.activeCompany.id,
      userId,
      year,
      month,
    }),
  ]);
  return NextResponse.json({ types, performance, year, month, userId });
}

const postSchema = z.object({
  userId: z.string().uuid(),
  goalTypeId: z.string().uuid(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  targetValue: z.number().int().min(0),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canManageCommercialGoals(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    await upsertGoalTarget({
      companyId: auth.activeCompany.id,
      ...body,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
