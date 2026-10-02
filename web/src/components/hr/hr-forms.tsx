"use client";

import { useRouter } from "next/navigation";

export function EmployeeCreateForm() {
  const router = useRouter();
  return (
    <form
      className="max-w-lg space-y-3 rounded-xl border bg-white p-4 text-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await fetch("/api/hr/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            legalName: fd.get("legalName"),
            hireType: fd.get("hireType"),
            hireDate: fd.get("hireDate"),
            dailySalaryStampedMxn: Number(fd.get("dailySalaryStampedMxn")),
            dailySalaryCashMxn: Number(fd.get("dailySalaryCashMxn")),
            vacationBalanceDays: Number(fd.get("vacationBalanceDays") || 0),
            taxRfc: fd.get("taxRfc") || undefined,
            taxCurp: fd.get("taxCurp") || undefined,
            taxZip: fd.get("taxZip") || undefined,
          }),
        });
        router.refresh();
      }}
    >
      <input name="legalName" required placeholder="Nombre legal" className="w-full rounded border px-3 py-2" />
      <select name="hireType" className="w-full rounded border px-3 py-2">
        <option value="NUEVO">Nuevo</option>
        <option value="MIGRADO">Migrado</option>
      </select>
      <input name="hireDate" type="date" required className="w-full rounded border px-3 py-2" />
      <input name="dailySalaryStampedMxn" type="number" min={0} placeholder="Salario diario timbrado" className="w-full rounded border px-3 py-2" />
      <input name="dailySalaryCashMxn" type="number" min={0} placeholder="Salario diario efectivo" className="w-full rounded border px-3 py-2" />
      <input name="vacationBalanceDays" type="number" min={0} placeholder="Saldo vacaciones (migrado)" className="w-full rounded border px-3 py-2" />
      <input name="taxRfc" placeholder="RFC (timbrado nómina)" className="w-full rounded border px-3 py-2" />
      <input name="taxCurp" placeholder="CURP (opcional)" className="w-full rounded border px-3 py-2" />
      <input name="taxZip" placeholder="CP fiscal (opcional)" className="w-full rounded border px-3 py-2" />
      <button type="submit" className="rounded-lg bg-sygos-navy px-4 py-2 text-white">
        Alta colaborador
      </button>
    </form>
  );
}

export function OvertimeRequestForm(props: { employeeId?: string }) {
  const router = useRouter();
  return (
    <form
      className="space-y-2 rounded-xl border bg-white p-4 text-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await fetch("/api/hr/overtime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: props.employeeId ?? fd.get("employeeId"),
            workDate: fd.get("workDate"),
            hours: Number(fd.get("hours")),
          }),
        });
        router.refresh();
      }}
    >
      {!props.employeeId && (
        <input name="employeeId" required placeholder="UUID colaborador" className="w-full rounded border px-3 py-2" />
      )}
      <input name="workDate" type="date" required className="w-full rounded border px-3 py-2" />
      <input name="hours" type="number" min={1} max={24} required className="w-full rounded border px-3 py-2" />
      <p className="text-xs text-slate-500">
        El tipo (doble/triple) se calcula por acumulado semanal (1–9 h doble, 10+ triple).
      </p>
      <button type="submit" className="rounded-lg bg-sygos-teal px-3 py-2 text-white">
        Solicitar horas extra
      </button>
    </form>
  );
}

export function HrActionButton(props: { href: string; body: Record<string, unknown>; label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded bg-sygos-navy px-2 py-1 text-xs text-white"
      onClick={async () => {
        const res = await fetch(props.href, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(props.body),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            issues?: { legalName: string; reason: string }[];
          };
          const extra =
            data.issues?.map((i) => `${i.legalName}: ${i.reason}`).join("\n") ??
            "";
          window.alert([data.error, extra].filter(Boolean).join("\n\n"));
          return;
        }
        router.refresh();
      }}
    >
      {props.label}
    </button>
  );
}
