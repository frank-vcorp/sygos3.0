import { ModuleListTabs } from "@/components/discovery/module-list-tabs";

export function VacationListTabs(props: { active: "pendientes" | "todas" }) {
  return (
    <ModuleListTabs
      basePath="/capital-humano/vacaciones"
      activeId={props.active}
      tabs={[
        { id: "pendientes", label: "Pendientes CEO/Admin" },
        { id: "todas", label: "Todas", queryValue: "todas" },
      ]}
    />
  );
}
