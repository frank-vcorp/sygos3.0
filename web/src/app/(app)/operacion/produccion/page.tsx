"use client";

import { useEffect, useState } from "react";

type Entry = { id: string; workOrderFolio: string; hoursTenths: number; note: string | null };

export default function ProduccionPage() {
  const [entries, setEntries] = useState<Entry[]>([]);

  async function refresh() {
    const res = await fetch("/api/ops/production");
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Producción técnica</h1>
      <form
        className="flex flex-wrap gap-2 rounded-xl border bg-white p-4 text-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          await fetch("/api/ops/production", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workOrderId: fd.get("workOrderId"),
              hoursTenths: Number(fd.get("hoursTenths")),
              note: fd.get("note") || undefined,
            }),
          });
          e.currentTarget.reset();
          await refresh();
        }}
      >
        <input name="workOrderId" required placeholder="Folio OS (ej. OS-12)" className="min-w-[16rem] flex-1 rounded border px-2 py-1" />
        <input name="hoursTenths" type="number" min={1} placeholder="Horas x10" className="w-28 rounded border px-2 py-1" />
        <input name="note" placeholder="Nota" className="min-w-[8rem] flex-1 rounded border px-2 py-1" />
        <button type="submit" className="rounded bg-sygos-navy px-3 py-1 text-white">
          Registrar
        </button>
      </form>
      <ul className="divide-y rounded-xl border bg-white text-sm">
        {entries.map((e) => (
          <li key={e.id} className="px-4 py-3">
            {e.workOrderFolio} · {(e.hoursTenths / 10).toFixed(1)} h {e.note ? `· ${e.note}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
