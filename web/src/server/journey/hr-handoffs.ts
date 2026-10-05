import type { JourneyHint } from "@/server/journey/types";

export function getVacationJourneyHint(status: string): JourneyHint | null {
  if (status === "PENDIENTE") {
    return {
      message: "CEO/Administrador: autorizar o rechazar vacaciones.",
      href: "/capital-humano/vacaciones?vista=pendientes",
    };
  }
  if (status === "AUTORIZADA") {
    return { message: "Vacación autorizada — reflejada en asistencia/nómina.", href: null };
  }
  if (status === "RECHAZADA") {
    return { message: "Solicitud rechazada — solo consulta histórica.", href: null };
  }
  return {
    message: "Jefe directo registra solicitud de vacaciones.",
    href: "/capital-humano/vacaciones",
  };
}

export function getOvertimeJourneyHint(status: string): JourneyHint | null {
  if (status === "PENDIENTE_JEFE") {
    return {
      message: "Jefe directo: validar horas extra del colaborador.",
      href: "/capital-humano/mis-horas-extra",
    };
  }
  if (status === "PENDIENTE_CEO") {
    return {
      message: "CEO/Administrador: autorización final de horas extra.",
      href: "/paneles/ceo",
    };
  }
  if (status === "AUTORIZADA") {
    return { message: "Horas extra autorizadas — incluir en nómina.", href: "/capital-humano/nomina" };
  }
  return {
    message: "Colaborador captura en Mis horas extra.",
    href: "/capital-humano/mis-horas-extra",
  };
}

export function getPayrollRunJourneyHint(params: {
  status: string;
  fiscalStatus: string;
}): JourneyHint | null {
  if (params.status === "BORRADOR") {
    return {
      message: "RH/Coordinación: revisar borrador; CEO autoriza (no reabrir tras autorizada).",
      href: "/capital-humano/nomina",
    };
  }
  if (params.status === "AUTORIZADA" && params.fiscalStatus === "ERROR") {
    return {
      message: "Timbrado falló — reintentar sin duplicar corrida.",
      href: "/capital-humano/nomina",
    };
  }
  if (params.status === "AUTORIZADA") {
    return {
      message: "Nómina autorizada — recibos/timbrado según composición del colaborador.",
      href: "/capital-humano/nomina",
    };
  }
  if (params.status === "PAGADA") {
    return { message: "Nómina pagada/cerrada.", href: null };
  }
  return null;
}
