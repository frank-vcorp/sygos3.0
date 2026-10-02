import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  companies,
  userCompanyAccess,
  users,
  type UserRole,
} from "@/db/schema";
import { hashPassword } from "@/server/auth/password";
import { roleLabel } from "@/lib/role-labels";

type CompanyScope = "SYSTRON" | "SERVOMOTORES" | "BOTH";

const DEMO_VIEW_AS_USERS: {
  username: string;
  displayName: string;
  role: UserRole;
  scope: CompanyScope;
}[] = [
  { username: "qa.ceo", displayName: "QA CEO", role: "CEO", scope: "BOTH" },
  {
    username: "qa.coordinacion",
    displayName: "QA Coordinación",
    role: "COORDINACION_ADMINISTRACION",
    scope: "BOTH",
  },
  {
    username: "qa.gerente.systron",
    displayName: "QA Gerente Op. SYSTRON",
    role: "GERENTE_OPERATIVO_SYSTRON",
    scope: "SYSTRON",
  },
  {
    username: "qa.gerente.sm",
    displayName: "QA Gerente Op. SM",
    role: "GERENTE_OPERATIVO_SERVOMOTORES",
    scope: "SERVOMOTORES",
  },
  {
    username: "qa.supervisor.systron",
    displayName: "QA Supervisor SYSTRON",
    role: "SUPERVISOR_TECNICO_SYSTRON",
    scope: "SYSTRON",
  },
  {
    username: "qa.tecnico.systron",
    displayName: "QA Técnico SYSTRON",
    role: "TECNICO_SYSTRON",
    scope: "SYSTRON",
  },
  {
    username: "qa.ventas.systron",
    displayName: "QA Ventas SYSTRON",
    role: "VENTAS_SYSTRON",
    scope: "SYSTRON",
  },
  {
    username: "qa.almacen.systron",
    displayName: "QA Almacén SYSTRON",
    role: "ALMACEN_SYSTRON",
    scope: "SYSTRON",
  },
  {
    username: "qa.ayudante.sm",
    displayName: "QA Ayudante SM",
    role: "AYUDANTE_GENERAL_SERVOMOTORES",
    scope: "SERVOMOTORES",
  },
  {
    username: "qa.kiosco",
    displayName: "QA Kiosco",
    role: "KIOSCO",
    scope: "SYSTRON",
  },
];

function companyIdsForScope(
  scope: CompanyScope,
  systronId: string,
  servomotoresId: string,
) {
  if (scope === "BOTH") return [systronId, servomotoresId];
  if (scope === "SERVOMOTORES") return [servomotoresId];
  return [systronId];
}

function homeCompanyId(
  scope: CompanyScope,
  systronId: string,
  servomotoresId: string,
) {
  return scope === "SERVOMOTORES" ? servomotoresId : systronId;
}

export async function ensureDemoViewAsUsers(password: string) {
  const db = getDb();
  const passwordHash = await hashPassword(password);

  const [systron] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, "SYSTRON"))
    .limit(1);
  const [servomotores] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, "SERVOMOTORES"))
    .limit(1);
  if (!systron || !servomotores) {
    throw new Error("COMPANIES_MISSING_RUN_SEED");
  }

  const created: string[] = [];
  const updated: string[] = [];

  for (const spec of DEMO_VIEW_AS_USERS) {
    const homeId = homeCompanyId(spec.scope, systron.id, servomotores.id);
    const accessIds = companyIdsForScope(
      spec.scope,
      systron.id,
      servomotores.id,
    );

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.username, spec.username))
      .limit(1);

    let userId: string;
    if (existing) {
      await db
        .update(users)
        .set({
          displayName: spec.displayName,
          role: spec.role,
          passwordHash,
          homeCompanyId: homeId,
          mustChangePassword: false,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id));
      userId = existing.id;
      updated.push(spec.username);
    } else {
      const [row] = await db
        .insert(users)
        .values({
          username: spec.username,
          displayName: spec.displayName,
          passwordHash,
          role: spec.role,
          homeCompanyId: homeId,
          mustChangePassword: false,
          isActive: true,
        })
        .returning();
      userId = row.id;
      created.push(spec.username);
    }

    for (const companyId of accessIds) {
      const [link] = await db
        .select()
        .from(userCompanyAccess)
        .where(
          and(
            eq(userCompanyAccess.userId, userId),
            eq(userCompanyAccess.companyId, companyId),
          ),
        )
        .limit(1);
      if (!link) {
        await db.insert(userCompanyAccess).values({ userId, companyId });
      }
    }
  }

  return {
    created,
    updated,
    users: DEMO_VIEW_AS_USERS.map((u) => ({
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      roleLabel: roleLabel(u.role),
      scope: u.scope,
    })),
  };
}
