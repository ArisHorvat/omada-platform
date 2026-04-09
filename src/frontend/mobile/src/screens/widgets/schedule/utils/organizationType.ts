import { OrganizationDetailsDto } from '@/src/api/generatedClient';

export type ScheduleOrgKind = 'Corporate' | 'University';

type OrgWithType = OrganizationDetailsDto & { organizationType?: string | number };

/** Resolves org kind from API (enum as string or numeric). Defaults to University when unknown. */
export function resolveScheduleOrgKind(
  organization: OrganizationDetailsDto | null | undefined
): ScheduleOrgKind {
  const t = organization ? (organization as OrgWithType).organizationType : undefined;
  if (t === undefined || t === null) return 'University';
  if (typeof t === 'number') return t === 1 ? 'Corporate' : 'University';
  const s = String(t).toLowerCase();
  if (s === 'corporate' || s === '1') return 'Corporate';
  if (s === 'university' || s === '0') return 'University';
  return 'University';
}

export function isCorporateOrganization(
  organization: OrganizationDetailsDto | null | undefined
): boolean {
  return resolveScheduleOrgKind(organization) === 'Corporate';
}
