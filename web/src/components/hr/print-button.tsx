"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      className="rounded bg-sygos-navy px-3 py-1 text-sm text-white print:hidden"
      onClick={() => window.print()}
    >
      Imprimir
    </button>
  );
}
