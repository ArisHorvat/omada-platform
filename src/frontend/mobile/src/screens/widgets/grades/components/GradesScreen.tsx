import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SplitPane } from '@/src/components/layout/SplitPane';
import { WidgetPageShell } from '@/src/components/layout';
import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { useThemeColors, useBreakpoint } from '@/src/hooks';
import {
  AppText,
  Icon,
  ClayView,
  Skeleton,
  WidgetErrorState,
  WidgetEmptyState,
} from '@/src/components/ui';
import { AnimatedItem } from '@/src/components/animations/AnimatedItem';
import { createStyles } from '../styles/grades.styles';
import { ScreenTransition } from '@/src/components/animations';
import { displayLetterOrScore, computeSemesterGpaTrend } from '../utils/gradesTrend';
import type { GradeDto } from '@/src/api/generatedClient';
import { GradesBiometricGate } from './GradesBiometricGate';
import { GradesFilterChips } from './GradesFilterChips';
import { GradesGpaLineChart } from './GradesGpaLineChart';
import { useGradesScreenLogic } from '../hooks/useGradesScreenLogic';

type TranscriptRow =
  | { type: 'header'; id: string; semester: string }
  | { type: 'grade'; id: string; grade: GradeDto };

function buildTranscriptRows(grades: GradeDto[]): TranscriptRow[] {
  const bySem = new Map<string, GradeDto[]>();
  for (const g of grades) {
    const arr = bySem.get(g.semester) ?? [];
    arr.push(g);
    bySem.set(g.semester, arr);
  }

  const ordered = Array.from(bySem.entries()).sort((a, b) => {
    const maxA = Math.max(...a[1].map((x) => new Date(x.createdAt).getTime()));
    const maxB = Math.max(...b[1].map((x) => new Date(x.createdAt).getTime()));
    return maxB - maxA;
  });

  const rows: TranscriptRow[] = [];
  for (const [semester, list] of ordered) {
    rows.push({ type: 'header', id: `h-${semester}`, semester });
    const sorted = list.slice().sort((a, b) => a.courseName.localeCompare(b.courseName));
    for (const g of sorted) {
      rows.push({ type: 'grade', id: g.id, grade: g });
    }
  }
  return rows;
}

