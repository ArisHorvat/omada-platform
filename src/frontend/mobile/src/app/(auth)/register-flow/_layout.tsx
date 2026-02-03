import { Stack } from 'expo-router';
import { RegistrationProvider } from '@/src/screens/auth/register/context/RegistrationContext';

export default function RegisterFlowLayout() {
  return (
    <RegistrationProvider>
      <Stack screenOptions={{ 
        headerShown: false, 
      }}>
        <Stack.Screen name="index" options={{ title: 'Organization Details' }} />
        <Stack.Screen name="admin" options={{ title: 'Admin Details' }} />
        <Stack.Screen name="branding" options={{ title: 'Branding' }} />
        <Stack.Screen name="roles" options={{ title: 'Custom Roles' }} />
        <Stack.Screen name="users" options={{ title: 'Import Users' }} />
        <Stack.Screen name="widgets" options={{ title: 'Assign Widgets' }} />
        <Stack.Screen name="registration-success" />
      </Stack>
    </RegistrationProvider>
  );
}
