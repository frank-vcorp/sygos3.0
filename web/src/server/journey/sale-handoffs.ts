import type { JourneyHint } from "@/server/journey/types";

export function getEquipmentSaleJourneyHint(params: {
  status: string;
  hasPendingDelivery: boolean;
  hasPendingReceive: boolean;
}): JourneyHint | null {
  if (params.hasPendingReceive) {
    return {
      message: "Almacén/compras: recibir mercancía contra líneas de venta.",
      href: "/comercial/ventas",
    };
  }
  if (params.hasPendingDelivery) {
    return {
      message: "Material listo — registrar entrega parcial/total al cliente.",
      href: "/comercial/panel",
    };
  }
  if (params.status === "ABIERTA" || params.status === "PARCIAL") {
    return {
      message: "Venta abierta — facturación/remisión cuando corresponda.",
      href: "/administracion/facturacion",
    };
  }
  return {
    message: "Venta cerrada.",
    href: null,
  };
}
