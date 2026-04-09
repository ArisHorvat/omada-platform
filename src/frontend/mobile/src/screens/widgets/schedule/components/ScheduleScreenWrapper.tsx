import React from 'react';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { isCorporateOrganization } from '../utils/organizationType';
import CorporateScheduleScreen from './CorporateScheduleScreen';
import UniversityScheduleScreen from './UniversityScheduleScreen';

/**
 * Routes to corporate vs university schedule UI based on active org type.
 */
export default function ScheduleScreenWrapper() {
  const { organization } = useCurrentOrganization();

  if (isCorporateOrganization(organization)) {
    return <CorporateScheduleScreen />;
  }

  return <UniversityScheduleScreen />;
}
