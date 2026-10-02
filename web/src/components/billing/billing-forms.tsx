"use client";

import { useRouter } from "next/navigation";

export function FiscalDocActions(props: {
  documentId: string;
  status: string;
  docKind?: string;
  canEmit: boolean;
  canApproveCancel: boolean;
  lastError?: string | null;
}) {
  const router = useRouter();

  async function patch(action: string) {
    const res = await fetch(`/api/billing/documents/${props.documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok && action === "prepare_credit_note") {
      const data = (await res.json()) as { document?: { id?: string } };
      if (data.document?.id) {
        router.push(`/administracion/facturacion/${data.document.id}`);
        return;
      }
    }
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
      {props.lastError && (
        <p className="text-red-700">Error fiscal: {props.lastError}</p>
      )}
      {props.canEmit &&
        ["SOLICITUD_PENDIENTE", "PENDIENTE_EMISION", "ERROR_FISCAL"].includes(
          props.status,
        ) && (
          <button
            type="button"
            onClick={() => patch(props.status === "ERROR_FISCAL" ? "retry" : "emit")}
            className="rounded-lg bg-sygos-navy px-3 py-2 text-white"
          >
            {props.status === "ERROR_FISCAL" ? "Reintentar emisión" : "Emitir / generar"}
          </button>
        )}
      {props.status === "EMITIDA" && props.docKind === "FACTURA" && props.canEmit && (
        <button
          type="button"
          onClick={() => patch("prepare_credit_note")}
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2"
        >
          Preparar nota de crédito
        </button>
      )}
      {props.docKind === "NOTA_CREDITO" &&
        props.status === "SOLICITUD_PENDIENTE" &&
        props.canApproveCancel && (
          <button
            type="button"
            onClick={() => patch("approve_credit_note")}
            className="rounded-lg bg-sygos-navy px-3 py-2 text-white"
          >
            Aprobar nota de crédito
          </button>
        )}
      {props.status === "EMITIDA" && (
        <button
          type="button"
          onClick={() => patch("request_cancel")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        >
          Solicitar cancelación
        </button>
      )}
      {props.status === "CANCELACION_SOLICITADA" && props.canApproveCancel && (
        <button
          type="button"
          onClick={() => patch("approve_cancel")}
          className="rounded-lg bg-red-700 px-3 py-2 text-white"
        >
          Aprobar y ejecutar cancelación
        </button>
      )}
    </div>
  );
}

export function QuoteBillingRequest(props: { quoteId: string }) {
  const router = useRouter();

  async function request(docKind: "FACTURA" | "REMISION") {
    await fetch("/api/billing/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "quote_request",
        quoteId: props.quoteId,
        docKind,
      }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        onClick={() => request("FACTURA")}
      >
        Solicitar factura
      </button>
      <button
        type="button"
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        onClick={() => request("REMISION")}
      >
        Solicitar remisión
      </button>
    </div>
  );
}

export function PaymentValidateButton(props: { paymentId: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded-lg bg-emerald-700 px-2 py-1 text-xs text-white"
      onClick={async () => {
        await fetch(`/api/billing/payments/${props.paymentId}/validate`, {
          method: "POST",
        });
        router.refresh();
      }}
    >
      Validar pago
    </button>
  );
}
