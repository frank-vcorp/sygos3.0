export type CompanySlug = "SYSTRON" | "SERVOMOTORES";

export function companySlugToLabel(slug: string): string {
  if (slug === "SERVOMOTORES") return "Servomotores";
  if (slug === "SYSTRON") return "SYSTRON";
  return slug;
}

export function labelToCompanySlug(label: string): CompanySlug {
  if (label === "Servomotores") return "SERVOMOTORES";
  return "SYSTRON";
}
