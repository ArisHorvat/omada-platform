import React, { useMemo } from 'react';

import { Switch, View } from 'react-native';



import { AppButton, AppText, ClayView } from '@/src/components/ui';

import type { OrganizationPeriodDto } from '@/src/api/generatedClient';

import type { PeriodCopy } from '../utils/periodLabels';

import { useThemeColors } from '@/src/hooks';

import { AdminTextInput } from '@/src/screens/admin/components/AdminTextInput';

import { createPeriodsWorkspaceStyles } from '../styles/periods-workspace.styles';

import { formatPeriodRange } from '../utils/periodDates';

import { PeriodDateRangePicker } from './PeriodDateRangePicker';



type Props = {

  period: OrganizationPeriodDto;

  copy: PeriodCopy;

  isEditing: boolean;

  editName: string;

  editStartDate: Date;

  editEndDate: Date;

  editMarkCurrent: boolean;

  isSaving: boolean;

  isSettingCurrent: boolean;

  onEditNameChange: (value: string) => void;

  onEditStartChange: (date: Date) => void;

  onEditEndChange: (date: Date) => void;

  onEditMarkCurrentChange: (value: boolean) => void;

  onStartEdit: () => void;

  onCancelEdit: () => void;

  onSaveEdit: () => void;

  onSetCurrent: () => void;

  onDelete: () => void;

  canSaveEdit: boolean;

  onManageCourses?: (periodId: string) => void;

};



export function PeriodListCard({

  period,

  copy,

  isEditing,

  editName,

  editStartDate,

  editEndDate,

  editMarkCurrent,

  isSaving,

  isSettingCurrent,

  onEditNameChange,

  onEditStartChange,

  onEditEndChange,

  onEditMarkCurrentChange,

  onStartEdit,

  onCancelEdit,

  onSaveEdit,

  onSetCurrent,

  onDelete,

  canSaveEdit,

  onManageCourses,

}: Props) {

  const colors = useThemeColors();

  const styles = useMemo(() => createPeriodsWorkspaceStyles(colors), [colors]);



  return (

    <ClayView depth={2} color={colors.card} style={styles.periodCard}>

      {isEditing ? (

        <>

          <AppText variant="label" style={styles.sectionLabel}>

            EDIT PERIOD

          </AppText>

          <AdminTextInput

            value={editName}

            onChangeText={onEditNameChange}

            placeholder={copy.namePlaceholder}

            maxLength={120}

          />

          <AppText variant="label" style={[styles.sectionLabel, { marginBottom: 8 }]}>

            {copy.dateRangeLabel}

          </AppText>

          <PeriodDateRangePicker

            startDate={editStartDate}

            endDate={editEndDate}

            onStartChange={onEditStartChange}

            onEndChange={onEditEndChange}

          />

          <View style={styles.currentRow}>

            <AppText variant="body" style={{ color: colors.text, flex: 1 }}>

              {copy.currentToggle}

            </AppText>

            <Switch value={editMarkCurrent} onValueChange={onEditMarkCurrentChange} />

          </View>

          <View style={styles.editActions}>

            <AppButton title="Save" onPress={onSaveEdit} disabled={isSaving || !canSaveEdit} style={{ minWidth: 90 }} />

            <AppButton title="Cancel" variant="outline" onPress={onCancelEdit} style={{ minWidth: 90 }} />

          </View>

        </>

      ) : (

        <>

          <View style={styles.periodHeader}>

            <View style={styles.periodMeta}>

              <AppText variant="body" weight="bold" numberOfLines={2}>

                {period.name}

              </AppText>

              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>

                {formatPeriodRange(period.startDate, period.endDate)}

              </AppText>

              {period.isCurrent ? (

                <View style={styles.currentPill}>

                  <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>

                    {copy.currentBadge}

                  </AppText>

                </View>

              ) : null}

            </View>

          </View>

          <View style={styles.periodActions}>

            {onManageCourses && period.id ? (
              <AppButton
                title="Term courses"
                variant="secondary"
                onPress={() => onManageCourses(period.id!)}
                style={{ minWidth: 0 }}
              />
            ) : null}

            <AppButton title="Edit" variant="outline" onPress={onStartEdit} style={{ minWidth: 68 }} />

            {!period.isCurrent ? (

              <AppButton

                title={isSettingCurrent ? 'Updating…' : copy.setCurrentButton}

                onPress={onSetCurrent}

                disabled={isSettingCurrent || isSaving}

                style={{ minWidth: 0 }}

              />

            ) : null}

            <AppButton title="Delete" variant="outline" onPress={onDelete} style={{ minWidth: 72 }} />

          </View>

        </>

      )}

    </ClayView>

  );

}


