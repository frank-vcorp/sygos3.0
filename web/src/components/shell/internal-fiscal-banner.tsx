import { Server } from "lucide-react";

export function InternalFiscalBanner() {
  return (
    <div className="flex items-start gap-2 border-b border-violet-300 bg-violet-100 px-4 py-2.5 text-sm font-medium text-violet-950 lg:px-6">
      <Server className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        UAT staging — Operación interna sin integraciones externas. Facturas y
        recibos de nómina se registran en SYGOS con folio interno;{" "}
        <strong>no hay timbrado SAT</strong> ni envíos reales (correo/WhatsApp).
        Desactiva Modo de Pruebas salvo que quieras simular por usuario.
      </p>
    </div>
  );
}
