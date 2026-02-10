import { Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';

export default function AppIndex() {
  const { activeSession } = useAuth();

  // Safety check
  if (!activeSession) {
    return <Redirect href="/(auth)/login-flow" />;
  }

  const role = activeSession.role;

  if (role === 'SuperAdmin') {
    return <Redirect href="/admin-dashboard" />;
  }

  if (role === 'Admin') {
    return <Redirect href="/org-dashboard" />;
  }

  return <Redirect href="/dashboard" />;
}