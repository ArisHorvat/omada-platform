import { useMemo } from 'react';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { resolveScheduleOrgKind, type ScheduleOrgKind } from '../utils/organizationType';

export interface ScheduleDictionary {
  /** "Meeting" (corporate) vs "Class" (university) */
  eventLabel: string;
  /** "Organizer" vs "Teacher" */
  hostLabel: string;
  eventLabelLower: string;
  hostLabelLower: string;
  /** Explore tab label */
  exploreTab: string;
  /** My schedule tab */
  myScheduleTab: string;
  orgKind: ScheduleOrgKind;
}

/**
 * Labels for schedule UI by organization type.
 * Pass `overrideKind` for screens that are fixed to Corporate or University routing.
 */
export function useScheduleDictionary(overrideKind?: ScheduleOrgKind): ScheduleDictionary {
  const { organization } = useCurrentOrganization();
  const kind = overrideKind ?? resolveScheduleOrgKind(organization);

  return useMemo(() => {
    const isCorp = kind === 'Corporate';
    const eventLabel = isCorp ? 'Meeting' : 'Class';
    const hostLabel = isCorp ? 'Organizer' : 'Teacher';
    return {
      orgKind: kind,
      eventLabel,
      hostLabel,
      eventLabelLower: eventLabel.toLowerCase(),
      hostLabelLower: hostLabel.toLowerCase(),
      exploreTab: 'Explore',
      myScheduleTab: 'My Schedule',
    };
  }, [kind]);
}
