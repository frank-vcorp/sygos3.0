import type { JourneyHint } from "@/server/journey/types";

export function getPurchaseOrderJourneyHint(params: {
  status: string;
}): JourneyHint | null {
  if (params.status === "PENDIENTE_AUTORIZACION") {
    return {
      message: "CEO debe autorizar la Orden de Compra.",
      href: "/paneles/ceo",
    };
  }
  if (params.status === "PENDIENTE_PROCESAR" || params.status === "AUTORIZADA") {
    return {
      message: "Coordinación: procesar O.C. → egreso o CxP (1:1).",
      href: "/paneles/coordinacion",
    };
  }
  if (params.status === "PROCESADA") {
    return {
      message: "O.C. procesada — revisar egreso/CxP relacionado.",
      href: "/administracion/cxp",
    };
  }
  return null;
}

export function getDirectPurchaseJourneyHint(params: {
  status: string;
}): JourneyHint | null {
  if (params.status === "PENDIENTE_VALIDAR") {
    return {
      message: "Coordinación debe validar la compra directa.",
      href: "/paneles/coordinacion",
    };
  }
  if (params.status === "VALIDADA") {
    return {
      message: "Compra validada — egreso/CxP según reglas.",
      href: "/administracion/finanzas",
    };
  }
  return null;
}
