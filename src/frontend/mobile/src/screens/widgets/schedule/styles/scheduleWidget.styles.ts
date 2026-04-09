import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'space-between',
  },
  cardBody: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'flex-start',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CD964',
    marginRight: 8,
  },
  classTitle: {
    fontSize: 24,
    lineHeight: 28,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    flexShrink: 0,
    marginTop: 8,
  },
  bentoContainer: {
    flex: 1, 
    justifyContent: 'flex-end',
  },
});