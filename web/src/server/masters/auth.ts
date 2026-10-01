import { getAuthContext } from "@/server/auth/session";
import type { CompanySlug } from "@/lib/company";

export async function getMastersSession() {
  const auth = await getAuthContext();
  if (!auth) return null;
  return {
    ...auth,
    companySlug: auth.activeCompany.slug as CompanySlug,
    actorUserId: auth.actor.id,
    effectiveRole: auth.effective.role,
  };
}
