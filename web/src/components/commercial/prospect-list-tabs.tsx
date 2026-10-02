import { ModuleListTabs } from "@/components/discovery/module-list-tabs";

export function ProspectListTabs(props: {
  active: "pipeline" | "todas" | "convertidos";
}) {
  return (
    <ModuleListTabs
      basePath="/comercial/prospectos"
      activeId={props.active}
      tabs={[
        { id: "pipeline", label: "En pipeline" },
        { id: "todas", label: "Todos", queryValue: "todas" },
        { id: "convertidos", label: "Convertidos", queryValue: "convertidos" },
      ]}
    />
  );
}
