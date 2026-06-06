import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { AppButton, AppText, ClayView, Icon, type IconName } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { useThemeColors } from '@/src/hooks';
import { BASE_WIDGETS } from '@/src/constants/widgets';
import { useWidgetsWorkspace } from './hooks/useWidgetsWorkspace';

export default function WidgetsWorkspaceScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { widgets, loading, enabledSet, toggleWidget, save, isSaving, hasChanges } = useWidgetsWorkspace();

  const rows = useMemo(
    () =>
      widgets.map((w) => {
        const mobileDef = BASE_WIDGETS[w.key ?? ''];
        return {
          key: w.key ?? '',
          name: mobileDef?.name ?? w.name ?? w.key ?? '',
          description: w.description ?? '',
          icon: (mobileDef?.icon ?? 'widgets') as IconName,
          enabled: enabledSet.has((w.key ?? '').toLowerCase()),
        };
      }),
    [enabledSet, widgets],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageContainer>
          <ScreenHeader
            title="Widget catalog"
            subtitle="Choose which features are available organization-wide. Role permissions still control who can access each enabled widget."
          />

          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
              {rows.map((row) => (
                <PressClay key={row.key} onPress={() => toggleWidget(row.key)}>
                  <ClayView
                    depth={row.enabled ? 6 : 2}
                    color={colors.card}
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      opacity: row.enabled ? 1 : 0.65,
                    }}
                  >
                    <ClayView
                      depth={2}
                      color={row.enabled ? colors.primary + '22' : colors.border}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name={row.icon} size={22} color={row.enabled ? colors.primary : colors.subtle} />
                    </ClayView>
                    <View style={{ flex: 1 }}>
                      <AppText weight="bold">{row.name}</AppText>
                      <AppText variant="caption" style={{ color: colors.subtle }}>
                        {row.description}
                      </AppText>
                    </View>
                    <Icon
                      name={row.enabled ? 'check-circle' : 'radio-button-unchecked'}
                      size={24}
                      color={row.enabled ? colors.success : colors.subtle}
                    />
                  </ClayView>
                </PressClay>
              ))}

              <AppButton
                title={isSaving ? 'Saving…' : 'Save widget catalog'}
                onPress={save}
                disabled={isSaving || !hasChanges}
                style={{ marginTop: 8 }}
              />
            </ScrollView>
          )}
        </PageContainer>
      </SafeAreaView>
    </View>
  );
}
