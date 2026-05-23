import React from 'react';
import { View, StyleSheet } from 'react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClayView, Icon, type IconName, ProgressiveImage } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { AppText } from '@/src/components/ui/AppText';
import { useOrganizationTheme } from '@/src/context/OrganizationThemeContext';
import { SIDEBAR_WIDTH } from '@/src/constants/layout';
import { useThemeColors } from '@/src/hooks/useThemeColors';

type TabRouteName = 'dashboard' | 'tasks' | 'chat' | 'schedule' | 'profile';

const NAV_ITEMS: { name: TabRouteName; href: Href; icon: IconName; label: string }[] = [
  { name: 'dashboard', href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { name: 'tasks', href: '/tasks', icon: 'check-circle', label: 'Tasks' },
  { name: 'chat', href: '/chat', icon: 'chat', label: 'Chat' },
  { name: 'schedule', href: '/schedule', icon: 'calendar-today', label: 'Schedule' },
  { name: 'profile', href: '/profile', icon: 'person', label: 'Profile' },
];

function isRouteActive(pathname: string, name: TabRouteName): boolean {
  return pathname.includes(`/${name}`) || pathname.endsWith(name);
}

export function SidebarNav() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { primary, logoUrl } = useOrganizationTheme();

  const onDashboard = isRouteActive(pathname, 'dashboard');

  return (
    <View
      style={[
        styles.root,
        {
          width: SIDEBAR_WIDTH,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
          borderRightColor: colors.border,
          backgroundColor: colors.background,
        },
      ]}
    >
      <PressClay onPress={() => router.push('/dashboard')} style={styles.logoPress}>
        <ClayView
          depth={onDashboard ? 10 : 16}
          puffy={16}
          color={onDashboard ? primary : colors.card}
          style={styles.logoFrame}
        >
          <View style={styles.logoInner}>
            {logoUrl ? (
              <ProgressiveImage source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="cover" />
            ) : (
              <Icon name="grid-view" size={32} color={onDashboard ? '#FFF' : primary} />
            )}
          </View>
        </ClayView>
        <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginTop: 8, textAlign: 'center' }}>
          Home
        </AppText>
      </PressClay>

      <View style={styles.navList}>
        {NAV_ITEMS.map((item) => {
          const active = isRouteActive(pathname, item.name);
          return (
            <PressClay key={item.name} onPress={() => router.push(item.href)}>
              <View
                style={[
                  styles.navRow,
                  active && { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
                ]}
              >
                <Icon name={item.icon} size={22} color={active ? primary : colors.subtle} />
                <AppText
                  variant="body"
                  weight={active ? 'bold' : 'medium'}
                  style={{ color: active ? colors.text : colors.subtle, marginLeft: 12, flex: 1 }}
                >
                  {item.label}
                </AppText>
              </View>
            </PressClay>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  logoPress: {
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  logoFrame: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  navList: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 6,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
