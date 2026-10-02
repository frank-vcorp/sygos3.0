import { ModuleListTabs } from "@/components/discovery/module-list-tabs";

export function OcListTabs(props: {
  active: "todas" | "pendientes-ceo";
  showCeoTab: boolean;
}) {
  const tabs = [
    { id: "todas", label: "Todas" },
    ...(props.showCeoTab ?
      [{ id: "pendientes-ceo", label: "Pendientes CEO", queryValue: "pendientes-ceo" }]
    : []),
  ];
  return (
    <ModuleListTabs basePath="/operacion/oc" activeId={props.active} tabs={tabs} />
  );
}
