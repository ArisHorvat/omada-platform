import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    zIndex: 10,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.subtle,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floorSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  floorButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 3,
  },
  activeFloorButton: {
    backgroundColor: colors.primary,
  },
  floorText: {
    fontWeight: '600',
    color: colors.text,
  },
  activeFloorText: {
    color: '#ffffff',
  },
  floorScroll: {
    maxHeight: 44,
    paddingHorizontal: 10,
  },
  floorScrollContent: {
    gap: 8,
    alignItems: 'center',
    paddingVertical: 4,
  },
  roomPin: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    marginTop: -6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  roomPinFocused: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    marginTop: -9,
    zIndex: 10,
    elevation: 6,
  },
  floorplanBlock: {
    flex: 1,
    minHeight: 0,
  },
});