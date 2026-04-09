import { Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';

export default function AppIndex() {
  const { activeSession } = useAuth();

  // Safety check
  if (!activeSession) {
    return <Redirect href="/(auth)/login-flow" />;
  }

  const role = activeSession.role;

  if (role === 'Admin' || role === 'SuperAdmin' || role === 'Super Admin') {
    return <Redirect href="/org-dashboard" />;
  }

  return <Redirect href="/dashboard" />;
}