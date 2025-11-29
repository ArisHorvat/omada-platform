import { ThemeProvider } from '@react-navigation/native';
import { Slot, SplashScreen, useSegments, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';

import { AppLightTheme, AppDarkTheme } from '../styles/common/theme';
import { OrganizationProvider } from '../context/OrganizationContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

function AuthLayout() {
  const { token, role, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null; 
  }

  const inAuthGroup = segments[0] === '(auth)';

  if (!token && !inAuthGroup) {
    return <Redirect href="/(auth)" />;
  }

  if (token && inAuthGroup) {
    const isRegistrationFlow = segments[1] === 'register' || segments[1] === 'widget-selection' || segments[1] === 'registration-success';
    if (role === 'SuperAdmin' && isRegistrationFlow) {
      return <Slot />;
    }
    return <Redirect href={role === 'SuperAdmin' ? "/admin-dashboard" : "/profile"} />;
  }

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <OrganizationProvider>
        <ThemeProvider value={colorScheme === 'dark' ? AppDarkTheme : AppLightTheme}>
          <AuthLayout />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}
