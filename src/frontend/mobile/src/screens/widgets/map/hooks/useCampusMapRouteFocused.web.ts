import { useIsFocused } from '@react-navigation/native';

/** True while this map route is the active screen (hides portaled map on blur). */
export function useCampusMapRouteFocused(): boolean {
  return useIsFocused();
}
