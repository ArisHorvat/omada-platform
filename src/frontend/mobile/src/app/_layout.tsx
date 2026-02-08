import '@/src/i18n';
import { Slot, SplashScreen, useSegments, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// 1. IMPORT FONTS
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { OrganizationThemeProvider } from '../context/OrganizationThemeContext';
import { UserPreferencesProvider, useUserPreferences } from '../context/UserPreferencesContext';
import { PermissionProvider } from '../context/PermissionContext';
import { useEffect } from 'react';
import { useThemeColors } from '@/src/hooks';

SplashScreen.preventAutoHideAsync();

// ----------------------------------------------------------------------
// HELPER: Handles Status Bar Logic Separately
// ----------------------------------------------------------------------
const ThemedStatusBar = () => {
  const { themeMode } = useUserPreferences();
  return <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />;
};

// ----------------------------------------------------------------------
// LAYOUT: Handles Routing & Loading (The "Brain")
// ----------------------------------------------------------------------
function AuthLayout() {
  const { token, role, isLoading, isSwitching } = useAuth();
  const colors = useThemeColors();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // 1. LOADING STATE
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

  // 2. REDIRECTS (Protected Routes)
  if (!token && !inAuthGroup) {
    return <Redirect href="/(auth)" />;
  }

  if (token && inAuthGroup) {
    const isRegistrationFlow = segments[1] === 'register-flow';
    
    // SuperAdmin special flow
    if (role === 'SuperAdmin' && isRegistrationFlow) {
      return <Slot />;
    }
    
    // Normal Dashboard Redirects
    if (role === 'Admin') return <Redirect href="/org-dashboard" />;
    return <Redirect href={role === 'SuperAdmin' ? "/admin-dashboard" : "/dashboard"} />;
  }

  // 3. RENDER CONTENT
  return <Slot />;
}

// ----------------------------------------------------------------------
// ROOT: Connects Providers (The "Skeleton")
// ----------------------------------------------------------------------
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Body': Outfit_400Regular,
    'Heading': Outfit_600SemiBold,
    'Display': Outfit_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <UserPreferencesProvider>
          <OrganizationThemeProvider>
            <PermissionProvider>
              
              {/* ✅ 1. Status Bar is always rendered here, regardless of loading state */}
              <ThemedStatusBar />

              {/* ✅ 2. Auth Logic handles the actual screens */}
              <AuthLayout />

            </PermissionProvider>
          </OrganizationThemeProvider>
        </UserPreferencesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}