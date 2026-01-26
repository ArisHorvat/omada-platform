import { Stack } from 'expo-router';

export default function RegisterFlowLayout() {
  return (
      <Stack screenOptions={{ 
        headerShown: false, 
      }}>
        <Stack.Screen name="index" options={{ title: 'Organization Details' }} />
        <Stack.Screen name="select-organization" options={{ title: 'Assign Widgets' }} />
      </Stack>
  );
}
