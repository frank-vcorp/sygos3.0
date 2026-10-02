"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegularizeMovementForm(props: { movementId: string }) {
  const router = useRouter();
  const [fiscalDocumentId, setFiscalDocumentId] = useState("");

  return (
    <div className="mt-2 flex gap-2">
      <input
        value={fiscalDocumentId}
        onChange={(e) => setFiscalDocumentId(e.target.value)}
        placeholder="UUID factura / comprobante"
        className="flex-1 rounded border px-2 py-1 text-xs"
      />
      <button
        type="button"
        className="rounded bg-sygos-teal px-2 py-1 text-xs text-white"
        onClick={async () => {
          if (!fiscalDocumentId.trim()) return;
          await fetch(`/api/finance/pending-verification/${props.movementId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fiscalDocumentId: fiscalDocumentId.trim() }),
          });
          router.refresh();
        }}
      >
        Regularizar
      </button>
    </div>
  );
}
