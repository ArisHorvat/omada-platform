import '@/src/i18n';
import { Slot, SplashScreen, useSegments, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, ActivityIndicator, Text } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// 1. IMPORT FONTS
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { OrganizationThemeProvider } from '../context/OrganizationThemeContext';
import { UserPreferencesProvider } from '../context/UserPreferencesContext';
import { PermissionProvider } from '../context/PermissionContext';
import { useEffect } from 'react';
import { useThemeColors } from '@/src/hooks';

SplashScreen.preventAutoHideAsync();

function AuthLayout() {
  const { token, role, isLoading, isSwitching } = useAuth();
  const colors = useThemeColors();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading || isSwitching) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 20, fontSize: 16, color: colors.subtle, fontWeight: '500' }}>
          {isSwitching ? 'Switching Organization...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  const inAuthGroup = segments[0] === '(auth)';

  if (!token && !inAuthGroup) {
    return <Redirect href="/(auth)" />;
  }

  if (token && inAuthGroup) {
    const isRegistrationFlow = segments[1] === 'register-flow';
    if (role === 'SuperAdmin' && isRegistrationFlow) {
      return <Slot />;
    }
    if (role === 'Admin') {
      return <Redirect href="/org-dashboard" />;
    }
    return <Redirect href={role === 'SuperAdmin' ? "/admin-dashboard" : "/dashboard"} />;
  }

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // 2. LOAD FONTS
  const [fontsLoaded] = useFonts({
    'Body': Outfit_400Regular,
    'Heading': Outfit_600SemiBold,
    'Display': Outfit_800ExtraBold,
  });

  // 3. WAIT FOR FONTS
  // If fonts aren't loaded, return null. 
  // This keeps the Splash Screen visible because AuthLayout (which hides it) hasn't rendered yet.
  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <UserPreferencesProvider>
          <OrganizationThemeProvider>
            <PermissionProvider>
              <AuthLayout />
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            </PermissionProvider>
          </OrganizationThemeProvider>
        </UserPreferencesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}