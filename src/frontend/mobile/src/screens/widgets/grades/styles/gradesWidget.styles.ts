import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  gpaText: {
    fontSize: 56,
    lineHeight: 56,
  },
  subHeader: {
    marginLeft: 12,
    marginBottom: 8,
  },
  footer: {
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bentoContainer: {
    flex: 1, 
    justifyContent: 'center',
  },
  bentoTitle: {
    fontSize: 32,
  },
});