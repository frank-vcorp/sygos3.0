"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { inventoryParts } from "@/db/schema";

type PartRow = typeof inventoryParts.$inferSelect;

export function InventoryPanel({ initialParts }: { initialParts: PartRow[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<
    { partNumber: string; currentQty: number; countedQty: number; delta: number; status: string }[]
  >([]);

  async function addPart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/assets/inventory/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partNumber: String(fd.get("partNumber")),
        description: String(fd.get("description")),
        minQty: fd.get("minQty") ? Number(fd.get("minQty")) : null,
        maxQty: fd.get("maxQty") ? Number(fd.get("maxQty")) : null,
      }),
    });
    if (!res.ok) {
      setMessage("No se pudo crear la refacción.");
      return;
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  async function adjust(partId: string, delta: number) {
    const res = await fetch(`/api/assets/inventory/parts/${partId}/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: delta > 0 ? "RECEIPT" : "ISSUE", quantityDelta: delta }),
    });
    if (!res.ok) setMessage("Ajuste no aplicado.");
    else router.refresh();
  }

  async function runImport(action: "preview" | "apply") {
    const raw = (document.getElementById("import-csv") as HTMLTextAreaElement).value;
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [partNumber, qty] = line.split(/[,;\t]/);
        return { partNumber: partNumber.trim(), countedQty: Number(qty) };
      })
      .filter((l) => l.partNumber && Number.isFinite(l.countedQty));
    const res = await fetch("/api/assets/inventory/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, lines }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage("Importación fallida.");
      return;
    }
    if (action === "preview") setPreview(data.preview ?? []);
    else {
      setMessage("Importación aplicada.");
      setPreview([]);
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      {message && <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm">{message}</p>}
      <form onSubmit={addPart} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
        <input name="partNumber" required placeholder="Número de parte" className="rounded-lg border px-3 py-2 text-sm" />
        <input name="description" required placeholder="Descripción" className="rounded-lg border px-3 py-2 text-sm sm:col-span-2" />
        <input name="minQty" type="number" min={0} placeholder="Mín (info)" className="rounded-lg border px-3 py-2 text-sm" />
        <input name="maxQty" type="number" min={0} placeholder="Máx (info)" className="rounded-lg border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-sygos-navy px-3 py-2 text-sm text-white sm:col-span-2">
          Agregar refacción
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Parte</th>
              <th className="px-4 py-3 text-left">Existencia</th>
              <th className="px-4 py-3 text-left">Mín / Máx</th>
              <th className="px-4 py-3 text-left">Ajuste rápido</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {initialParts.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{p.partNumber}</p>
                  <p className="text-xs text-slate-500">{p.description}</p>
                </td>
                <td className="px-4 py-3">{p.quantityOnHand}</td>
                <td className="px-4 py-3">
                  {p.minQty ?? "—"} / {p.maxQty ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <button type="button" className="mr-2 text-sky-800" onClick={() => adjust(p.id, 1)}>
                    +1
                  </button>
                  <button type="button" className="text-sky-800" onClick={() => adjust(p.id, -1)}>
                    -1
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold">Inventario físico (CSV: parte,cantidad)</h2>
        <textarea id="import-csv" rows={4} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm font-mono" />
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => runImport("preview")} className="rounded-lg border px-3 py-2 text-sm">
            Previsualizar
          </button>
          <button type="button" onClick={() => runImport("apply")} className="rounded-lg bg-sygos-navy px-3 py-2 text-sm text-white">
            Aplicar diferencias
          </button>
        </div>
        {preview.length > 0 && (
          <ul className="mt-3 max-h-48 overflow-auto text-xs text-slate-600">
            {preview.map((row) => (
              <li key={row.partNumber}>
                {row.partNumber}: {row.currentQty} → {row.countedQty} ({row.status})
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
