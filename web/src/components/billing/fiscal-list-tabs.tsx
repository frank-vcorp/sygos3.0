import { ModuleListTabs } from "@/components/discovery/module-list-tabs";

export function FiscalListTabs(props: {
  active: "todas" | "pendientes";
  showPendingTab: boolean;
}) {
  const tabs = [
    { id: "todas", label: "Emitidos" },
    ...(props.showPendingTab ?
      [{ id: "pendientes", label: "Pendientes coordinación", queryValue: "pendientes" }]
    : []),
  ];
  return (
    <ModuleListTabs
      basePath="/administracion/facturacion"
      activeId={props.active}
      tabs={tabs}
    />
  );
}
