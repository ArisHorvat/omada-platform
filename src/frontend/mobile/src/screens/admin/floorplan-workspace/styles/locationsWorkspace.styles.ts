import { StyleSheet } from 'react-native';

export const locationsWorkspaceStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  treeSection: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  treeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  floorRow: {
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
});
