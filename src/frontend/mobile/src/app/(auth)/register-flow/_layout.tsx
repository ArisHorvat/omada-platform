import { Stack } from 'expo-router';
import { RegistrationProvider } from '@/src/screens/auth/register/context/RegistrationContext';

export default function RegisterFlowLayout() {
  return (
    <RegistrationProvider>
      <Stack screenOptions={{ 
        headerShown: false, 
      }}>
        <Stack.Screen name="index" options={{ title: 'Your organization' }} />
        <Stack.Screen name="admin" options={{ title: 'Admin Details' }} />
        <Stack.Screen name="branding" options={{ title: 'Branding' }} />
        <Stack.Screen name="registration-success" options={{ animation: 'fade' }} />
      </Stack>
    </RegistrationProvider>
  );
}
