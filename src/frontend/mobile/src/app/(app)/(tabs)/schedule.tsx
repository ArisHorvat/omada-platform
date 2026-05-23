import ScheduleScreenWrapper from '@/src/screens/widgets/schedule/components/ScheduleScreenWrapper';
import { useLocalSearchParams } from 'expo-router';

export default function ScheduleRoute() {
  const params = useLocalSearchParams<{ roomId?: string }>();
  const roomId = typeof params.roomId === 'string' ? params.roomId : params.roomId?.[0];
  return <ScheduleScreenWrapper initialRoomFilterId={roomId} />;
}