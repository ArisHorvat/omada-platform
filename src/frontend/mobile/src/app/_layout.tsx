import '@/src/i18n';
import { Slot, useSegments, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { OrganizationThemeProvider } from '../context/OrganizationThemeContext';
import { UserPreferencesProvider, useUserPreferences } from '../context/UserPreferencesContext';
import { PermissionProvider } from '../context/PermissionContext';
import { useEffect } from 'react';

const ThemedStatusBar = () => {
  const { themeMode } = useUserPreferences();
  return <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />;
};

function AuthLayout() {
  const { activeSession, isLoading } = useAuth(); // <--- UPDATED
  const segments = useSegments();
  const [fontsLoaded] = useFonts({
    'Body': Outfit_400Regular,
    'Heading': Outfit_600SemiBold,
    'Display': Outfit_800ExtraBold,
  });

  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // --- ROUTING LOGIC ---
  const inAuthGroup = segments[0] === '(auth)';
  
  // 1. Not Logged In -> Redirect to Login (unless already there)
  if (!activeSession && !inAuthGroup) {
    return <Redirect href="/(auth)/login-flow" />;
  }

  // 2. Logged In -> Redirect to App (if currently in Login screens)
  if (activeSession && inAuthGroup) {
    const isRegistrationFlow = segments[1] === 'register-flow';
    
    // Allow SuperAdmin to stay in register flow if needed, otherwise kick to dashboard
    if (activeSession.role === 'SuperAdmin' && isRegistrationFlow) {
      return <Slot />;
    }
    
    // Normal Redirects based on Role
    if (activeSession.role === 'Admin') return <Redirect href="/org-dashboard" />;
    return <Redirect href={activeSession.role === 'SuperAdmin' ? "/admin-dashboard" : "/(app)/(tabs)/dashboard"} />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <UserPreferencesProvider>
          <OrganizationThemeProvider>
            <PermissionProvider>
              <ThemedStatusBar />
              <AuthLayout />
            </PermissionProvider>
          </OrganizationThemeProvider>
        </UserPreferencesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}