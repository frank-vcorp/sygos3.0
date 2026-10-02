import { FlaskConical } from "lucide-react";

export function TestModeBanner() {
  return (
    <div className="flex items-start gap-2 border-b border-amber-300 bg-amber-100 px-4 py-2.5 text-sm font-medium text-amber-950 lg:px-6">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        MODO DE PRUEBAS — Los cambios realizados en este contexto serán descartados
        y no afectan la operación real. Efectos externos (CFDI, correo, WhatsApp)
        se simulan como <strong>PRUEBA / SIN VALIDEZ</strong>.
      </p>
    </div>
  );
}
