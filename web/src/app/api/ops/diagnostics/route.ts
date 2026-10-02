import { NextResponse } from "next/server";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import { listDiagnostics } from "@/server/ops/diagnostics";
import { canSeeTechnicalOps } from "@/server/rbac/ops";

export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canSeeTechnicalOps(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const url = new URL(request.url);
  const validation = url.searchParams.get("validation") === "1";
  const rows = await listDiagnostics({
    activeSlug: auth.activeCompany.slug as CompanySlug,
    companyId: auth.activeCompany.id,
    validationQueue: validation,
  });
  return NextResponse.json({ diagnostics: rows });
}
