import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  cardContainer: {
    flex: 1, 
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 12, 
    opacity: 0.8,
  },
  searchText: {
    opacity: 0.6,
  },
  bentoContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
});