import React from 'react';
import ScheduleScreenContent from './ScheduleScreenContent';
import { useScheduleDictionary } from '../hooks/useScheduleDictionary';

/** Corporate tenant: dictionary uses Meeting / Organizer. */
export default function CorporateScheduleScreen() {
  const dictionary = useScheduleDictionary('Corporate');
  return <ScheduleScreenContent dictionary={dictionary} corporateWorkflow />;
}
