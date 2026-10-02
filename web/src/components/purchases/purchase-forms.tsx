"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Supplier = { id: string; legalName: string };

export function DirectPurchaseForm(props: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/purchases/direct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId: fd.get("supplierId") || undefined,
        concept: fd.get("concept"),
        amountMxn: Number(fd.get("amountMxn")),
        paymentTerms: fd.get("paymentTerms"),
        destinationKind: fd.get("destinationKind"),
        shippingReference: fd.get("shippingReference") || undefined,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/operacion/compras/directas/${data.purchase.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-3 rounded-xl border bg-white p-4 text-sm">
      <label className="block">
        Proveedor
        <select name="supplierId" className="mt-1 w-full rounded-lg border px-3 py-2">
          <option value="">Por definir</option>
          {props.suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.legalName}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        Concepto
        <input name="concept" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block">
        Importe MXN
        <input name="amountMxn" type="number" min={1} required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block">
        Pago
        <select name="paymentTerms" className="mt-1 w-full rounded-lg border px-3 py-2">
          <option value="CONTADO">Contado</option>
          <option value="CREDITO">Crédito</option>
        </select>
      </label>
      <label className="block">
        Destino
        <select name="destinationKind" className="mt-1 w-full rounded-lg border px-3 py-2">
          <option value="OPERATIONAL">Gasto operativo</option>
          <option value="INVENTORY">Inventario</option>
          <option value="WORK_ORDER">OS</option>
          <option value="MOTOR">MOT</option>
        </select>
      </label>
      <input name="shippingReference" placeholder="Referencia envío (opcional)" className="w-full rounded-lg border px-3 py-2" />
      <button type="submit" disabled={loading} className="rounded-lg bg-sygos-navy px-4 py-2 text-white disabled:opacity-60">
        Registrar compra directa
      </button>
    </form>
  );
}

export function PurchaseOrderForm(props: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/purchases/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId: fd.get("supplierId") || undefined,
        concept: fd.get("concept"),
        authorizedAmountMxn: Number(fd.get("authorizedAmountMxn")),
        paymentTerms: fd.get("paymentTerms"),
        destinationKind: fd.get("destinationKind"),
      }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/operacion/oc/${data.order.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-3 rounded-xl border bg-white p-4 text-sm">
      <label className="block">
        Proveedor
        <select name="supplierId" className="mt-1 w-full rounded-lg border px-3 py-2">
          <option value="">Por definir</option>
          {props.suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.legalName}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        Concepto
        <input name="concept" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block">
        Importe autorizado MXN
        <input name="authorizedAmountMxn" type="number" min={1} required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block">
        Pago
        <select name="paymentTerms" className="mt-1 w-full rounded-lg border px-3 py-2">
          <option value="CONTADO">Contado</option>
          <option value="CREDITO">Crédito</option>
        </select>
      </label>
      <label className="block">
        Destino
        <select name="destinationKind" className="mt-1 w-full rounded-lg border px-3 py-2">
          <option value="OPERATIONAL">Gasto operativo</option>
          <option value="INVENTORY">Inventario</option>
          <option value="WORK_ORDER">OS</option>
          <option value="MOTOR">MOT</option>
        </select>
      </label>
      <button type="submit" disabled={loading} className="rounded-lg bg-sygos-navy px-4 py-2 text-white disabled:opacity-60">
        Crear O.C.
      </button>
    </form>
  );
}

export function PurchaseActionButton(props: {
  href: string;
  body: Record<string, unknown>;
  label: string;
  variant?: "danger" | "primary";
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={
        props.variant === "danger" ?
          "rounded-lg bg-red-700 px-3 py-2 text-xs text-white"
        : "rounded-lg bg-sygos-teal px-3 py-2 text-xs text-white"
      }
      onClick={async () => {
        await fetch(props.href, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(props.body),
        });
        router.refresh();
      }}
    >
      {props.label}
    </button>
  );
}

export function ProcessPurchaseForm(props: {
  href: string;
  accounts: { id: string; name: string }[];
  showAmount?: boolean;
  defaultAmount?: number;
}) {
  const router = useRouter();
  return (
    <form
      className="mt-3 flex flex-wrap gap-2 text-xs"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await fetch(props.href, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "process",
            accountId: fd.get("accountId"),
            actualAmountMxn: props.showAmount ?
              Number(fd.get("actualAmountMxn"))
            : props.defaultAmount,
          }),
        });
        router.refresh();
      }}
    >
      <select name="accountId" required className="rounded border px-2 py-1">
        {props.accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      {props.showAmount && (
        <input
          name="actualAmountMxn"
          type="number"
          min={1}
          defaultValue={props.defaultAmount}
          required
          className="w-28 rounded border px-2 py-1"
        />
      )}
      <button type="submit" className="rounded bg-sygos-navy px-2 py-1 text-white">
        Procesar (Egreso/CxP)
      </button>
    </form>
  );
}
