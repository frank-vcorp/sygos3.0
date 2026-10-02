"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ClientOption = { id: string; legalName: string };

export function AttentionCreateForm({
  clients,
  equiOptions,
  motorOptions,
}: {
  clients: ClientOption[];
  equiOptions: { id: string; label: string }[];
  motorOptions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [assetKind, setAssetKind] = useState<"equi" | "motor">(
    equiOptions.length > 0 ? "equi" : "motor",
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/ops/attentions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: String(fd.get("clientId")),
        equiId: assetKind === "equi" ? String(fd.get("assetId")) : undefined,
        motorId: assetKind === "motor" ? String(fd.get("assetId")) : undefined,
        attentionType: String(fd.get("attentionType")),
        reportedFailure: String(fd.get("reportedFailure")),
        priorityCode: String(fd.get("priorityCode")),
        warrantySourceWorkOrderId:
          String(fd.get("warrantySourceWorkOrderId") || "") || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo crear.");
      return;
    }
    if (data.diagnostic?.id) {
      router.push(`/operacion/diagnosticos/${data.diagnostic.id}`);
    } else if (data.workOrder?.id) {
      router.push(`/operacion/os/${data.workOrder.id}`);
    }
    router.refresh();
  }

  const options = assetKind === "equi" ? equiOptions : motorOptions;

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <label className="block text-sm">
        Cliente *
        <select name="clientId" required className="mt-1 w-full rounded-lg border px-3 py-2">
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.legalName}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-4 text-sm">
        {equiOptions.length > 0 && (
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={assetKind === "equi"}
              onChange={() => setAssetKind("equi")}
            />
            EQUI
          </label>
        )}
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={assetKind === "motor"}
            onChange={() => setAssetKind("motor")}
          />
          MOT
        </label>
      </div>
      <label className="block text-sm">
        Equipo *
        <select name="assetId" required className="mt-1 w-full rounded-lg border px-3 py-2">
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Tipo de atención *
        <select name="attentionType" required className="mt-1 w-full rounded-lg border px-3 py-2">
          <option value="DIAGNOSTICO">Diagnóstico</option>
          <option value="REPARACION">Reparación preautorizada</option>
          <option value="DIAGNOSTICO_GARANTIA">Diagnóstico de Garantía</option>
        </select>
      </label>
      <label className="block text-sm">
        Prioridad *
        <select name="priorityCode" required className="mt-1 w-full rounded-lg border px-3 py-2">
          <option value="NORMAL">Normal</option>
          <option value="ALTA">Alta</option>
          <option value="EXPRESS">Exprés</option>
        </select>
      </label>
      <label className="block text-sm">
        Falla reportada *
        <textarea name="reportedFailure" required rows={3} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <input
        name="warrantySourceWorkOrderId"
        placeholder="UUID OS reparación original (garantía)"
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />
      <button type="submit" className="rounded-lg bg-sygos-navy px-4 py-2 text-sm font-medium text-white">
        Crear atención
      </button>
    </form>
  );
}

export function DiagnosticActionsPanel({
  diagnosticId,
  status,
  readOnly,
  equiId,
}: {
  diagnosticId: string;
  status: string;
  readOnly?: boolean;
  equiId?: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [bitacora, setBitacora] = useState("");

  async function patch(body: Record<string, unknown>) {
    setMessage(null);
    const res = await fetch(`/api/ops/diagnostics/${diagnosticId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setMessage("Acción no permitida.");
      return;
    }
    router.refresh();
  }

  async function addBitacora(e: React.FormEvent) {
    e.preventDefault();
    if (!bitacora.trim()) return;
    const res = await fetch(`/api/ops/diagnostics/${diagnosticId}/bitacora`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: bitacora }),
    });
    if (!res.ok) {
      setMessage("No se pudo agregar bitácora.");
      return;
    }
    setBitacora("");
    router.refresh();
  }

  if (readOnly) {
    return (
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
        Vista SYSTRON: diagnóstico ejecutado en Servomotores (solo lectura).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {message && <p className="text-sm text-red-700">{message}</p>}
      <div className="flex flex-wrap gap-2">
        {status === "EN_ESPERA" && (
          <button
            type="button"
            className="rounded-lg border px-3 py-2 text-sm"
            onClick={() => patch({ status: "EN_DIAGNOSTICO" })}
          >
            Iniciar diagnóstico
          </button>
        )}
        {status === "EN_DIAGNOSTICO" || status === "DEVUELTO_CORRECCION" ? (
          <>
            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-sm"
              onClick={() =>
                patch({
                  status: "DIAGNOSTICO_TERMINADO",
                  technicalResult: "Terminado (actualizar en detalle)",
                })
              }
            >
              Marcar terminado
            </button>
          </>
        ) : null}
        {status === "PENDIENTE_VALIDACION_GERENTE" && (
          <>
            <button
              type="button"
              className="rounded-lg bg-sygos-navy px-3 py-2 text-sm text-white"
              onClick={() => patch({ status: "VALIDADO" })}
            >
              Validar (Gerente)
            </button>
            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-sm"
              onClick={() =>
                patch({
                  status: "DEVUELTO_CORRECCION",
                  validationReturnReason: "Corregir según instrucción",
                })
              }
            >
              Devolver a corrección
            </button>
          </>
        )}
      </div>
      <form onSubmit={addBitacora} className="rounded-xl border bg-white p-4 space-y-2">
        <h3 className="text-sm font-semibold">Bitácora técnica</h3>
        <textarea
          value={bitacora}
          onChange={(e) => setBitacora(e.target.value)}
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Entrada inmutable…"
        />
        <button type="submit" className="rounded-lg border px-3 py-2 text-sm">
          Agregar entrada
        </button>
      </form>
      {equiId && (
        <p className="text-xs text-slate-500">
          Servicio externo: usar API con proveedor desde detalle (Fase 3) o registrar salida manual en Almacén.
        </p>
      )}
    </div>
  );
}
