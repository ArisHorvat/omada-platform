import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bigCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  streakText: {
    textAlign: 'right',
    opacity: 0.8,
  },
  bentoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoText: {
    fontSize: 24,
  },
});