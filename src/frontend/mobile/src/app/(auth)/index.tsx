import { Redirect } from 'expo-router';

import { useAuth } from '@/src/context/AuthContext';
import { homeHrefForRole } from '@/src/utils/authRoutes';
import LandingScreen from '@/src/screens/auth/landing/components/landing';

export default function LandingRoute() {
  const { activeSession, isLoading } = useAuth();

  if (!isLoading && activeSession) {
    return <Redirect href={homeHrefForRole(activeSession.role)} />;
  }

  return <LandingScreen />;
}
