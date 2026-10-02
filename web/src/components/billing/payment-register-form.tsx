"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ClientOption = { id: string; legalName: string };
type ArOption = {
  arId: string;
  clientId: string;
  clientName: string;
  balanceMxn: number;
  fiscalFolio: number;
};

export function PaymentRegisterForm(props: {
  clients: ClientOption[];
  receivables: ArOption[];
  isVendor: boolean;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(props.clients[0]?.id ?? "");
  const [arEntryId, setArEntryId] = useState("");
  const [amountMxn, setAmountMxn] = useState("");
  const [destination, setDestination] = useState<"BANCO" | "EFECTIVO" | "TARJETA">(
    "BANCO",
  );
  const [receiptReference, setReceiptReference] = useState("");
  const [receivedByVendor, setReceivedByVendor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const openForClient = useMemo(
    () =>
      props.receivables.filter(
        (r) => r.clientId === clientId && r.balanceMxn > 0,
      ),
    [props.receivables, clientId],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const amount = Number.parseInt(amountMxn, 10);
    const allocations =
      arEntryId ?
        [{ arEntryId, amountMxn: amount }]
      : [];
    const res = await fetch("/api/billing/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: clientId || undefined,
        amountMxn: amount,
        destination,
        receiptReference,
        receivedByVendor: props.isVendor ? receivedByVendor : false,
        allocations,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("No se pudo registrar el pago. Verifica importe y comprobante.");
      return;
    }
    setAmountMxn("");
    setReceiptReference("");
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm"
    >
      <h2 className="font-semibold">Registrar pago</h2>
      <label className="block">
        Cliente
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            setArEntryId("");
          }}
        >
          {props.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.legalName}
            </option>
          ))}
        </select>
      </label>
      {openForClient.length > 0 && (
        <label className="block">
          Aplicar a CxC (opcional)
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={arEntryId}
            onChange={(e) => setArEntryId(e.target.value)}
          >
            <option value="">Sin aplicar aún</option>
            {openForClient.map((r) => (
              <option key={r.arId} value={r.arId}>
                FAC-{r.fiscalFolio} · saldo {r.balanceMxn} MXN
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="block">
        Importe (MXN)
        <input
          type="number"
          min={1}
          required
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={amountMxn}
          onChange={(e) => setAmountMxn(e.target.value)}
        />
      </label>
      <label className="block">
        Destino
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={destination}
          onChange={(e) =>
            setDestination(e.target.value as "BANCO" | "EFECTIVO" | "TARJETA")
          }
        >
          <option value="BANCO">Banco</option>
          <option value="EFECTIVO">Efectivo</option>
          <option value="TARJETA">Tarjeta</option>
        </select>
      </label>
      <label className="block">
        Comprobante / referencia
        <input
          required
          minLength={3}
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={receiptReference}
          onChange={(e) => setReceiptReference(e.target.value)}
        />
      </label>
      {props.isVendor && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={receivedByVendor}
            onChange={(e) => setReceivedByVendor(e.target.checked)}
          />
          Recibido por vendedor (pendiente de entrega a Coordinación)
        </label>
      )}
      {error && <p className="text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-sygos-navy px-4 py-2 text-white disabled:opacity-60"
      >
        Guardar pago
      </button>
    </form>
  );
}
