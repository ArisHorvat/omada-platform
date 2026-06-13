import { OrganizationType } from '@/src/api/generatedClient';
import type { UserOrganizationDto } from '@/src/api/generatedClient';
import { resolveMediaUrl } from '@/src/utils/resolveMediaUrl';

export type ChangeOrganizationParams = {
  targetOrgId: string;
  targetOrgName: string;
  targetLogoUrl: string;
  targetOrgType: string;
  targetRole: string;
  currentOrgColor: string;
  currentOrgLogo: string;
  /** `1` = ring animation (profile switch). Omit or `0` = instant switch. */
  animate?: string;
};

export function buildChangeOrganizationParams(
  target: UserOrganizationDto,
  current?: { primaryColor?: string | null; logoUrl?: string | null } | null,
  options?: { animate?: boolean },
): ChangeOrganizationParams {
  return {
    targetOrgId: target.organizationId,
    targetOrgName: target.organizationName ?? 'Organization',
    targetLogoUrl: target.logoUrl ?? '',
    targetOrgType: String(target.organizationType ?? OrganizationType.Corporate),
    targetRole: target.role ?? '',
    currentOrgColor: current?.primaryColor ?? '',
    currentOrgLogo: resolveMediaUrl(current?.logoUrl) ?? current?.logoUrl ?? '',
    animate: options?.animate ? '1' : '0',
  };
}
