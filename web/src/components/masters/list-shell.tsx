import Link from "next/link";
import type { ReactNode } from "react";

type ListShellProps = {
  title: string;
  description: string;
  createHref?: string;
  createLabel?: string;
  searchSlot?: ReactNode;
  children: ReactNode;
};

export function ListShell({
  title,
  description,
  createHref,
  createLabel = "Nuevo",
  searchSlot,
  children,
}: ListShellProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        {createHref && (
          <Link
            href={createHref}
            className="rounded-lg bg-sygos-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-sygos-navy-sidebar"
          >
            {createLabel}
          </Link>
        )}
      </div>
      {searchSlot}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {children}
      </div>
    </div>
  );
}
