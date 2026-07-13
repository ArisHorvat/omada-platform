import { OrganizationDetailsDto } from '@/src/api/generatedClient';

export type ScheduleOrgKind = 'Corporate' | 'University';

type OrgWithType = OrganizationDetailsDto & { organizationType?: string | number };

function resolveOrgTypeToken(t: string | number | undefined | null): ScheduleOrgKind | null {
  if (t === undefined || t === null) return null;
  if (typeof t === 'number') return t === 1 ? 'Corporate' : 'University';
  const s = String(t).toLowerCase();
  if (s === 'corporate' || s === '1') return 'Corporate';
  if (s === 'university' || s === '0') return 'University';
  return null;
}

/** Resolves org kind from API (enum as string or numeric). Defaults to University when unknown. */
export function resolveScheduleOrgKind(
  organization: OrganizationDetailsDto | null | undefined | string | number
): ScheduleOrgKind {
  if (organization === null || organization === undefined) return 'University';
  if (typeof organization === 'string' || typeof organization === 'number') {
    return resolveOrgTypeToken(organization) ?? 'University';
  }
  const t = (organization as OrgWithType).organizationType;
  return resolveOrgTypeToken(t) ?? 'University';
}

export function isCorporateOrganization(
  organization: OrganizationDetailsDto | null | undefined | string | number
): boolean {
  return resolveScheduleOrgKind(organization) === 'Corporate';
}
