"use client";

import { useRouter } from "next/navigation";

type Line = {
  id: string;
  concept: string;
  amountMxn: number;
  lineKind: string;
  employeeId: string;
};

export function PayrollPanel(props: {
  runId: string;
  runStatus: string;
  runKind: string;
  lines: Line[];
  canAuthorize: boolean;
  canAdjust: boolean;
  employees: { id: string; legalName: string }[];
}) {
  const router = useRouter();

  if (!props.runId) return null;

  return (
    <section className="space-y-4 rounded-xl border bg-white p-4 text-sm">
      <h2 className="font-semibold">
        Líneas · {props.runKind === "AGUINALDO" ? "Aguinaldo" : "Semanal"} ·{" "}
        {props.runStatus}
      </h2>
      <ul className="divide-y">
        {props.lines.map((l) => (
          <li key={l.id} className="flex items-center justify-between gap-2 py-2">
            <span>
              {l.concept}{" "}
              <span className="text-xs text-slate-400">({l.lineKind})</span>
            </span>
            <span className="flex items-center gap-2">
              {l.amountMxn} MXN
              {props.canAuthorize &&
                props.runStatus === "BORRADOR" &&
                (l.lineKind === "EXTRA_INGRESO" ||
                  l.lineKind === "EXTRA_DESCUENTO") && (
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={async () => {
                      await fetch(`/api/hr/payroll/${props.runId}/lines`, {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ lineId: l.id }),
                      });
                      router.refresh();
                    }}
                  >
                    Quitar
                  </button>
                )}
            </span>
          </li>
        ))}
      </ul>
      {props.canAdjust && props.runStatus === "BORRADOR" && (
        <form
          className="grid gap-2 border-t pt-3 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            await fetch(`/api/hr/payroll/${props.runId}/lines`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                employeeId: fd.get("employeeId"),
                kind: fd.get("kind"),
                concept: fd.get("concept"),
                amountMxn: Number(fd.get("amountMxn")),
              }),
            });
            e.currentTarget.reset();
            router.refresh();
          }}
        >
          <select name="employeeId" required className="rounded border px-2 py-1">
            <option value="">Colaborador</option>
            {props.employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.legalName}
              </option>
            ))}
          </select>
          <select name="kind" className="rounded border px-2 py-1">
            <option value="EXTRA_INGRESO">Ingreso extra</option>
            <option value="EXTRA_DESCUENTO">Descuento extra</option>
          </select>
          <input
            name="concept"
            required
            placeholder="Concepto"
            className="rounded border px-2 py-1 sm:col-span-2"
          />
          <input
            name="amountMxn"
            type="number"
            min={1}
            required
            placeholder="Importe MXN"
            className="rounded border px-2 py-1"
          />
          <button type="submit" className="rounded bg-sygos-teal px-3 py-1 text-white">
            Agregar ajuste
          </button>
        </form>
      )}
    </section>
  );
}
