import { Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function AppIndex() {
  const { role } = useAuth();

  if (role === 'SuperAdmin') {
    return <Redirect href="/admin-dashboard" />;
  }

  return <Redirect href="/profile" />;
}
