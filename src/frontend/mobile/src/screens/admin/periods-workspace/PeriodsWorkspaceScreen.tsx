import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, Switch, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { AppButton, AppText, ClayView } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { usePeriodsWorkspace } from '../grades-workspace/hooks/useGradesAdminWorkspaces';

export default function PeriodsWorkspaceScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const inputStyle = useMemo(
    () => ({
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.text,
      backgroundColor: colors.background,
      marginBottom: 10,
    }),
    [colors],
  );

  const {
    periods,
    loading,
    newName,
    setNewName,
    newStart,
    setNewStart,
    newEnd,
    setNewEnd,
    markCurrent,
    setMarkCurrent,
    createPeriod,
    deletePeriod,
    isSaving,
  } = usePeriodsWorkspace();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageContainer>
          <ScreenHeader title="Academic periods" />

          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
            <ClayView depth={3} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10, lineHeight: 20 }}>
                Define semesters, terms, or sprints for your organization. Grades and reports can reference these labels.
              </AppText>
              <TextInput value={newName} onChangeText={setNewName} placeholder="Fall 2026" placeholderTextColor={colors.subtle} style={inputStyle} />
              <TextInput value={newStart} onChangeText={setNewStart} placeholder="Start date (YYYY-MM-DD)" placeholderTextColor={colors.subtle} style={inputStyle} />
              <TextInput value={newEnd} onChangeText={setNewEnd} placeholder="End date (YYYY-MM-DD)" placeholderTextColor={colors.subtle} style={inputStyle} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <AppText variant="body" style={{ color: colors.text }}>
                  Mark as current period
                </AppText>
                <Switch value={markCurrent} onValueChange={setMarkCurrent} />
              </View>
              <AppButton title={isSaving ? 'Saving…' : 'Add period'} onPress={createPeriod} disabled={isSaving || !newName.trim()} style={{ alignSelf: 'flex-start' }} />
            </ClayView>

            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              periods.map((period) => (
                <ClayView key={period.id} depth={2} color={colors.card} style={{ borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <AppText weight="bold">{period.name}</AppText>
                      <AppText variant="caption" style={{ color: colors.subtle }}>
                        {new Date(period.startDate!).toLocaleDateString()} – {new Date(period.endDate!).toLocaleDateString()}
                      </AppText>
                      {period.isCurrent ? (
                        <AppText variant="caption" style={{ color: colors.primary, marginTop: 4 }}>
                          Current period
                        </AppText>
                      ) : null}
                    </View>
                    <AppButton title="Delete" variant="outline" onPress={() => period.id && deletePeriod(period.id, period.name ?? '')} />
                  </View>
                </ClayView>
              ))
            )}
          </ScrollView>
        </PageContainer>
      </SafeAreaView>
    </View>
  );
}
