import { NextResponse } from "next/server";
import { getAuthContext } from "@/server/auth/session";
import { canGlobalSearch } from "@/server/rbac/users-admin";
import { runGlobalSearch } from "@/server/search/global";

export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canGlobalSearch(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const hits = await runGlobalSearch({
    companyId: auth.activeCompany.id,
    q,
  });
  return NextResponse.json({ q, hits });
}
