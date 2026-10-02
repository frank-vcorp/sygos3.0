"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function IntercompanyPaymentForm(props: {
  apEntryId: string;
  linkedArEntryId: string;
  supplierId: string;
  maxMxn: number;
}) {
  const router = useRouter();
  const [amountMxn, setAmountMxn] = useState(String(props.maxMxn));
  const [destination, setDestination] = useState<"BANCO" | "EFECTIVO" | "TARJETA">(
    "BANCO",
  );
  const [receiptReference, setReceiptReference] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/billing/intercompany/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apEntryId: props.apEntryId,
        linkedArEntryId: props.linkedArEntryId,
        supplierId: props.supplierId,
        amountMxn: Number.parseInt(amountMxn, 10),
        destination,
        receiptReference,
      }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-wrap items-end gap-2 text-xs">
      <input
        type="number"
        min={1}
        max={props.maxMxn}
        className="w-24 rounded border px-2 py-1"
        value={amountMxn}
        onChange={(e) => setAmountMxn(e.target.value)}
      />
      <select
        className="rounded border px-2 py-1"
        value={destination}
        onChange={(e) =>
          setDestination(e.target.value as "BANCO" | "EFECTIVO" | "TARJETA")
        }
      >
        <option value="BANCO">Banco</option>
        <option value="EFECTIVO">Efectivo</option>
        <option value="TARJETA">Tarjeta</option>
      </select>
      <input
        required
        placeholder="Comprobante"
        className="min-w-[8rem] flex-1 rounded border px-2 py-1"
        value={receiptReference}
        onChange={(e) => setReceiptReference(e.target.value)}
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-sygos-teal px-2 py-1 text-white disabled:opacity-60"
      >
        Pago intercompañía
      </button>
    </form>
  );
}
