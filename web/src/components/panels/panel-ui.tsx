import Link from "next/link";

export function PanelSection(props: {
  title: string;
  empty?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold">{props.title}</h2>
      <ul className="mt-2 divide-y text-sm">{props.children}</ul>
      {props.empty && !props.children ? (
        <p className="mt-2 text-sm text-slate-500">{props.empty}</p>
      ) : null}
    </section>
  );
}

export function PanelRow(props: { href: string; label: string }) {
  return (
    <li className="py-2">
      <Link href={props.href} className="text-sygos-teal">
        {props.label}
      </Link>
    </li>
  );
}

export function SummaryGrid(props: {
  items: { label: string; value: string; href?: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {props.items.map((item) => {
        const inner = (
          <>
            <p className="text-xs uppercase text-slate-500">{item.label}</p>
            <p className="mt-1 text-lg font-semibold">{item.value}</p>
          </>
        );
        if (item.href) {
          return (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-xl border bg-white p-4 shadow-sm hover:border-sygos-teal"
            >
              {inner}
            </Link>
          );
        }
        return (
          <div key={item.label} className="rounded-xl border bg-white p-4 shadow-sm">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
