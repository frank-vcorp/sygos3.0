"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MotIntercompanyInvoiceButton(props: {
  motorId: string;
  defaultSubtotalMxn?: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function createInvoice() {
    const subtotal =
      props.defaultSubtotalMxn ??
      Number.parseInt(
        window.prompt("Subtotal MXN (antes de IVA) para factura a SYSTRON:", "0") ??
          "0",
        10,
      );
    if (!Number.isFinite(subtotal) || subtotal <= 0) return;

    setLoading(true);
    const res = await fetch("/api/billing/intercompany", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        motorId: props.motorId,
        subtotalMxn: subtotal,
        lines: [
          {
            concept: "Servicio intercompañía MOT SYSTRON",
            quantity: 1,
            unitPriceMxn: subtotal,
          },
        ],
      }),
    });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    router.push(`/administracion/facturacion/${data.document.id}`);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={createInvoice}
      className="rounded-lg border border-sygos-teal bg-white px-3 py-2 text-sm text-sygos-teal hover:bg-teal-50 disabled:opacity-60"
    >
      Facturar a SYSTRON (intercompañía)
    </button>
  );
}
