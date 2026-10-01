import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users, type UserRole } from "@/db/schema";
import type { CompanySlug } from "@/lib/company";

export async function resolveInitialCommercialResponsible(params: {
  creatorRole: UserRole;
  creatorUserId: string;
  companySlug: CompanySlug;
}): Promise<string> {
  if (params.creatorRole === "VENTAS_SYSTRON") {
    return params.creatorUserId;
  }
  if (params.creatorRole === "COORDINACION_ADMINISTRACION") {
    const db = getDb();
    const [ceo] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "CEO"), eq(users.isActive, true)))
      .limit(1);
    if (ceo) return ceo.id;
  }
  return params.creatorUserId;
}

export async function listCommercialResponsibleOptions(companySlug: CompanySlug) {
  const db = getDb();
  const roles: UserRole[] =
    companySlug === "SYSTRON"
      ? ["CEO", "VENTAS_SYSTRON", "COORDINACION_ADMINISTRACION", "ADMINISTRADOR"]
      : [
          "CEO",
          "GERENTE_OPERATIVO_SERVOMOTORES",
          "COORDINACION_ADMINISTRACION",
          "ADMINISTRADOR",
        ];

  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      role: users.role,
    })
    .from(users)
    .where(eq(users.isActive, true));

  return rows.filter((u) => roles.includes(u.role));
}
