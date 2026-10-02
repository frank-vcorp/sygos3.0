import { and, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { clients, companies, motors } from "@/db/schema";
import type { CompanySlug } from "@/lib/company";
import {
  formatMotFolio,
  nextGlobalMotFolio,
} from "@/server/masters/folios";

export function motorVisibilityFilter(activeSlug: CompanySlug, companyIds: {
  systronId: string;
  servomotoresId: string;
}) {
  if (activeSlug === "SYSTRON") {
    return eq(motors.originCompanyId, companyIds.systronId);
  }
  return or(
    eq(motors.originCompanyId, companyIds.servomotoresId),
    eq(motors.origin, "SYSTRON"),
  )!;
}

export async function listMotors(params: {
  activeSlug: CompanySlug;
  systronCompanyId: string;
  servomotoresCompanyId: string;
  clientId?: string;
  q?: string;
  intakeFilter?: "PENDING_INTAKE" | "IN_CUSTODY" | "ALL";
}) {
  const db = getDb();
  const conditions = [
    motorVisibilityFilter(params.activeSlug, {
      systronId: params.systronCompanyId,
      servomotoresId: params.servomotoresCompanyId,
    }),
  ];
  if (params.clientId) {
    conditions.push(eq(motors.clientId, params.clientId));
  }
  if (params.intakeFilter && params.intakeFilter !== "ALL") {
    conditions.push(eq(motors.servomotoresIntakeStatus, params.intakeFilter));
  }
  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    const folioNum = Number.parseInt(params.q.replace(/\D/g, ""), 10);
    const folioMatch = Number.isFinite(folioNum)
      ? eq(motors.folioNumber, folioNum)
      : undefined;
    conditions.push(
      or(
        ilike(motors.identification, term),
        ilike(motors.model, term),
        ilike(motors.serialNumber, term),
        folioMatch,
      )!,
    );
  }
  const rows = await db
    .select({
      id: motors.id,
      folioNumber: motors.folioNumber,
      identification: motors.identification,
      origin: motors.origin,
      servomotoresIntakeStatus: motors.servomotoresIntakeStatus,
      clientName: clients.legalName,
      createdAt: motors.createdAt,
    })
    .from(motors)
    .innerJoin(clients, eq(clients.id, motors.clientId))
    .where(and(...conditions))
    .orderBy(desc(motors.createdAt));

  return rows.map((r) => ({
    ...r,
    folio: formatMotFolio(r.folioNumber),
  }));
}

export async function getMotorDetail(motorId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(motors)
    .where(eq(motors.id, motorId))
    .limit(1);
  if (!row) return null;
  const [client] = await db
    .select({ legalName: clients.legalName })
    .from(clients)
    .where(eq(clients.id, row.clientId))
    .limit(1);
  const [originCo] = await db
    .select({ name: companies.name, slug: companies.slug })
    .from(companies)
    .where(eq(companies.id, row.originCompanyId))
    .limit(1);
  return {
    motor: row,
    folio: formatMotFolio(row.folioNumber),
    clientName: client?.legalName ?? "—",
    originCompany: originCo,
  };
}

export async function createMotor(params: {
  activeSlug: CompanySlug;
  systronCompanyId: string;
  servomotoresCompanyId: string;
  actorUserId: string;
  clientId: string;
  identification: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  notes?: string;
}) {
  const db = getDb();
  const folioNumber = await nextGlobalMotFolio();
  const origin =
    params.activeSlug === "SYSTRON" ? "SYSTRON" : "SERVOMOTORES_DIRECT";
  const originCompanyId =
    params.activeSlug === "SYSTRON"
      ? params.systronCompanyId
      : params.servomotoresCompanyId;
  const servomotoresIntakeStatus =
    origin === "SYSTRON" ? "PENDING_INTAKE" : "PENDING_INTAKE";

  const [inserted] = await db
    .insert(motors)
    .values({
      folioNumber,
      origin,
      originCompanyId,
      clientId: params.clientId,
      identification: params.identification.trim(),
      brand: params.brand?.trim() || null,
      model: params.model?.trim() || null,
      serialNumber: params.serialNumber?.trim() || null,
      notes: params.notes?.trim() || null,
      servomotoresIntakeStatus,
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  return { ...inserted, folio: formatMotFolio(folioNumber) };
}

export async function searchMotorsByFolio(q: string, companyIds: {
  systronId: string;
  servomotoresId: string;
  activeSlug: CompanySlug;
}) {
  const num = Number.parseInt(q.replace(/\D/g, ""), 10);
  if (!Number.isFinite(num)) return [];
  const db = getDb();
  return db
    .select({
      id: motors.id,
      folioNumber: motors.folioNumber,
      identification: motors.identification,
    })
    .from(motors)
    .where(
      and(
        eq(motors.folioNumber, num),
        motorVisibilityFilter(companyIds.activeSlug, {
          systronId: companyIds.systronId,
          servomotoresId: companyIds.servomotoresId,
        }),
      ),
    )
    .limit(5);
}
