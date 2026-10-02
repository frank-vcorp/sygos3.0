import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { companies } from "@/db/schema";
import { recordKioskPunch } from "@/server/hr/attendance";

const bodySchema = z.object({
  companySlug: z.string(),
  employeeId: z.string().uuid(),
  punchType: z.enum(["ENTRADA", "SALIDA"]),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const db = getDb();
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, body.companySlug))
      .limit(1);
    if (!company) {
      return NextResponse.json({ error: "Empresa no encontrada." }, { status: 404 });
    }
    await recordKioskPunch({
      companyId: company.id,
      employeeId: body.employeeId,
      punchType: body.punchType,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 400 });
  }
}
