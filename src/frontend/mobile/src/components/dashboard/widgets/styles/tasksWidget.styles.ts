import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  cardContainer: {
    flex: 1, 
    justifyContent: 'space-between',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // For first item
  },
  taskIcon: {
    opacity: 0.6,
    marginRight: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bentoContainer: {
    flex: 1, 
    justifyContent: 'center',
  },
});