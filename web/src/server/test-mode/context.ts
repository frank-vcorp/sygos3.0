import { cache } from "react";
import type { UserRole } from "@/db/schema";
import { getAuthContext } from "@/server/auth/session";
import {
  getActiveTestModeSession,
  isUserInActiveTestSession,
} from "@/server/config/test-mode-session";

export type TestModeWriteContext = {
  sessionId: string;
  participant: true;
};

export async function getTestModeWriteContext(params: {
  userId: string;
  role: UserRole;
}): Promise<TestModeWriteContext | null> {
  const active = await getActiveTestModeSession();
  if (!active) return null;
  const participant = await isUserInActiveTestSession(params);
  if (!participant) return null;
  return { sessionId: active.session.id, participant: true };
}

/** Folios y altas en la petición actual (participante modo pruebas). */
export const getTestSessionIdForRequest = cache(async (): Promise<string | null> => {
  const auth = await getAuthContext();
  if (!auth) return null;
  const ctx = await getTestModeWriteContext({
    userId: auth.effective.id,
    role: auth.effective.role,
  });
  return ctx?.sessionId ?? null;
});
