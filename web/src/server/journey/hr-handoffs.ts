import type { JourneyHint } from "@/server/journey/types";

export function getVacationJourneyHint(status: string): JourneyHint | null {
  if (status === "PENDIENTE_CEO") {
    return {
      message: "CEO/Administrador: autorizar o rechazar vacaciones.",
      href: "/paneles/ceo",
    };
  }
  if (status === "AUTORIZADA") {
    return { message: "Vacación autorizada — reflejada en asistencia/nómina.", href: null };
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

export function getPayrollRunJourneyHint(status: string): JourneyHint | null {
  if (status === "BORRADOR") {
    return {
      message: "RH/Coordinación: revisar preliminar y enviar a autorización.",
      href: "/paneles/coordinacion",
    };
  }
  if (status === "PENDIENTE_AUTORIZACION") {
    return {
      message: "CEO/Administrador: autorizar nómina.",
      href: "/paneles/ceo",
    };
  }
  if (status === "AUTORIZADA") {
    return {
      message: "Nómina autorizada — timbrado/recibos.",
      href: "/capital-humano/nomina",
    };
  }
  return null;
}
