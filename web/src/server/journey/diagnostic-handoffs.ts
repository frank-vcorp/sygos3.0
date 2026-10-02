import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { diagnostics, externalServiceCases, quotes } from "@/db/schema";
import type { JourneyHint } from "@/server/journey/types";
import { formatQuoteFolio } from "@/server/masters/folios";

export async function getDiagnosticJourneyHint(params: {
  diagnosticId: string;
  companyId: string;
  status: string;
  assignedUserId: string | null;
  attentionType?: string;
  warrantyDecision?: string | null;
}): Promise<JourneyHint | null> {
  const db = getDb();

  const [ext] = await db
    .select()
    .from(externalServiceCases)
    .where(eq(externalServiceCases.diagnosticId, params.diagnosticId))
    .limit(1);
  if (ext?.status === "AT_VENDOR") {
    return {
      message: "Servicio externo en proveedor — registrar retorno y continuar diagnóstico.",
      href: `/operacion/diagnosticos/${params.diagnosticId}`,
    };
  }

  if (params.attentionType === "DIAGNOSTICO_GARANTIA" && !params.warrantyDecision) {
    return {
      message: "Gerente Operativo debe determinar procedencia de garantía.",
      href: `/operacion/diagnosticos/${params.diagnosticId}`,
    };
  }

  if (params.status === "PENDIENTE_VALIDACION_GERENTE") {
    return {
      message: "Gerente Operativo: validar o devolver a corrección.",
      href: "/operacion/validacion-diagnosticos",
    };
  }

  if (!params.assignedUserId && ["EN_ESPERA", "EN_DIAGNOSTICO"].includes(params.status)) {
    return {
      message: "Sin responsable técnico — asignar desde panel técnico o supervisor.",
      href: "/paneles/tecnico",
    };
  }

  if (params.status === "VALIDADO") {
    const [q] = await db
      .select({ id: quotes.id, folioNumber: quotes.folioNumber, status: quotes.status })
      .from(quotes)
      .where(eq(quotes.diagnosticId, params.diagnosticId))
      .limit(1);
    if (q?.status === "PENDIENTE_COTIZAR") {
      return {
        message: `CEO/Admin: fijar precio (${formatQuoteFolio(q.folioNumber)}).`,
        href: `/comercial/cotizaciones/${q.id}`,
      };
    }
    if (q?.status === "PENDIENTE_DECISION") {
      return {
        message: "Vendedor: seguimiento y decisión comercial.",
        href: `/comercial/cotizaciones/${q.id}`,
      };
    }
    if (q?.status === "AUTORIZADA") {
      return {
        message: "Cotización autorizada — continuar con OS de reparación.",
        href: `/comercial/cotizaciones/${q.id}`,
      };
    }
    return {
      message: "Diagnóstico validado — debe aparecer en Pendientes de cotizar.",
      href: "/comercial/cotizaciones?vista=pendientes-cotizar",
    };
  }

  if (params.status === "DEVUELTO_CORRECCION") {
    return {
      message: "Técnico debe corregir y terminar de nuevo.",
      href: "/paneles/tecnico",
    };
  }

  return {
    message: "Ejecutar diagnóstico, bitácora y terminar con resultado técnico.",
    href: "/paneles/tecnico",
  };
}
