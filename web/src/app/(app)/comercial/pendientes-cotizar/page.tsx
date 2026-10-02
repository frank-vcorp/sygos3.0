import { redirect } from "next/navigation";

/** Bandeja unificada — vista dentro del módulo Cotizaciones (discovery §3.3). */
export default function PendientesCotizarRedirect() {
  redirect("/comercial/cotizaciones?vista=pendientes-cotizar");
}
