export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  policies: 'Policies & compliance',
  hr: 'HR & onboarding',
  templates: 'Templates',
  projects: 'Project files',
};

export function categoryLabel(key: string | null | undefined): string {
  if (!key) return DOCUMENT_CATEGORY_LABELS.general;
  return DOCUMENT_CATEGORY_LABELS[key] ?? key;
}
