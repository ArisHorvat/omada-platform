import '@/src/i18n';
import { Slot, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { QueryClient } from '@tanstack/react-query';
import { defaultShouldDehydrateQuery } from '@tanstack/query-core';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { WebAwareSafeAreaProvider } from '@/src/components/layout/WebAwareSafeAreaProvider';
import { JailbreakGuard } from '@/src/components/system/JailbreakGuard';
import { I18nPreferencesBridge } from '@/src/components/system/I18nPreferencesBridge';
import { ProfilePreferencesSync } from '@/src/components/system/ProfilePreferencesSync';
import { AuthBootstrapOverlay } from '@/src/components/system/AuthBootstrapOverlay';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { OrganizationThemeProvider } from '../context/OrganizationThemeContext';
import { UserPreferencesProvider, useUserPreferences } from '../context/UserPreferencesContext';
import { PermissionProvider } from '../context/PermissionContext';
import { CurrentOrganizationProvider } from '../context/CurrentOrganizationContext';
import { WebMainPaneBridge } from '@/src/components/layout/WebMainPaneBridge';
import { ConfirmDialogProvider } from '../context/ConfirmDialogProvider';
import { OrgAdminExperienceProvider } from '../context/OrgAdminExperienceContext';
import { WebDocumentThemeSync } from '@/src/components/system/WebDocumentThemeSync';

const ThemedStatusBar = () => {
  const { themeMode } = useUserPreferences();
  return <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />;
};

function RootNavigation() {
  const { isLoading: authLoading } = useAuth();
  const navigationState = useRootNavigationState();
  const [fontsLoaded] = useFonts({
    Body: Outfit_400Regular,
    Heading: Outfit_600SemiBold,
    Display: Outfit_800ExtraBold,
  });

  const navigationReady = Boolean(navigationState?.key);
  const showBootstrapOverlay = !fontsLoaded || authLoading || !navigationReady;

  return (
    <View style={styles.root}>
      <Slot />
      {showBootstrapOverlay ? <AuthBootstrapOverlay /> : null}
    </View>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 5,
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
      persistOptions={{
        persister: asyncStoragePersister,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            if (!query?.queryKey || !Array.isArray(query.queryKey) || query.queryKey.length === 0) {
              return false;
            }
            const root = query.queryKey[0];
            if (root === 'schedule' || root === 'schedule-alternatives' || root === 'userProfile') {
              return false;
            }
            return defaultShouldDehydrateQuery(query);
          },
        },
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <WebAwareSafeAreaProvider>
        <JailbreakGuard>
          <AuthProvider>
            <CurrentOrganizationProvider>
              <UserPreferencesProvider>
                <WebDocumentThemeSync />
                <ProfilePreferencesSync />
                <I18nPreferencesBridge />
                <OrganizationThemeProvider>
                  <WebMainPaneBridge>
                    <ConfirmDialogProvider>
                      <OrgAdminExperienceProvider>
                        <PermissionProvider>
                          <ThemedStatusBar />
                          <RootNavigation />
                        </PermissionProvider>
                      </OrgAdminExperienceProvider>
                    </ConfirmDialogProvider>
                  </WebMainPaneBridge>
                </OrganizationThemeProvider>
              </UserPreferencesProvider>
            </CurrentOrganizationProvider>
          </AuthProvider>
        </JailbreakGuard>
        </WebAwareSafeAreaProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
