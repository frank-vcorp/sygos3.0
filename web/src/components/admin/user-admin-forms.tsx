"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { UserRole } from "@/db/schema";
import { roleLabel } from "@/lib/role-labels";

type CompanyOption = { id: string; slug: string; name: string };

const SYSTRON_ROLES: UserRole[] = [
  "GERENTE_OPERATIVO_SYSTRON",
  "SUPERVISOR_TECNICO_SYSTRON",
  "TECNICO_SYSTRON",
  "VENTAS_SYSTRON",
  "ALMACEN_SYSTRON",
];

const SERVOMOTORES_ROLES: UserRole[] = [
  "GERENTE_OPERATIVO_SERVOMOTORES",
  "AYUDANTE_GENERAL_SERVOMOTORES",
];

const CROSS: UserRole[] = ["CEO", "COORDINACION_ADMINISTRACION"];

function rolesForHome(
  homeSlug: string,
  assignable: UserRole[],
): UserRole[] {
  const pool: UserRole[] =
    homeSlug === "SYSTRON"
      ? [...CROSS, ...SYSTRON_ROLES, "KIOSCO"]
      : [...CROSS, ...SERVOMOTORES_ROLES, "KIOSCO"];
  if (assignable.includes("ADMINISTRADOR")) {
    pool.unshift("ADMINISTRADOR");
  }
  return pool.filter((r) => assignable.includes(r));
}

export function UserCreateForm({
  companies,
  defaultHomeCompanyId,
  assignableRoles,
}: {
  companies: CompanyOption[];
  defaultHomeCompanyId: string;
  assignableRoles: UserRole[];
}) {
  const router = useRouter();
  const [homeId, setHomeId] = useState(defaultHomeCompanyId);
  const [error, setError] = useState<string | null>(null);
  const homeSlug =
    companies.find((c) => c.id === homeId)?.slug ?? "SYSTRON";
  const roleOptions = useMemo(
    () => rolesForHome(homeSlug, assignableRoles),
    [homeSlug, assignableRoles],
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const discountRaw = String(fd.get("vendorDiscountLimitPct") ?? "").trim();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: String(fd.get("username")),
        displayName: String(fd.get("displayName")),
        role: String(fd.get("role")),
        homeCompanyId: homeId,
        initialPassword: String(fd.get("initialPassword")),
        vendorDiscountLimitPct: discountRaw ? Number(discountRaw) : null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo crear el usuario.");
      return;
    }
    router.push(`/configuracion/usuarios/${data.user.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <label className="block text-sm">
        Usuario (login) *
        <input
          name="username"
          required
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Nombre para mostrar *
        <input
          name="displayName"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Empresa base
        <select
          value={homeId}
          onChange={(e) => setHomeId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Rol *
        <select
          name="role"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Contraseña inicial * (mín. 8, cambio obligatorio al entrar)
        <input
          name="initialPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Límite descuento vendedor (%)
        <input
          name="vendorDiscountLimitPct"
          type="number"
          min={0}
          max={100}
          className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        className="rounded-lg bg-sygos-navy px-4 py-2 text-sm font-medium text-white"
      >
        Crear usuario
      </button>
    </form>
  );
}

export function UserEditForm({
  user,
  assignableRoles,
}: {
  user: {
    id: string;
    username: string;
    displayName: string;
    role: UserRole;
    isActive: boolean;
    vendorDiscountLimitPct: number | null;
    homeCompanySlug: string | null;
  };
  assignableRoles: UserRole[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const homeSlug = user.homeCompanySlug ?? "SYSTRON";
  const roleOptions = rolesForHome(homeSlug, assignableRoles);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const discountRaw = String(fd.get("vendorDiscountLimitPct") ?? "").trim();
    const newPassword = String(fd.get("newPassword") ?? "").trim();
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: String(fd.get("displayName")),
        role: String(fd.get("role")),
        isActive: fd.get("isActive") === "on",
        vendorDiscountLimitPct: discountRaw ? Number(discountRaw) : null,
        newPassword: newPassword || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error ?? "No se pudo guardar.");
      return;
    }
    setMessage("Usuario actualizado.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
      <p className="text-sm text-slate-500">
        Login: <strong>{user.username}</strong>
      </p>
      {message && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
          {message}
        </p>
      )}
      <label className="block text-sm">
        Nombre para mostrar
        <input
          name="displayName"
          defaultValue={user.displayName}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Rol
        <select
          name="role"
          defaultValue={user.role}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={user.isActive} />
        Cuenta activa
      </label>
      <label className="block text-sm">
        Límite descuento vendedor (%)
        <input
          name="vendorDiscountLimitPct"
          type="number"
          min={0}
          max={100}
          defaultValue={user.vendorDiscountLimitPct ?? ""}
          className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Nueva contraseña (opcional)
        <input
          name="newPassword"
          type="password"
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        className="rounded-lg bg-sygos-navy px-4 py-2 text-sm font-medium text-white"
      >
        Guardar
      </button>
    </form>
  );
}

export function UsersListLink({ id, label }: { id: string; label: string }) {
  return (
    <Link
      href={`/configuracion/usuarios/${id}`}
      className="font-medium text-sky-800 hover:underline"
    >
      {label}
    </Link>
  );
}
