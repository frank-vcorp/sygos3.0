import Link from "next/link";
import { AlertTriangle, Info } from "lucide-react";
type ContextBannersProps = {
  activeCompany: string;
  missingIntegrations?: string[];
};

export function ContextBanners({
  activeCompany,
  missingIntegrations = ["Facturapi", "SendGrid", "WhatsApp"],
}: ContextBannersProps) {
  return (
    <div className="space-y-0 border-b border-slate-200">
      <div className="flex items-start gap-2 bg-sky-50 px-4 py-2.5 text-sm text-sky-900 lg:px-6">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <p>
          Trabajando en <strong>{activeCompany}</strong> · Todas las operaciones
          pertenecen a esta empresa.
        </p>
      </div>
      {missingIntegrations.length > 0 && (
        <div className="flex flex-wrap items-start gap-2 bg-amber-50 px-4 py-2.5 text-sm text-amber-950 lg:px-6">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            Integraciones sin configurar en esta empresa:{" "}
            <strong>{missingIntegrations.join(", ")}</strong>.{" "}
            <Link
              href="/configuracion/integraciones"
              className="font-medium underline underline-offset-2"
            >
              Revisar integraciones
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
