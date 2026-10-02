import { NextResponse } from "next/server";
import { getAuthContext } from "@/server/auth/session";
import { listFunctionalHistory } from "@/server/history/functional";

export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  if (!entityType || !entityId) {
    return NextResponse.json({ error: "Parámetros requeridos." }, { status: 400 });
  }
  const entries = await listFunctionalHistory({ entityType, entityId });
  return NextResponse.json({ entries });
}
