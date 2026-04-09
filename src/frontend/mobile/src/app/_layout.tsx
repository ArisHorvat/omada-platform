import '@/src/i18n';
import { Slot, useSegments, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { JailbreakGuard } from '@/src/components/system/JailbreakGuard';
import { I18nPreferencesBridge } from '@/src/components/system/I18nPreferencesBridge';
import { ProfilePreferencesSync } from '@/src/components/system/ProfilePreferencesSync';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { OrganizationThemeProvider } from '../context/OrganizationThemeContext';
import { UserPreferencesProvider, useUserPreferences } from '../context/UserPreferencesContext';
import { PermissionProvider } from '../context/PermissionContext';
import { CurrentOrganizationProvider } from '../context/CurrentOrganizationContext';


const ThemedStatusBar = () => {
  const { themeMode } = useUserPreferences();
  return <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />;
};

function AuthLayout() {
  const { activeSession, isLoading } = useAuth();
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
  
  // 1. Not Logged In -> Redirect to Login
  if (!activeSession && !inAuthGroup) {
    // FIX: Redirect to your actual login route
    return <Redirect href="/login-flow" />;
  }

  // 2. Logged In -> Redirect to App (if currently in Login screens)
  if (activeSession && inAuthGroup) {
    const isRegistrationFlow = segments[1] === 'register-flow';
    
    // SuperAdmin exception
    if (activeSession.role === 'SuperAdmin' && isRegistrationFlow) {
      return <Slot />;
    }
    
    // Org-level admin tools: Admin and SuperAdmin share the same org dashboard entry.
    if (activeSession.role === 'Admin' || activeSession.role === 'SuperAdmin' || activeSession.role === 'Super Admin') {
      return <Redirect href="/org-dashboard" />;
    }
    return <Redirect href="/dashboard" />;
  }

  return <Slot />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // Keep garbage collection time high (24 hours) for offline use
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 mins
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <JailbreakGuard>
          <AuthProvider>
            <CurrentOrganizationProvider>
              <UserPreferencesProvider>
                <ProfilePreferencesSync />
                <I18nPreferencesBridge />
                <OrganizationThemeProvider>
                  <PermissionProvider>
                    <ThemedStatusBar />
                    <AuthLayout />
                  </PermissionProvider>
                </OrganizationThemeProvider>
              </UserPreferencesProvider>
            </CurrentOrganizationProvider>
          </AuthProvider>
        </JailbreakGuard>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}