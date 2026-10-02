import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { motors, quotes, serviceAttentions } from "@/db/schema";
import type { JourneyHint } from "@/server/journey/types";
import { resolveCompanyIds } from "@/server/assets/context";

export async function getEquiJourneyHint(params: {
  equiId: string;
  companyId: string;
  custodyStatus: string;
}): Promise<JourneyHint | null> {
  if (params.custodyStatus === "AWAITING_ENTRY") {
    return {
      message: "Confirmar entrada física en Almacén para iniciar SLA técnico.",
      href: "/activos/almacen",
    };
  }

  const db = getDb();
  const [pendingQuote] = await db
    .select({ id: quotes.id })
    .from(quotes)
    .where(
      and(
        eq(quotes.equiId, params.equiId),
        eq(quotes.status, "AUTORIZADA_PENDIENTE_INGRESO"),
      ),
    )
    .limit(1);
  if (pendingQuote) {
    return {
      message: "Cotización autorizada espera ingreso — confirmar entrada y abrir técnica.",
      href: `/comercial/cotizaciones/${pendingQuote.id}`,
    };
  }

  return {
    message: "Crear atención técnica o cotización comercial desde Cliente/EQUI.",
    href: "/operacion/atenciones/nueva",
  };
}

export async function getMotorJourneyHint(params: {
  motorId: string;
  activeCompanyId: string;
  origin: string;
  servomotoresIntakeStatus: string | null;
}): Promise<JourneyHint | null> {
  const ids = await resolveCompanyIds();
  const db = getDb();

  if (
    params.origin === "SYSTRON" &&
    params.activeCompanyId === ids.servomotoresId &&
    params.servomotoresIntakeStatus === "PENDING_INTAKE"
  ) {
    return {
      message: "MOT intercompañía: Gerente SM debe confirmar ingreso físico.",
      href: "/activos/almacen",
    };
  }

  if (params.origin === "SYSTRON" && params.activeCompanyId === ids.systronId) {
    const [att] = await db
      .select({ id: serviceAttentions.id })
      .from(serviceAttentions)
      .where(eq(serviceAttentions.motorId, params.motorId))
      .limit(1);
    return {
      message: att
        ? "Seguimiento en solo lectura — operación en Servomotores."
        : "Crear atención MOT hacia Servomotores.",
      href: att ? "/paneles/operacion-systron" : "/operacion/atenciones/nueva",
    };
  }

  const [smBaseQuote] = await db
    .select({ id: quotes.id, status: quotes.status })
    .from(quotes)
    .where(
      and(
        eq(quotes.motorId, params.motorId),
        eq(quotes.quoteOrigin, "MOT_BASE_SERVOMOTORES"),
      ),
    )
    .limit(1);

  if (smBaseQuote?.status === "PENDIENTE_COTIZAR") {
    return {
      message: "Cotización base SM → SYSTRON pendiente de precio.",
      href: `/comercial/cotizaciones/${smBaseQuote.id}`,
    };
  }

  if (params.activeCompanyId === ids.systronId && params.origin === "SYSTRON") {
    const [mirror] = await db
      .select({ id: quotes.id, status: quotes.status })
      .from(quotes)
      .where(
        and(eq(quotes.motorId, params.motorId), eq(quotes.companyId, ids.systronId)),
      )
      .limit(1);
    if (mirror?.status === "PENDIENTE_COTIZAR") {
      return {
        message: "Precio final al cliente SYSTRON (pendiente cotizar).",
        href: `/comercial/cotizaciones/${mirror.id}`,
      };
    }
    if (mirror?.status === "PENDIENTE_DECISION") {
      return {
        message: "Vendedor SYSTRON: decisión del cliente final.",
        href: `/comercial/cotizaciones/${mirror.id}`,
      };
    }
    if (mirror?.status === "AUTORIZADA") {
      return {
        message: "Factura intercompañía / CxP cuando corresponda.",
        href: "/administracion/cxp",
      };
    }
  }

  const [motor] = await db
    .select()
    .from(motors)
    .where(eq(motors.id, params.motorId))
    .limit(1);
  if (motor && params.servomotoresIntakeStatus === "IN_CUSTODY") {
    return {
      message: "Operación técnica en Servomotores — diagnóstico/OS y cotización base.",
      href: "/paneles/gerente-sm",
    };
  }

  return {
    message: "Flujo MOT: atención → ingreso → técnica → cotización.",
    href: "/operacion/recorrido",
  };
}
