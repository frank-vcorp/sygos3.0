"use client";

import { useState } from "react";

type Employee = { id: string; legalName: string };

export default function KioscoPage() {
  const [companySlug, setCompanySlug] = useState("SYSTRON");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadEmployees() {
    const res = await fetch(`/api/hr/kiosk/employees?slug=${companySlug}`);
    if (!res.ok) return;
    const data = await res.json();
    setEmployees(data.employees);
    setLoaded(true);
  }

  async function punch(employeeId: string, punchType: "ENTRADA" | "SALIDA") {
    setMsg(null);
    const res = await fetch("/api/hr/kiosk/punch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companySlug, employeeId, punchType }),
    });
    setMsg(res.ok ? "Registro guardado." : "No se pudo registrar.");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Kiosco de asistencia</h1>
      <select
        className="rounded-lg border px-3 py-2"
        value={companySlug}
        onChange={(e) => {
          setCompanySlug(e.target.value);
          setLoaded(false);
        }}
      >
        <option value="SYSTRON">SYSTRON</option>
        <option value="SERVOMOTORES">Servomotores</option>
      </select>
      <button
        type="button"
        className="rounded-lg bg-sygos-navy px-4 py-2 text-white"
        onClick={loadEmployees}
      >
        Cargar colaboradores
      </button>
      {loaded && (
        <ul className="divide-y rounded-xl border bg-white">
          {employees.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 p-3 text-sm">
              <span>{e.legalName}</span>
              <span className="flex gap-2">
                <button
                  type="button"
                  className="rounded bg-emerald-700 px-2 py-1 text-xs text-white"
                  onClick={() => punch(e.id, "ENTRADA")}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  className="rounded bg-slate-700 px-2 py-1 text-xs text-white"
                  onClick={() => punch(e.id, "SALIDA")}
                >
                  Salida
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
