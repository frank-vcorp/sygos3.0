"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/db/schema";
import { roleLabel } from "@/lib/role-labels";

type UserRow = {
  id: string;
  displayName: string;
  username: string;
  role: UserRole;
};

type ActiveSession = {
  session: { id: string; startedAt: string };
  userIds: string[];
  roles: UserRole[];
};

const ALL_ROLES: UserRole[] = [
  "CEO",
  "COORDINACION_ADMINISTRACION",
  "GERENTE_OPERATIVO_SYSTRON",
  "GERENTE_OPERATIVO_SERVOMOTORES",
  "SUPERVISOR_TECNICO_SYSTRON",
  "TECNICO_SYSTRON",
  "VENTAS_SYSTRON",
  "ALMACEN_SYSTRON",
  "AYUDANTE_GENERAL_SERVOMOTORES",
];

export function TestModePanel(props: {
  users: UserRow[];
  initialActive: ActiveSession | null;
}) {
  const router = useRouter();
  const [selectedUsers, setSelectedUsers] = useState<string[]>(
    props.initialActive?.userIds ?? [],
  );
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(
    props.initialActive?.roles ?? [],
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggleUser(id: string) {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleRole(role: UserRole) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  async function start() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/config/test-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: selectedUsers, roles: selectedRoles }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setMessage(data.error ?? "No se pudo iniciar.");
      return;
    }
    router.refresh();
  }

  async function endSession() {
    if (
      !window.confirm(
        "Finalizar Modo de Pruebas es definitivo. Los participantes vuelven a producción. ¿Continuar?",
      )
    ) {
      return;
    }
    setBusy(true);
    await fetch("/api/config/test-mode", { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {props.initialActive ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-semibold text-amber-950">Sesión activa</p>
          <p className="mt-1 text-amber-900">
            Iniciada {new Date(props.initialActive.session.startedAt).toLocaleString("es-MX")} ·{" "}
            {props.initialActive.userIds.length} usuarios ·{" "}
            {props.initialActive.roles.length} roles
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void endSession()}
            className="mt-3 rounded-lg bg-red-700 px-3 py-2 text-white disabled:opacity-60"
          >
            Finalizar modo de pruebas
          </button>
        </div>
      ) : (
        <>
          <section className="rounded-xl border bg-white p-4">
            <h2 className="text-sm font-semibold">Usuarios participantes</h2>
            <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-sm">
              {props.users.map((u) => (
                <li key={u.id}>
                  <label className="flex cursor-pointer items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => toggleUser(u.id)}
                    />
                    {u.displayName} ({u.username}) · {roleLabel(u.role)}
                  </label>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border bg-white p-4">
            <h2 className="text-sm font-semibold">Roles completos</h2>
            <ul className="mt-3 grid gap-1 sm:grid-cols-2 text-sm">
              {ALL_ROLES.map((role) => (
                <li key={role}>
                  <label className="flex cursor-pointer items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                    />
                    {roleLabel(role)}
                  </label>
                </li>
              ))}
            </ul>
          </section>
          <button
            type="button"
            disabled={busy}
            onClick={() => void start()}
            className="rounded-lg bg-sygos-navy px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Iniciar modo de pruebas
          </button>
        </>
      )}
      {message && <p className="text-sm text-red-700">{message}</p>}
      <p className="text-xs text-slate-500">
        v1: bloquea efectos externos y muestra advertencia. Los datos operativos
        siguen en la base de producción; use staging para pruebas destructivas.
      </p>
    </div>
  );
}
