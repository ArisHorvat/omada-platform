import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { useBreakpoint, useThemeColors } from '@/src/hooks';
import {
  ADMIN_WORKSPACE_SECTIONS,
  filterAdminWorkspaceSections,
} from '../config/org-admin-workspaces';
import { isOrgWidgetEnabled } from '../utils/orgEnabledWidgets';
import { createOrgDashboardStyles } from '../styles/org-dashboard.styles';

type Props = {
  enabledWidgets?: string[] | null;
  bottomInset?: number;
};

export function AdminWorkspaceCatalog({ enabledWidgets, bottomInset = 24 }: Props) {
  const colors = useThemeColors();
  const router = useRouter();
  const { isWide } = useBreakpoint();
  const styles = useMemo(() => createOrgDashboardStyles(colors), [colors]);

  const sections = useMemo(
    () => filterAdminWorkspaceSections(ADMIN_WORKSPACE_SECTIONS, enabledWidgets, isOrgWidgetEnabled),
    [enabledWidgets],
  );

  const tileWidth = isWide ? '31%' : '47%';

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.catalogScroll, { paddingBottom: bottomInset }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.catalogHeader}>
        <AppText variant="h2" weight="bold">
          Quick access
        </AppText>
        <AppText variant="body" style={{ color: colors.subtle, marginTop: 4, lineHeight: 22 }}>
          Jump to a workspace. On desktop, use the left menu for navigation between admin areas.
        </AppText>
      </View>

      {sections.map((section) => (
        <View key={section.id} style={styles.sectionBlock}>
          <AppText variant="label" style={[styles.sectionTitle, { color: colors.subtle }]}>
            {section.title.toUpperCase()}
          </AppText>
          <View style={styles.tileGrid}>
            {section.items.map((item) => (
              <PressClay key={item.id} onPress={() => router.push(item.route as never)}>
                <ClayView
                  depth={4}
                  puffy={8}
                  color={colors.card}
                  contentOverflow="visible"
                  style={[styles.tile, { width: tileWidth as `${number}%` }]}
                >
                  <View style={[styles.tileIconWrap, { backgroundColor: colors.primary + '18' }]}>
                    <Icon name={item.icon} size={22} color={colors.primary} />
                  </View>
                  <AppText variant="body" weight="bold" numberOfLines={1}>
                    {item.title}
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }} numberOfLines={2}>
                    {item.subtitle}
                  </AppText>
                </ClayView>
              </PressClay>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
