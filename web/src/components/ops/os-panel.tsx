"use client";

import { useRouter } from "next/navigation";

export function OsActionsPanel({
  workOrderId,
  repairStatus,
}: {
  workOrderId: string;
  repairStatus: string;
}) {
  const router = useRouter();

  async function patch(repairStatus: string) {
    await fetch(`/api/ops/work-orders/${workOrderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repairStatus }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {repairStatus === "EN_ESPERA" && (
        <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => patch("EN_REPARACION")}>
          Iniciar reparación
        </button>
      )}
      {repairStatus === "EN_REPARACION" && (
        <>
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => patch("EN_ESPERA_REFACCIONES")}>
            En espera refacciones
          </button>
          <button type="button" className="rounded-lg bg-sygos-navy px-3 py-2 text-sm text-white" onClick={() => patch("REPARACION_TERMINADA")}>
            Reparación terminada
          </button>
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => patch("SIN_REPARACION")}>
            Sin reparación
          </button>
        </>
      )}
      {repairStatus === "EN_ESPERA_REFACCIONES" && (
        <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => patch("EN_REPARACION")}>
          Reanudar reparación
        </button>
      )}
      {repairStatus === "REPARACION_TERMINADA" && (
        <p className="text-sm text-emerald-800">
          Pendiente de cotizar precio —{" "}
          <a href="/comercial/pendientes-cotizar" className="underline">
            bandeja comercial
          </a>
          .
        </p>
      )}
    </div>
  );
}