function GradesScreenContent() {
  const colors = useThemeColors();
  const { isWideShell } = useBreakpoint();
  const styles = createStyles(colors);

  const {
    grades,
    currentGpa,
    totalCredits,
    isLoading,
    isError,
    refetchGrades,
    gradesQuery,
    canView,
    permissionsLoading,
    activeGroupId,
    setActiveGroupId,
    activeSemester,
    setActiveSemester,
    semesters,
    assignableGroups,
    isFiltered,
  } = useGradesScreenLogic();

  const rows = useMemo(() => buildTranscriptRows(grades), [grades]);
  const trend = useMemo(() => computeSemesterGpaTrend(grades), [grades]);

  const groupChips = useMemo(
    () => (assignableGroups ?? []).map((g) => ({ id: g.id, label: g.name })),
    [assignableGroups],
  );
  const semesterChips = useMemo(
    () => semesters.map((s) => ({ id: s, label: s })),
    [semesters],
  );

  if (!permissionsLoading && !canView) {
    return (
      <WidgetPageShell>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <ScreenHeader title="Academic Record" />
            <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
              <WidgetEmptyState
                title="Grades unavailable"
                description="You do not have permission to view grades in this organization."
                icon="lock"
              />
            </View>
          </SafeAreaView>
        </View>
      </WidgetPageShell>
    );
  }

  const listHeader = (
    <ScreenTransition style={styles.heroContainer}>
      <ClayView depth={12} puffy={0} color={colors.secondary} style={[styles.heroPanel, { flex: 1 }]}>
        <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
          <ScreenHeader
            title="Academic Record"
            tone="inverse"
            compact
            style={{ paddingHorizontal: 0, paddingTop: 4, paddingBottom: 4 }}
          />

          <View style={styles.heroContent}>
            <View style={{ flex: 1 }}>
              {isLoading ? (
                <>
                  <Skeleton width={140} height={56} borderRadius={12} />
                  <Skeleton width={180} height={14} borderRadius={8} style={{ marginTop: 8 }} />
                </>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <AppText
                      variant="display"
                      weight="bold"
                      style={{ color: colors.onSecondary, fontSize: 64, lineHeight: 70 }}
                    >
                      {currentGpa.toFixed(2)}
                    </AppText>
                    <AppText variant="h2" style={{ color: colors.onSecondary, opacity: 0.85, marginLeft: 8 }}>
                      GPA
                    </AppText>
                  </View>
                  <AppText variant="caption" style={{ color: colors.onSecondary, opacity: 0.75, marginTop: 4 }}>
                    {isFiltered ? 'Filtered' : 'Cumulative'}
                    {totalCredits > 0 ? ` · ${totalCredits} credits` : ''}
                  </AppText>
                  {trend.length >= 2 ? (
                    <View style={{ marginTop: 12 }}>
                      <GradesGpaLineChart points={trend} accentColor={colors.onSecondary} />
                    </View>
                  ) : null}
                </>
              )}
            </View>
            <View style={styles.heroIcon}>
              <Icon name="school" size={60} color={colors.onSecondary} style={{ opacity: 0.35 }} />
            </View>
          </View>
        </SafeAreaView>
      </ClayView>
    </ScreenTransition>
  );

  const filterBars = (
    <>
      <GradesFilterChips
        chips={groupChips}
        activeId={activeGroupId}
        onSelect={setActiveGroupId}
        allLabel="All courses"
      />
      <GradesFilterChips
        chips={semesterChips}
        activeId={activeSemester}
        onSelect={setActiveSemester}
        allLabel="All terms"
      />
    </>
  );

  const transcriptList = (
    <FlashList
      data={rows}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        isWideShell ? (
          filterBars
        ) : (
          <>
            {listHeader}
            {filterBars}
          </>
        )
      }
      contentContainerStyle={styles.flashContent}
      renderItem={({ item, index }) => {
        if (item.type === 'header') {
          return (
            <AnimatedItem index={index}>
              <AppText
                variant="caption"
                weight="bold"
                style={{ color: colors.subtle, marginTop: index === 0 ? 8 : 20, marginBottom: 8 }}
              >
                {item.semester}
              </AppText>
            </AnimatedItem>
          );
        }

        const g = item.grade;
        return (
          <AnimatedItem index={index}>
            <ClayView
              depth={6}
              puffy={12}
              color={colors.card}
              style={[localStyles.row, { borderWidth: 1, borderColor: colors.border }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.subjectIcon, { backgroundColor: colors.background }]}>
                  <AppText weight="bold" style={{ color: colors.subtle }}>
                    {g.courseName.charAt(0).toUpperCase()}
                  </AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" weight="bold" numberOfLines={2}>
                    {g.courseName}
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    {g.groupName ? `${g.groupName} • ` : ''}
                    Score {g.score.toFixed(0)} • {g.credits} cr.
                  </AppText>
                </View>
              </View>
              <View style={[styles.gradeBadge, { backgroundColor: colors.primary + '18' }]}>
                <AppText variant="h3" weight="bold" style={{ color: colors.primary }}>
                  {displayLetterOrScore(g)}
                </AppText>
              </View>
            </ClayView>
          </AnimatedItem>
        );
      }}
    />
  );

  if (isError) {
    return (
      <WidgetPageShell>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <ScreenHeader title="Academic Record" />
            <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
              <WidgetErrorState message="Could not load grades." onRetry={() => void refetchGrades()} />
            </View>
          </SafeAreaView>
        </View>
      </WidgetPageShell>
    );
  }

  return (
    <WidgetPageShell>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {isLoading && grades.length === 0 ? (
          <View style={{ flex: 1 }}>
            <SafeAreaView edges={['top']}>
              <ScreenHeader title="Academic Record" />
            </SafeAreaView>
            <View style={{ flex: 1, padding: 20 }}>
            <Skeleton height={200} borderRadius={24} />
            <Skeleton height={72} borderRadius={16} style={{ marginTop: 16 }} />
            <Skeleton height={72} borderRadius={16} style={{ marginTop: 12 }} />
            </View>
          </View>
        ) : grades.length === 0 ? (
          <View style={{ flex: 1, paddingHorizontal: 24 }}>
            {listHeader}
            {filterBars}
            <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 40 }}>
              <WidgetEmptyState
                title={isFiltered ? 'No grades in this view' : 'No grades posted yet'}
                description={
                  isFiltered
                    ? 'Try another course or term filter.'
                    : 'When your institution posts grades, they will appear here.'
                }
                icon="school"
              />
            </View>
          </View>
        ) : isWideShell ? (
          <SplitPane
            sidebar={
              <>
                {listHeader}
                {filterBars}
              </>
            }
            sidebarWidth={360}
          >
            <View style={{ flex: 1 }}>{transcriptList}</View>
          </SplitPane>
        ) : (
          <View style={{ flex: 1 }}>{transcriptList}</View>
        )}
      </View>
    </WidgetPageShell>
  );
}

const localStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
});

export default function GradesScreen() {
  return (
    <GradesBiometricGate>
      <GradesScreenContent />
    </GradesBiometricGate>
  );
}
