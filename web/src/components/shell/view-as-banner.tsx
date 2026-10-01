type ViewAsBannerProps = {
  effectiveName: string;
  effectiveRoleLabel: string;
  companyName: string;
};

export function ViewAsBanner({
  effectiveName,
  effectiveRoleLabel,
  companyName,
}: ViewAsBannerProps) {
  return (
    <div className="bg-violet-700 px-4 py-2 text-center text-sm font-medium text-white lg:px-6">
      VER COMO — {effectiveName} · {effectiveRoleLabel} · {companyName}
    </div>
  );
}
