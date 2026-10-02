"use client";

import { useRouter } from "next/navigation";

export function WarrantyGerenteActions(props: {
  diagnosticId: string;
  status: string;
  attentionType?: string;
}) {
  const router = useRouter();
  if (props.attentionType !== "DIAGNOSTICO_GARANTIA") return null;
  if (props.status !== "PENDIENTE_VALIDACION_GERENTE") return null;

  async function decide(decision: "GARANTIA_VALIDA" | "GARANTIA_NO_PROCEDENTE") {
    await fetch(`/api/ops/diagnostics/${props.diagnosticId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "VALIDADO",
        warrantyDecision: decision,
      }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
      <span className="w-full font-medium">Decisión de garantía (Gerente)</span>
      <button
        type="button"
        className="rounded bg-emerald-700 px-3 py-1 text-white"
        onClick={() => decide("GARANTIA_VALIDA")}
      >
        Garantía válida
      </button>
      <button
        type="button"
        className="rounded bg-slate-700 px-3 py-1 text-white"
        onClick={() => decide("GARANTIA_NO_PROCEDENTE")}
      >
        No procedente
      </button>
    </div>
  );
}

export function WarrantyCeoCommercialButton(props: {
  diagnosticId: string;
  attentionType?: string;
  warrantyDecision?: string | null;
  commercialOverride?: boolean;
  actorCanCeo: boolean;
}) {
  const router = useRouter();
  if (!props.actorCanCeo) return null;
  if (props.attentionType !== "DIAGNOSTICO_GARANTIA") return null;
  if (props.warrantyDecision !== "GARANTIA_NO_PROCEDENTE") return null;
  if (props.commercialOverride) return null;

  return (
    <button
      type="button"
      className="rounded-lg bg-sygos-navy px-3 py-2 text-sm text-white"
      onClick={async () => {
        if (
          !confirm(
            "Aceptar comercialmente como garantía válida. La decisión técnica original se conserva en historial.",
          )
        ) {
          return;
        }
        await fetch(
          `/api/ops/diagnostics/${props.diagnosticId}/warranty-commercial`,
          { method: "POST" },
        );
        router.refresh();
      }}
    >
      CEO: aceptar comercialmente garantía
    </button>
  );
}
