import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function FacturacionPendientesRedirect() {
  redirect("/administracion/facturacion?vista=pendientes");
}
