"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CollectionLogForm(props: { arEntryId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/billing/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ arEntryId: props.arEntryId, note }),
    });
    setNote("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        placeholder="Nota de cobranza / promesa"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        required
      />
      <button type="submit" className="rounded-lg bg-sygos-navy px-3 py-2 text-sm text-white">
        Guardar
      </button>
    </form>
  );
}
