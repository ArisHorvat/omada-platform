import { Stack } from 'expo-router';

export default function MapLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: 'Campus Map' 
        }} 
      />

      <Stack.Screen 
        name="floorplan/[buildingId]" 
        options={{ 
          headerShown: true, 
          title: 'Floor Plan',
          headerBackTitle: 'Campus' 
        }} 
      />
    </Stack>
  );
}