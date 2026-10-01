import { NextResponse } from "next/server";
import { getMastersSession } from "@/server/masters/auth";
import { listCommercialResponsibleOptions } from "@/server/masters/responsible";
import { canSeeClients } from "@/server/rbac/masters";

export async function GET() {
  const auth = await getMastersSession();
  if (!auth || !canSeeClients(auth.effectiveRole)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const users = await listCommercialResponsibleOptions(auth.companySlug);
  return NextResponse.json({ users });
}
