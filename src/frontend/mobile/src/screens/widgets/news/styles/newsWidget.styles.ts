import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  cardContainer: {
    flex: 1, 
    justifyContent: 'space-between',
  },
  headline: {
    fontSize: 24, 
    lineHeight: 30,
  },
  footer: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderTopWidth: 1, 
    paddingTop: 12,
  },
  bentoContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  bentoIcon: {
    marginBottom: 4,
  },
});