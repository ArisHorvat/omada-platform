import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
  },
  urgentItem: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
  },
  urgentBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  urgentTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  secondaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bentoContainer: {
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  bentoNumber: {
    fontSize: 32, 
    marginRight: 8,
  },
});