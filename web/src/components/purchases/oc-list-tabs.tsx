import { ModuleListTabs } from "@/components/discovery/module-list-tabs";

export function OcListTabs(props: {
  active: "todas" | "pendientes-ceo" | "pendientes-procesar";
  showCeoTab: boolean;
  showProcessTab: boolean;
}) {
  const tabs = [
    { id: "todas", label: "Todas" },
    ...(props.showCeoTab ?
      [{ id: "pendientes-ceo", label: "Pendientes CEO", queryValue: "pendientes-ceo" }]
    : []),
    ...(props.showProcessTab ?
      [
        {
          id: "pendientes-procesar",
          label: "Pendientes procesar",
          queryValue: "pendientes-procesar",
        },
      ]
    : []),
  ];
  return (
    <ModuleListTabs basePath="/operacion/oc" activeId={props.active} tabs={tabs} />
  );
}
