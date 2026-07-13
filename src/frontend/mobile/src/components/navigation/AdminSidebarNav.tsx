import React, { useMemo } from 'react';
import { Platform, ScrollView, View, StyleSheet } from 'react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClayView, Icon, ProgressiveImage, AppText } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { useQuery } from '@tanstack/react-query';

import { usersApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useAuth } from '@/src/context/AuthContext';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { canAccessOrgStructure } from '@/src/utils/orgAdminAccess';
import { useOrganizationTheme } from '@/src/context/OrganizationThemeContext';
import { SIDEBAR_WIDTH } from '@/src/constants/layout';
import { useThemeColors } from '@/src/hooks/useThemeColors';
import {
  ADMIN_NAV_SECTIONS,
  filterAdminNavSections,
} from '@/src/screens/admin/config/admin-navigation.config';
import { createOrgWidgetEnabledChecker } from '@/src/screens/admin/utils/orgEnabledWidgets';
import { useOrgAdminDashboardLogic } from '@/src/screens/admin/hooks/useOrgAdminDashboardLogic';

function isAdminRouteActive(pathname: string, route: string): boolean {
  const segment = route.replace(/^\//, '');
  if (segment === 'org-dashboard') {
    return pathname.includes('org-dashboard');
  }
  if (segment === 'admin-profile') {
    return pathname.includes('admin-profile') && !pathname.includes('edit-admin-profile');
  }
  return pathname.includes(segment);
}

export function AdminSidebarNav() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { primary, logoUrl } = useOrganizationTheme();
  const { organization } = useCurrentOrganization();
  const { activeSession, token } = useAuth();
  const { org } = useOrgAdminDashboardLogic();
  const { data: user } = useQuery({
    queryKey: QUERY_KEYS.userProfile(activeSession?.orgId ?? ''),
    queryFn: () => unwrap(usersApi.getMe()),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const orgName = org?.name?.trim() || organization?.name?.trim() || 'Organization';
  const enabledWidgets = org?.enabledWidgets;
  const isWidgetEnabled = useMemo(
    () => createOrgWidgetEnabledChecker(org?.organizationType ?? organization?.organizationType),
    [org?.organizationType, organization?.organizationType],
  );
  const isWeb = Platform.OS === 'web';
  const logoSize = isWeb ? 168 : 72;
  const logoIconSize = isWeb ? 56 : 32;
  const onOverview = pathname.includes('org-dashboard');

  const canStructure = canAccessOrgStructure(activeSession?.role, user?.widgetAccess);

  const sections = useMemo(
    () => filterAdminNavSections(ADMIN_NAV_SECTIONS, enabledWidgets, isWidgetEnabled, canStructure),
    [enabledWidgets, isWidgetEnabled, canStructure],
  );

  const goTo = (href: Href) => {
    if (Platform.OS === 'web') {
      router.navigate(href);
      return;
    }
    router.push(href);
  };

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
      <PressClay onPress={() => goTo('/org-dashboard')} style={[styles.logoPress, isWeb && styles.logoPressWeb]}>
        <ClayView
          depth={onOverview ? 10 : 16}
          puffy={isWeb ? 20 : 16}
          color={onOverview ? primary : colors.card}
          style={[
            styles.logoFrame,
            {
              width: logoSize,
              height: logoSize,
              borderRadius: logoSize / 2,
              padding: isWeb ? 5 : 4,
            },
          ]}
        >
          <View style={styles.logoInner}>
            {logoUrl ? (
              <ProgressiveImage source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="cover" />
            ) : (
              <Icon name="grid-view" size={logoIconSize} color={onOverview ? '#FFF' : primary} />
            )}
          </View>
        </ClayView>
        <AppText
          variant={isWeb ? 'body' : 'caption'}
          weight="bold"
          numberOfLines={2}
          style={[styles.orgName, { color: isWeb ? colors.text : colors.subtle }]}
        >
          {orgName}
        </AppText>
      </PressClay>

      <ScrollView
        style={styles.navScroll}
        contentContainerStyle={styles.navScrollContent}
        showsVerticalScrollIndicator={isWeb}
        keyboardShouldPersistTaps="handled"
      >
        {sections.map((section, sectionIndex) => (
          <View
            key={section.id}
            style={[styles.section, sectionIndex > 0 && styles.sectionDivider, { borderTopColor: colors.border }]}
          >
            <AppText variant="caption" weight="bold" style={[styles.sectionLabel, { color: colors.subtle }]}>
              {section.title.toUpperCase()}
            </AppText>
            {section.items.map((item) => {
              const active = isAdminRouteActive(pathname, item.route);
              return (
                <PressClay key={item.id} onPress={() => goTo(item.route as Href)}>
                  <View
                    style={[
                      styles.navRow,
                      active && {
                        backgroundColor: colors.primaryContainer,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Icon name={item.icon} size={22} color={active ? primary : colors.subtle} />
                    <AppText
                      variant="body"
                      weight={active ? 'bold' : 'medium'}
                      style={{ color: active ? colors.text : colors.subtle, marginLeft: 12, flex: 1 }}
                      numberOfLines={1}
                    >
                      {item.label}
                    </AppText>
                  </View>
                </PressClay>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexShrink: 0,
    flexGrow: 0,
    height: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  logoPress: {
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    flexShrink: 0,
  },
  logoPressWeb: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  logoFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
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
  orgName: {
    marginTop: 12,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 6,
    lineHeight: 20,
  },
  navScroll: {
    flex: 1,
    minHeight: 0,
  },
  navScrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  section: {
    gap: 4,
    paddingBottom: 10,
  },
  sectionDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 2,
  },
  sectionLabel: {
    marginLeft: 6,
    marginBottom: 6,
    letterSpacing: 0.5,
    fontSize: 11,
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
