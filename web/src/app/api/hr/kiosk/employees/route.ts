import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { companies } from "@/db/schema";
import { listKioskEmployees } from "@/server/hr/employees";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "SYSTRON";
  const db = getDb();
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!company) {
    return NextResponse.json({ error: "Empresa no encontrada." }, { status: 404 });
  }
  const rows = await listKioskEmployees(company.id);
  return NextResponse.json({
    employees: rows.map((e) => ({ id: e.id, legalName: e.legalName })),
  });
}
