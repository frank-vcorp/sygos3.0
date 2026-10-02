import { ModuleListTabs } from "@/components/discovery/module-list-tabs";

export function EquiListTabs(props: {
  active: "todas" | "pendiente-entrada" | "resguardo";
}) {
  return (
    <ModuleListTabs
      basePath="/activos/equi"
      activeId={props.active}
      tabs={[
        { id: "todas", label: "Todos" },
        { id: "pendiente-entrada", label: "Pendiente entrada", queryValue: "pendiente-entrada" },
        { id: "resguardo", label: "En resguardo", queryValue: "resguardo" },
      ]}
    />
  );
}
