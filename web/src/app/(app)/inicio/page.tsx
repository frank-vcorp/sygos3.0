import Image from "next/image";
import { RefreshCw } from "lucide-react";

export default function InicioPage() {
  return (
    <div className="relative flex min-h-[420px] items-center justify-center">
      <Image
        src="/brand/sygos-logo.png"
        alt=""
        width={320}
        height={Math.round((320 * 793) / 1983)}
        className="pointer-events-none absolute bottom-4 right-4 opacity-[0.06]"
        aria-hidden
      />
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-red-600/90">⚠</p>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">
          No pudimos cargar esta vista
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          La operación no se completó. Puedes reintentar sin perder el contexto
          actual.
        </p>
        <button
          type="button"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-sygos-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-sygos-navy-sidebar"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
        <p className="mt-6 text-xs text-slate-400">
          Scaffolding Fase 1: el panel por rol se conectará cuando existan datos
          y API.
        </p>
      </div>
    </div>
  );
}
