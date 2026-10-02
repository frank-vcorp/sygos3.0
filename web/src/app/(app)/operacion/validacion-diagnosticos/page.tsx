import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Bandeja unificada dentro del módulo Diagnósticos (discovery §4.3). */
export default function ValidacionDiagnosticosRedirect() {
  redirect("/operacion/diagnosticos?vista=validacion");
}
