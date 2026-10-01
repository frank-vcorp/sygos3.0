import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { companies } from "@/db/schema";
import {
  getAuthContext,
  updateSessionCompany,
} from "@/server/auth/session";

const bodySchema = z.object({
  companySlug: z.enum(["SYSTRON", "SERVOMOTORES"]),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    const { companySlug } = bodySchema.parse(await request.json());
    const db = getDb();
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, companySlug))
      .limit(1);

    if (!company || !auth.companyIds.includes(company.id)) {
      return NextResponse.json({ error: "Empresa no permitida." }, { status: 403 });
    }

    await updateSessionCompany(auth.sessionId, company.id);
    return NextResponse.json({ ok: true, company: company.name });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
