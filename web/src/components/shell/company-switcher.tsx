"use client";

import { useRouter } from "next/navigation";
import { companySlugToLabel, type CompanySlug } from "@/lib/company";

type CompanySwitcherProps = {
  activeSlug: CompanySlug;
  allowedSlugs: CompanySlug[];
};

export function CompanySwitcher({
  activeSlug,
  allowedSlugs,
}: CompanySwitcherProps) {
  const router = useRouter();

  async function switchCompany(slug: CompanySlug) {
    if (slug === activeSlug) return;
    await fetch("/api/company/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companySlug: slug }),
    });
    router.refresh();
  }

  return (
    <>
      <span className="hidden text-slate-500 sm:inline">Empresa</span>
      {allowedSlugs.map((slug) => {
        const label = companySlugToLabel(slug);
        return (
          <button
            key={slug}
            type="button"
            onClick={() => switchCompany(slug)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              slug === activeSlug
                ? "bg-sygos-navy text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        );
      })}
    </>
  );
}
