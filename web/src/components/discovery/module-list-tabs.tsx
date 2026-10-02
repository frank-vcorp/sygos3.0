import Link from "next/link";

export type ModuleTab = {
  id: string;
  label: string;
  /** Omit for default "todas" tab at base path */
  queryValue?: string;
};

export function ModuleListTabs(props: {
  basePath: string;
  activeId: string;
  tabs: ModuleTab[];
}) {
  return (
    <nav className="-mb-px flex flex-wrap gap-1 border-b border-slate-200">
      {props.tabs.map((t) => {
        const href =
          t.queryValue ? `${props.basePath}?vista=${t.queryValue}` : props.basePath;
        const active = props.activeId === t.id;
        return (
          <Link
            key={t.id}
            href={href}
            className={
              active
                ? "border-b-2 border-sygos-teal px-3 py-2 text-sm font-medium text-sygos-teal"
                : "px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
