import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { TextInput, View } from 'react-native';

import { AppButton, AppText, ClayView, Icon, WidgetEmptyState } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { OrganizationType } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { createPeriodsWorkspaceStyles } from '../styles/periods-workspace.styles';
import { usePeriodOfferings } from '../hooks/usePeriodOfferings';
import { useProgramGroupOptions } from '../hooks/useProgramGroupOptions';
import { OfferingCreditsField } from './OfferingCreditsField';
import { OfferingAttendanceRuleField } from './OfferingAttendanceRuleField';
import { TermOfferingSessionCard } from '../../offerings-workspace/components/TermOfferingSessionCard';

type Props = {
  periodId: string;
  periodName: string;
  onClose: () => void;
};

export function PeriodOfferingsPanel({ periodId, periodName, onClose }: Props) {
  const colors = useThemeColors();
  const router = useRouter();
  const styles = useMemo(() => createPeriodsWorkspaceStyles(colors), [colors]);
  const { organization } = useCurrentOrganization();
  const isUniversity = organization?.organizationType === OrganizationType.University;
  const [programPickerOpen, setProgramPickerOpen] = useState(false);
  const { options: programOptions } = useProgramGroupOptions();

  const {
    offerings,
    loading,
    newName,
    setNewName,
    programGroupId,
    setProgramGroupId,
    bulkNames,
    setBulkNames,
    createOffering,
    setupProgramTerm,
    enrollProgramCohorts,
    enrollLinkedPrograms,
    confirmDeleteOffering,
    updateOfferingCredits,
    updateOfferingAttendanceRule,
    isSaving,
  } = usePeriodOfferings(periodId);

  const programLabel = useMemo(() => {
    if (!programGroupId.trim()) return 'Select degree program';
    return programOptions.find((o) => o.value === programGroupId.trim())?.label ?? 'Selected program';
  }, [programGroupId, programOptions]);

  if (!isUniversity) {
    return (
      <ClayView depth={2} color={colors.card} style={styles.periodCard}>
        <AppText variant="body" style={{ color: colors.subtle }}>
          Course offerings are configured for university organizations. Corporate orgs use reporting periods for grades only.
        </AppText>
        <AppButton title="Close" variant="outline" onPress={onClose} style={{ marginTop: 12, alignSelf: 'flex-start' }} />
      </ClayView>
    );
  }

  return (
    <ClayView depth={3} color={colors.card} style={styles.periodCard}>
      <AppText variant="h3" weight="bold" style={{ marginBottom: 4 }}>
        Course offerings — {periodName}
      </AppText>
      <AppText variant="caption" style={styles.sectionHint}>
        Add course offerings for this term (e.g. Linear Algebra). Enroll stable student groups from the program tree — no duplicate groups per course.
      </AppText>
      <AppButton
        title="Manage curriculum packages"
        variant="outline"
        onPress={() => router.push('/offerings-workspace')}
        style={{ alignSelf: 'flex-start', marginBottom: 12 }}
      />

      <AppText variant="label" style={styles.sectionLabel}>
        QUICK TERM SETUP
      </AppText>
      <AppText variant="caption" style={styles.sectionHint}>
        Choose a program, then offering names (comma or newline). Enrolls all student groups under that program for this term.
      </AppText>
      <PressClay onPress={() => setProgramPickerOpen(true)}>
        <ClayView depth={1} color={colors.background} style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}>
          <Icon name="account-tree" size={20} color={colors.primary} style={{ marginRight: 10 }} />
          <AppText variant="body" style={{ flex: 1, color: programGroupId ? colors.text : colors.subtle }}>
            {programLabel}
          </AppText>
          <Icon name="expand-more" size={22} color={colors.subtle} />
        </ClayView>
      </PressClay>
      <TextInput
        value={bulkNames}
        onChangeText={setBulkNames}
        placeholder="Linear Algebra, Algorithms, Databases…"
        placeholderTextColor={colors.subtle}
        style={[styles.input, { minHeight: 72 }]}
        multiline
      />
      <AppButton
        title={isSaving ? 'Working…' : 'Setup program for this term'}
        onPress={setupProgramTerm}
        disabled={isSaving || !programGroupId.trim()}
        style={{ alignSelf: 'flex-start', marginBottom: 16 }}
      />

      <AppText variant="label" style={styles.sectionLabel}>
        ADD SINGLE OFFERING
      </AppText>
      <TextInput
        value={newName}
        onChangeText={setNewName}
        placeholder="e.g. Linear Algebra"
        placeholderTextColor={colors.subtle}
        style={styles.input}
      />
      <AppButton
        title="Add offering"
        variant="secondary"
        onPress={createOffering}
        disabled={isSaving || !newName.trim()}
        style={{ alignSelf: 'flex-start', marginBottom: 16 }}
      />

      <AppText variant="label" style={styles.sectionLabel}>
        OFFERINGS ({offerings.length})
      </AppText>

      {loading && !offerings.length ? (
        <AppText variant="caption" style={{ color: colors.subtle }}>Loading…</AppText>
      ) : !offerings.length ? (
        <WidgetEmptyState
          icon="school"
          title="No offerings yet"
          description="Use quick setup or add offerings individually."
        />
      ) : (
        offerings.map((o) => (
          <ClayView key={o.id} depth={1} color={colors.background} style={{ padding: 12, borderRadius: 12, marginBottom: 10 }}>
            <AppText variant="body" weight="bold" style={{ color: colors.text }}>
              {o.name}
              {o.code ? ` (${o.code})` : ''}
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
              {o.enrollmentCount} enrolled
              {o.programGroupNames?.length
                ? ` · ${o.programGroupNames.join(', ')}`
                : o.programGroupName
                  ? ` · ${o.programGroupName}`
                  : ''}
              {o.hostName ? ` · ${o.hostName}` : ''}
              {typeof o.credits === 'number' && o.credits > 0 ? ` · ${o.credits} cr.` : ''}
            </AppText>
            <OfferingCreditsField offering={o} saving={isSaving} onSave={updateOfferingCredits} />
            {isUniversity ? (
              <OfferingAttendanceRuleField
                offering={o}
                saving={isSaving}
                onSave={updateOfferingAttendanceRule}
              />
            ) : null}
            {isUniversity ? (
              <TermOfferingSessionCard periodId={periodId} offering={o} />
            ) : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              <AppButton
                title="Enroll linked programs"
                size="sm"
                variant="outline"
                onPress={() => enrollLinkedPrograms(o.id)}
                disabled={isSaving}
              />
              <AppButton
                title="Delete"
                size="sm"
                variant="outline"
                onPress={() => confirmDeleteOffering(o)}
                disabled={isSaving}
              />
            </View>
          </ClayView>
        ))
      )}

      <AppButton title="Close offerings" variant="outline" onPress={onClose} style={{ marginTop: 8, alignSelf: 'flex-start' }} />

      <SearchableOptionPickerSheet
        isVisible={programPickerOpen}
        onClose={() => setProgramPickerOpen(false)}
        title="Choose program"
        searchPlaceholder="Search programs…"
        options={programOptions}
        selected={programGroupId.trim() || null}
        onSelect={(id) => setProgramGroupId(id ?? '')}
        allLabel="No program"
        height={480}
        zIndexBase={300}
      />
    </ClayView>
  );
}
