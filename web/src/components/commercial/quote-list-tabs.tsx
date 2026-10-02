import Link from "next/link";

export function QuoteListTabs(props: {
  active: "todas" | "pendientes-cotizar" | "pendientes-decision";
  showPendingPricing: boolean;
}) {
  const base = "/comercial/cotizaciones";
  const tab = (id: typeof props.active, label: string) => {
    const href =
      id === "todas" ? base : `${base}?vista=${id}`;
    const active = props.active === id;
    return (
      <Link
        href={href}
        className={
          active
            ? "border-b-2 border-sygos-teal px-3 py-2 text-sm font-medium text-sygos-teal"
            : "px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="-mb-px flex flex-wrap gap-1 border-b border-slate-200">
      {tab("todas", "Todas")}
      {props.showPendingPricing && tab("pendientes-cotizar", "Pendientes de cotizar")}
      {tab("pendientes-decision", "Pendientes de decisión")}
    </nav>
  );
}
