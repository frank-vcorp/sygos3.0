"use client";

import { useRouter } from "next/navigation";

export function ManualMovementForm(props: {
  accounts: { id: string; name: string }[];
}) {
  const router = useRouter();
  return (
    <form
      className="space-y-3 rounded-xl border bg-white p-4 text-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await fetch("/api/finance/movements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: fd.get("kind"),
            accountId: fd.get("accountId"),
            counterAccountId: fd.get("counterAccountId") || undefined,
            amountMxn: Number(fd.get("amountMxn")),
            description: fd.get("description"),
            category: fd.get("category") || undefined,
            pendingVerification: fd.get("pendingVerification") === "on",
          }),
        });
        router.refresh();
      }}
    >
      <h2 className="font-semibold">Movimiento manual</h2>
      <select name="kind" className="w-full rounded-lg border px-3 py-2">
        <option value="INGRESO">Ingreso</option>
        <option value="EGRESO">Egreso</option>
        <option value="TRANSFERENCIA">Transferencia</option>
      </select>
      <select name="accountId" className="w-full rounded-lg border px-3 py-2">
        {props.accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <select name="counterAccountId" className="w-full rounded-lg border px-3 py-2">
        <option value="">Contrapartida (solo transferencia)</option>
        {props.accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <input name="amountMxn" type="number" min={1} required placeholder="Importe" className="w-full rounded-lg border px-3 py-2" />
      <input name="category" placeholder="Categoría" className="w-full rounded-lg border px-3 py-2" />
      <input name="description" required placeholder="Descripción" className="w-full rounded-lg border px-3 py-2" />
      <label className="flex items-center gap-2 text-xs">
        <input name="pendingVerification" type="checkbox" />
        Pendiente de comprobación (Servomotores)
      </label>
      <button type="submit" className="rounded-lg bg-sygos-navy px-4 py-2 text-white">
        Registrar
      </button>
    </form>
  );
}

export function PayApForm(props: {
  apId: string;
  maxMxn: number;
  accounts: { id: string; name: string }[];
}) {
  const router = useRouter();
  return (
    <form
      className="mt-2 flex flex-wrap gap-2 text-xs"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await fetch(`/api/finance/ap/${props.apId}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amountMxn: Number(fd.get("amountMxn")),
            accountId: fd.get("accountId"),
          }),
        });
        router.refresh();
      }}
    >
      <input name="amountMxn" type="number" min={1} max={props.maxMxn} defaultValue={props.maxMxn} className="w-24 rounded border px-2 py-1" />
      <select name="accountId" className="rounded border px-2 py-1">
        {props.accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <button type="submit" className="rounded bg-sygos-teal px-2 py-1 text-white">
        Pagar CxP
      </button>
    </form>
  );
}
