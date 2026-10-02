import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { quotes, sparePartRequests, workOrders } from "@/db/schema";
import type { JourneyHint } from "@/server/journey/types";
import { formatQuoteFolio } from "@/server/masters/folios";

export async function getWorkOrderJourneyHint(params: {
  workOrderId: string;
  companyId: string;
  repairStatus: string;
}): Promise<JourneyHint | null> {
  const db = getDb();

  const requests = await db
    .select()
    .from(sparePartRequests)
    .where(eq(sparePartRequests.workOrderId, params.workOrderId));

  const pendingParts = requests.filter((r) => r.status !== "SURTIDA");
  if (params.repairStatus === "EN_ESPERA_REFACCIONES" || pendingParts.length > 0) {
    return {
      message: "Surtir refacciones en Almacén/Inventario para continuar reparación.",
      href: "/operacion/refacciones",
    };
  }

  if (["EN_ESPERA", "EN_REPARACION"].includes(params.repairStatus)) {
    return {
      message: "Técnico: ejecutar reparación, bitácora y solicitar refacciones si aplica.",
      href: "/paneles/tecnico",
    };
  }

  if (params.repairStatus === "REPARACION_TERMINADA") {
    const [q] = await db
      .select({ id: quotes.id, folioNumber: quotes.folioNumber, status: quotes.status })
      .from(quotes)
      .where(eq(quotes.workOrderId, params.workOrderId))
      .limit(1);
    if (q?.status === "PENDIENTE_COTIZAR") {
      return {
        message: `CEO/Admin: precio de reparación (${formatQuoteFolio(q.folioNumber)}).`,
        href: `/comercial/cotizaciones/${q.id}`,
      };
    }
    return {
      message: "Reparación terminada — debe generarse pendiente de cotizar (CEO).",
      href: "/comercial/pendientes-cotizar",
    };
  }

  if (params.repairStatus === "SIN_REPARACION") {
    return {
      message: "Cierre técnico sin reparación — revisar salida comercial/física.",
      href: "/activos/almacen",
    };
  }

  return null;
}
