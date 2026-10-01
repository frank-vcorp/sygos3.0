"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { suppliers } from "@/db/schema";

type SupplierRow = typeof suppliers.$inferSelect;

export function SupplierCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const creditRaw = String(fd.get("creditDays") ?? "").trim();
    const res = await fetch("/api/masters/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legalName: String(fd.get("legalName")),
        contactName: String(fd.get("contactName") || "") || undefined,
        phone: String(fd.get("phone") || "") || undefined,
        email: String(fd.get("email") || "") || undefined,
        creditDays: creditRaw ? Number(creditRaw) : null,
        emitsFiscalInvoice: fd.get("emitsFiscalInvoice") === "on",
        category: String(fd.get("category") || "") || undefined,
        taxRfc: String(fd.get("taxRfc") || "") || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo crear.");
      return;
    }
    router.push(`/operacion/proveedores/${data.supplier.id}`);
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
        Razón social *
        <input
          name="legalName"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Contacto
        <input
          name="contactName"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Teléfono
          <input
            name="phone"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Correo
          <input
            name="email"
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="emitsFiscalInvoice" defaultChecked />
        Emite factura fiscal
      </label>
      <label className="block text-sm">
        Días de crédito
        <input
          name="creditDays"
          type="number"
          min={0}
          className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Categoría
        <input
          name="category"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        RFC
        <input
          name="taxRfc"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        className="rounded-lg bg-sygos-navy px-4 py-2 text-sm font-medium text-white"
      >
        Crear proveedor
      </button>
    </form>
  );
}

export function SupplierDetailPanel({ supplier }: { supplier: SupplierRow }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const fixed = supplier.isSystemFixed;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const creditRaw = String(fd.get("creditDays") ?? "").trim();
    const res = await fetch(`/api/masters/suppliers/${supplier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legalName: String(fd.get("legalName")),
        contactName: String(fd.get("contactName") || "") || null,
        phone: String(fd.get("phone") || "") || null,
        email: String(fd.get("email") || "") || null,
        creditDays: creditRaw ? Number(creditRaw) : null,
        emitsFiscalInvoice: fd.get("emitsFiscalInvoice") === "on",
        category: String(fd.get("category") || "") || null,
        taxRfc: String(fd.get("taxRfc") || "") || null,
        isActive: fd.get("isActive") === "on",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error ?? "No se pudo guardar.");
      return;
    }
    setMessage("Proveedor actualizado.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
      {fixed && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Proveedor intercompañía fijo del sistema. No se puede inactivar ni
          renombrar.
        </p>
      )}
      {message && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
          {message}
        </p>
      )}
      <label className="block text-sm">
        Razón social
        <input
          name="legalName"
          defaultValue={supplier.legalName}
          required
          disabled={fixed}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
        />
      </label>
      <label className="block text-sm">
        Contacto
        <input
          name="contactName"
          defaultValue={supplier.contactName ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Teléfono
          <input
            name="phone"
            defaultValue={supplier.phone ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Correo
          <input
            name="email"
            type="email"
            defaultValue={supplier.email ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="emitsFiscalInvoice"
          defaultChecked={supplier.emitsFiscalInvoice}
        />
        Emite factura fiscal
      </label>
      {!fixed && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={supplier.isActive}
          />
          Activo
        </label>
      )}
      <label className="block text-sm">
        Días de crédito
        <input
          name="creditDays"
          type="number"
          min={0}
          defaultValue={supplier.creditDays ?? ""}
          className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Categoría
        <input
          name="category"
          defaultValue={supplier.category ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        RFC
        <input
          name="taxRfc"
          defaultValue={supplier.taxRfc ?? ""}
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
