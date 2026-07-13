import { StyleSheet } from 'react-native';

/** Shared picker-row layout for filter bars (tasks, grades, admin pickers). */
export const filterPickerRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  iconColumn: {
    width: 40,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  caption: {
    marginBottom: 4,
  },
});

/** Outer card for stacked filter panels — use explicit padding (ClayView puffy is shadow only). */
export const filterPanelCardStyles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    alignSelf: 'stretch',
  },
  searchWrap: {
    marginTop: 2,
    marginBottom: 2,
  },
});
