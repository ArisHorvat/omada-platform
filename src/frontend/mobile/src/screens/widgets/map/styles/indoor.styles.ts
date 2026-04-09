import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 100,
  },
  header: {
    padding: 16,
    zIndex: 10,
    backgroundColor: colors.background, // Ensure text stays readable
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
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontWeight: 'bold',
    marginRight: 10,
    color: colors.text,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: colors.text,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginHorizontal: 4,
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
    maxHeight: 52,
    marginBottom: 12,
    paddingHorizontal: 16,
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
    minHeight: 200,
  },
});