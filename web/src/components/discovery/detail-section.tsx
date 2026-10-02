import type { ReactNode } from "react";

export function DetailSection(props: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-sm">
      <h2 className="font-medium text-slate-900">{props.title}</h2>
      {props.description && (
        <p className="mt-1 text-xs text-slate-500">{props.description}</p>
      )}
      <div className="mt-3 space-y-2">{props.children}</div>
    </section>
  );
}

export function RelationLinks(props: { links: { href: string; label: string }[] }) {
  if (props.links.length === 0) {
    return <p className="text-slate-500">Sin relaciones registradas todavía.</p>;
  }
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {props.links.map((l) => (
        <a key={l.href} href={l.href} className="text-sygos-teal hover:underline">
          {l.label}
        </a>
      ))}
    </div>
  );
}
