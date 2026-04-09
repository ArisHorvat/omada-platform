import React, { useMemo } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { ClayView } from '@/src/components/ui/ClayView';
import { ClayGroupedSection } from '@/src/components/ui/ClayGroupedSection';
import { AppText } from '@/src/components/ui/AppText';
import { ToggleSwitch } from '@/src/components/ui/ToggleSwitch';
import { Icon } from '@/src/components/ui/Icon';
import { PressClay } from '@/src/components/animations/PressClay';
import { useThemeColors } from '@/src/hooks';
import { orgApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useSettingsPreferencesLogic } from '@/src/screens/widgets/settings/hooks/useSettingsPreferencesLogic';
import type { LanguagePreferenceCode } from '@/src/stores/usePreferencesStore';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const {
    darkModeEnabled,
    setDarkModeEnabled,
    languagePreference,
    setLanguage,
    newsAlerts,
    chatMessages,
    setNewsAlerts,
    setChatMessages,
    hideContactInDirectory,
    setHideContactInDirectory,
    isSaving,
  } = useSettingsPreferencesLogic();

  const { data: organizationData, isLoading: orgLoading } = useQuery({
    queryKey: QUERY_KEYS.organization(orgId),
    queryFn: async () => await unwrap(orgApi.getById(orgId)),
    enabled: !!orgId,
  });

  const rowDivider = { borderBottomWidth: 1, borderBottomColor: colors.border };

  const toggleRow = (
    label: string,
    subtitle: string | undefined,
    value: boolean,
    onChange: (v: boolean) => void,
    last?: boolean
  ) => (
    <View style={[rowDivider, last && { borderBottomWidth: 0 }, { paddingVertical: 14, paddingHorizontal: 16 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <AppText variant="body" weight="medium">
            {label}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" style={{ marginTop: 4 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <ToggleSwitch value={value} onValueChange={onChange} />
      </View>
    </View>
  );

  const langChip = (code: LanguagePreferenceCode, label: string) => {
    const active = languagePreference === code;
    return (
      <View style={{ flex: 1 }}>
        <PressClay
          onPress={() => {
            void setLanguage(code);
          }}
        >
          <View
            style={{
              paddingVertical: 14,
              borderRadius: 16,
              alignItems: 'center',
              backgroundColor: active ? colors.primaryContainer : colors.card,
              borderWidth: active ? 2 : 1,
              borderColor: active ? colors.primary : colors.border,
            }}
          >
            <AppText variant="body" weight={active ? 'bold' : 'regular'}>
              {label}
            </AppText>
          </View>
        </PressClay>
      </View>
    );
  };

  const header = useMemo(
    () => (
      <ClayView depth={12} puffy={16} style={{ marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 8, paddingVertical: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PressClay onPress={() => router.back()}>
            <View style={{ padding: 8 }}>
              <Icon name="arrow-back" size={24} color={colors.text} />
            </View>
          </PressClay>
          <AppText variant="h2" weight="bold" style={{ marginLeft: 8 }}>
            Settings
          </AppText>
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 'auto', marginRight: 8 }} />
          ) : null}
        </View>
      </ClayView>
    ),
    [colors.primary, colors.text, isSaving, router]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {header}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <ClayGroupedSection title="Appearance">
          {toggleRow(
            'Dark mode',
            'Uses a dark palette across the app.',
            darkModeEnabled,
            (v) => {
              void setDarkModeEnabled(v);
            }
          )}
          <View style={[rowDivider, { borderBottomWidth: 0, paddingHorizontal: 16, paddingVertical: 12 }]}>
            <AppText variant="body" weight="medium" style={{ marginBottom: 10 }}>
              Language
            </AppText>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {langChip('en', 'English')}
              {langChip('ro', 'Română')}
            </View>
          </View>
        </ClayGroupedSection>

        <ClayGroupedSection title="Notifications">
          {toggleRow('News alerts', 'Highlights and announcements.', newsAlerts, (v) => void setNewsAlerts(v))}
          {toggleRow(
            'Chat messages',
            'Alerts for new chat activity.',
            chatMessages,
            (v) => void setChatMessages(v),
            true
          )}
        </ClayGroupedSection>

        <ClayGroupedSection title="Privacy">
          {toggleRow(
            'Hide phone & email in directory',
            'Other members will not see your contact details in the directory.',
            hideContactInDirectory,
            (v) => void setHideContactInDirectory(v),
            true
          )}
        </ClayGroupedSection>

        <ClayGroupedSection title="Security">
          <PressClay onPress={() => router.push('/security')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}>
              <Icon name="security" size={22} color={colors.primary} />
              <AppText variant="body" weight="medium" style={{ flex: 1, marginLeft: 12 }}>
                Advanced security
              </AppText>
              <Icon name="chevron-right" size={22} color={colors.subtle} />
            </View>
          </PressClay>
        </ClayGroupedSection>

        <ClayGroupedSection title="Organization">
          <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
            {orgLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <AppText variant="body" weight="medium">
                  {organizationData?.name || organization?.name || 'Your organization'}
                </AppText>
                {organizationData?.shortName ? (
                  <AppText variant="caption" style={{ marginTop: 6 }}>
                    {organizationData.shortName}
                  </AppText>
                ) : null}
              </>
            )}
          </View>
        </ClayGroupedSection>
      </ScrollView>
    </SafeAreaView>
  );
}
