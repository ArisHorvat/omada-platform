import React from 'react';
import ScheduleScreenContent from './ScheduleScreenContent';
import { useScheduleDictionary } from '../hooks/useScheduleDictionary';

/** University tenant: dictionary uses Class / Teacher. */
export default function UniversityScheduleScreen() {
  const dictionary = useScheduleDictionary('University');
  return <ScheduleScreenContent dictionary={dictionary} universityStudentUi />;
}
