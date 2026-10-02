"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CommissionsPayButton(props: { periodKey: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      className="rounded bg-emerald-700 px-2 py-1 text-xs text-white disabled:opacity-60"
      onClick={async () => {
        if (!window.confirm(`Marcar comisiones ${props.periodKey} como pagadas?`)) return;
        setBusy(true);
        await fetch("/api/hr/commissions/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ periodKey: props.periodKey }),
        });
        setBusy(false);
        router.refresh();
      }}
    >
      Marcar periodo pagado
    </button>
  );
}
