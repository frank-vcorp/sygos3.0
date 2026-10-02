import { NextResponse } from "next/server";
import { z } from "zod";
import { userRoleEnum } from "@/db/schema";
import {
  endActiveTestModeSession,
  getActiveTestModeSession,
  startTestModeSession,
} from "@/server/config/test-mode-session";
import { getAuthContext } from "@/server/auth/session";
import { canManageCompanySettings } from "@/server/rbac/users-admin";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !canManageCompanySettings(auth.actor.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const active = await getActiveTestModeSession();
  return NextResponse.json({ active });
}

const startSchema = z.object({
  userIds: z.array(z.string().uuid()).default([]),
  roles: z.array(z.enum(userRoleEnum.enumValues)).default([]),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canManageCompanySettings(auth.actor.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = startSchema.parse(await request.json());
  if (body.userIds.length === 0 && body.roles.length === 0) {
    return NextResponse.json(
      { error: "Selecciona al menos un usuario o rol." },
      { status: 400 },
    );
  }
  const session = await startTestModeSession({
    startedByUserId: auth.actor.id,
    userIds: body.userIds,
    roles: body.roles,
  });
  return NextResponse.json({ session });
}

export async function DELETE() {
  const auth = await getAuthContext();
  if (!auth || !canManageCompanySettings(auth.actor.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const ended = await endActiveTestModeSession();
  return NextResponse.json({ ended: Boolean(ended) });
}
