import type { JourneyHint } from "@/server/journey/types";

export function getFiscalDocumentJourneyHint(params: {
  status: string;
  docKind: string;
}): JourneyHint | null {
  if (params.status === "SOLICITUD_PENDIENTE" || params.status === "PENDIENTE_EMISION") {
    return {
      message: "Coordinación: emitir documento fiscal o remisión.",
      href: "/administracion/facturacion/pendientes",
    };
  }
  if (params.status === "EMITIDA") {
    return {
      message: "Documento emitido — cobranza / pagos del cliente.",
      href: "/administracion/cobranza",
    };
  }
  if (params.status === "ERROR_FISCAL") {
    return {
      message: "Reintentar emisión fiscal sin duplicar.",
      href: "/administracion/facturacion/pendientes",
    };
  }
  return null;
}

export function getReceivableJourneyHint(params: {
  balanceMxn: number;
  isOverdue: boolean;
  fiscalDocumentId: string;
}): JourneyHint | null {
  if (params.balanceMxn <= 0) {
    return { message: "CxC saldada.", href: null };
  }
  if (params.isOverdue) {
    return {
      message: "Saldo vencido — cobranza activa y/o registrar pago validado.",
      href: "/administracion/pagos",
    };
  }
  return {
    message: "Saldo abierto — registrar pago (vendedor) y validar (Coordinación).",
    href: "/administracion/pagos",
  };
}

export function getPaymentJourneyHint(params: {
  status: string;
}): JourneyHint | null {
  if (params.status === "PENDIENTE_VALIDACION") {
    return {
      message: "Coordinación: validar pago para impactar CxC.",
      href: "/paneles/coordinacion",
    };
  }
  return {
    message: "Pago validado — saldo CxC actualizado.",
    href: "/administracion/cobranza",
  };
}
