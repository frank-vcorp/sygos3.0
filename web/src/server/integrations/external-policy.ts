import type { UserRole } from "@/db/schema";
import { isTestModeEnabled } from "@/server/config/test-mode";
import { isUserInActiveTestSession } from "@/server/config/test-mode-session";

/** Simulación permitida solo en Modo de Pruebas (empresa o sesión de participante). */
export async function shouldSimulateExternalEffects(params: {
  companyId: string;
  userId: string;
  role: UserRole;
}): Promise<boolean> {
  if (await isTestModeEnabled(params.companyId)) return true;
  return isUserInActiveTestSession({
    userId: params.userId,
    role: params.role,
  });
}

export async function shouldShowTestModeBanner(params: {
  companyId: string;
  userId: string;
  role: UserRole;
}): Promise<boolean> {
  return shouldSimulateExternalEffects(params);
}
