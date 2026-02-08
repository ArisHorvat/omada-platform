import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  cardContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  mapPlaceholder: {
    width: '100%',
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapIcon: {
    opacity: 0.5,
  },
  pin: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)', // Subtle shadow for the pin
  },
  bentoContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
});