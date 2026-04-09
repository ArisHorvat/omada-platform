import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { useThemeColors } from '@/src/hooks';
import { AppText, Icon, ClayView, Skeleton, WidgetErrorState, EmptyState } from '@/src/components/ui';
import { AnimatedItem } from '@/src/components/animations/AnimatedItem';
import { createStyles } from '../styles/grades.styles';
import { ScreenTransition } from '@/src/components/animations';
import { useGradesLogic } from '../hooks/useGradesLogic';
import { displayLetterOrScore } from '../utils/gradesTrend';
import type { GradeDto } from '@/src/api/generatedClient';
import { GradesBiometricGate } from './GradesBiometricGate';

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
  const styles = createStyles(colors);

  const {
    grades,
    currentGpa,
    totalCredits,
    isLoading,
    isError,
    refetchGrades,
    gradesQuery,
  } = useGradesLogic();

  const rows = useMemo(() => buildTranscriptRows(grades), [grades]);

  const listHeader = (
    <ScreenTransition style={styles.heroContainer}>
      <ClayView depth={12} puffy={0} color={colors.secondary} style={[styles.heroPanel, { flex: 1 }]}>
        <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
          <View style={[styles.navBar, { paddingLeft: 60, marginTop: 10 }]}>
            <AppText variant="h3" weight="bold" style={{ color: colors.onSecondary }}>
              Academic Record
            </AppText>
          </View>

          <View style={styles.heroContent}>
            <View>
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
                    Cumulative{totalCredits > 0 ? ` • ${totalCredits} credits` : ''}
                  </AppText>
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

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ClayBackButton absolute />
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          <WidgetErrorState message="Could not load grades." onRetry={() => void refetchGrades()} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ClayBackButton absolute />

      {isLoading && grades.length === 0 ? (
        <View style={{ flex: 1, padding: 20, paddingTop: 120 }}>
          <Skeleton height={200} borderRadius={24} />
          <Skeleton height={72} borderRadius={16} style={{ marginTop: 16 }} />
          <Skeleton height={72} borderRadius={16} style={{ marginTop: 12 }} />
        </View>
      ) : grades.length === 0 ? (
        <View style={{ flex: 1, paddingTop: 100, paddingHorizontal: 24 }}>
          {listHeader}
          <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 40 }}>
            <EmptyState
              title="No grades posted yet"
              description="When your institution posts grades, they will appear here."
              icon="book"
            />
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
        <FlashList
          data={rows}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
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
        </View>
      )}
    </View>
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
