import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
  },
  bubble: {
    padding: 16,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    marginBottom: 8,
  },
  bubbleText: {
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  bentoContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  bentoBadge: {
    width: 32, 
    height: 24, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 4,
  },
});