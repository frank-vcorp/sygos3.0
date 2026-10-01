"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Wo = { id: string; folio: string; status: string };

export function RefaccionesPanel({ workOrders }: { workOrders: Wo[] }) {
  const router = useRouter();
  const [selectedWo, setSelectedWo] = useState(workOrders[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);

  async function createWo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/assets/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        equiId: String(fd.get("equiId") || "") || undefined,
        motorId: String(fd.get("motorId") || "") || undefined,
        summary: String(fd.get("summary") || "") || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error ?? "No se creó la OS.");
      return;
    }
    setSelectedWo(data.workOrder.id);
    router.refresh();
  }

  async function requestPart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedWo) return;
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/assets/work-orders/${selectedWo}/spare-parts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partNumber: String(fd.get("partNumber")),
        description: String(fd.get("description")),
        quantityRequested: Number(fd.get("quantityRequested")),
        linkUrl: String(fd.get("linkUrl") || "") || undefined,
      }),
    });
    if (!res.ok) setMessage("No se registró la solicitud.");
    else {
      setMessage("Solicitud registrada.");
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <div className="space-y-6">
      {message && <p className="text-sm text-sky-800">{message}</p>}
      <form onSubmit={createWo} className="rounded-xl border bg-white p-4 space-y-2">
        <h2 className="text-sm font-semibold">Nueva OS (placeholder Fase 2)</h2>
        <input name="equiId" placeholder="UUID EQUI (opcional)" className="w-full rounded-lg border px-3 py-2 text-sm" />
        <input name="motorId" placeholder="UUID MOT (opcional)" className="w-full rounded-lg border px-3 py-2 text-sm" />
        <input name="summary" placeholder="Resumen" className="w-full rounded-lg border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-sygos-navy px-3 py-2 text-sm text-white">
          Crear OS
        </button>
      </form>

      <label className="block text-sm">
        OS activa
        <select
          value={selectedWo}
          onChange={(e) => setSelectedWo(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        >
          {workOrders.map((w) => (
            <option key={w.id} value={w.id}>
              {w.folio} ({w.status})
            </option>
          ))}
        </select>
      </label>

      <form onSubmit={requestPart} className="rounded-xl border bg-white p-4 space-y-2">
        <h2 className="text-sm font-semibold">Solicitar refacción</h2>
        <input name="partNumber" required placeholder="Número de parte" className="w-full rounded-lg border px-3 py-2 text-sm" />
        <input name="description" required placeholder="Descripción" className="w-full rounded-lg border px-3 py-2 text-sm" />
        <input name="quantityRequested" type="number" min={1} defaultValue={1} className="w-full rounded-lg border px-3 py-2 text-sm" />
        <input name="linkUrl" placeholder="Link (opcional)" className="w-full rounded-lg border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg border px-3 py-2 text-sm font-medium">
          Solicitar
        </button>
      </form>
    </div>
  );
}
