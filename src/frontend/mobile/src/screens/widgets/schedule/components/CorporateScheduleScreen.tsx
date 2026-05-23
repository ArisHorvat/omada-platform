import React from 'react';
import ScheduleScreenContent from './ScheduleScreenContent';
import { useScheduleDictionary } from '../hooks/useScheduleDictionary';

/** Corporate tenant: dictionary uses Meeting / Organizer. */
export default function CorporateScheduleScreen({ initialRoomFilterId }: { initialRoomFilterId?: string }) {
  const dictionary = useScheduleDictionary('Corporate');
  return (
    <ScheduleScreenContent dictionary={dictionary} corporateWorkflow initialRoomFilterId={initialRoomFilterId} />
  );
}
