import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { AppButton, AppText, ClayView } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { useThemeColors } from '@/src/hooks';
import { adminWorkspaceScrollContent } from '@/src/screens/admin/styles/adminWorkspaceLayout';
import { useGradesWorkspace } from './hooks/useGradesAdminWorkspaces';

export default function GradesWorkspaceScreen() {
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
    grades,
    totalCount,
    loading,
    semesterFilter,
    setSemesterFilter,
    periods,
    studentUserId,
    setStudentUserId,
    studentSearch,
    setStudentSearch,
    selectedStudentName,
    selectStudent,
    clearSelectedStudent,
    memberSuggestions,
    courseName,
    setCourseName,
    score,
    setScore,
    credits,
    setCredits,
    letterGrade,
    setLetterGrade,
    semester,
    setSemester,
    periodCopy,
    createGrade,
    deleteGrade,
    isSaving,
  } = useGradesWorkspace();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageContainer fullBleed>
          <ScreenHeader title="Grades management" />

          <ScrollView contentContainerStyle={[adminWorkspaceScrollContent, { paddingBottom: insets.bottom + 24 }]}>
            <ClayView depth={3} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
                ADD GRADE
              </AppText>
              {selectedStudentName ? (
                <ClayView depth={2} color={colors.card} style={{ borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <AppText weight="bold">{selectedStudentName}</AppText>
                  <AppButton title="Change student" variant="outline" onPress={clearSelectedStudent} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
                </ClayView>
              ) : (
                <>
                  <TextInput value={studentSearch} onChangeText={setStudentSearch} placeholder="Search student by name or email" placeholderTextColor={colors.subtle} autoCapitalize="none" style={inputStyle} />
                  {memberSuggestions.map((member) => (
                    <PressClay
                      key={member.userId}
                      onPress={() =>
                        member.userId &&
                        selectStudent(member.userId, `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim())
                      }
                    >
                      <ClayView depth={2} color={colors.card} style={{ borderRadius: 10, padding: 12, marginBottom: 8 }}>
                        <AppText weight="bold">{member.firstName} {member.lastName}</AppText>
                        <AppText variant="caption" style={{ color: colors.subtle }}>{member.email}</AppText>
                      </ClayView>
                    </PressClay>
                  ))}
                </>
              )}
              <TextInput value={courseName} onChangeText={setCourseName} placeholder="Course name" placeholderTextColor={colors.subtle} style={inputStyle} />
              <TextInput value={score} onChangeText={setScore} placeholder="Score" placeholderTextColor={colors.subtle} keyboardType="decimal-pad" style={inputStyle} />
              <TextInput value={credits} onChangeText={setCredits} placeholder="Credits" placeholderTextColor={colors.subtle} keyboardType="decimal-pad" style={inputStyle} />
              <TextInput value={letterGrade} onChangeText={setLetterGrade} placeholder="Letter grade (optional)" placeholderTextColor={colors.subtle} style={inputStyle} />
              <TextInput
                value={semester}
                onChangeText={setSemester}
                placeholder={periodCopy.gradesFieldLabel}
                placeholderTextColor={colors.subtle}
                style={inputStyle}
              />
              {periods.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {periods.map((p) => (
                    <AppButton key={p.id} title={p.name ?? ''} variant="outline" onPress={() => setSemester(p.name ?? '')} style={{ minWidth: 90 }} />
                  ))}
                </View>
              ) : null}
              <AppButton title={isSaving ? 'Saving…' : 'Add grade'} onPress={createGrade} disabled={isSaving || !studentUserId.trim() || !courseName.trim()} />
            </ClayView>

            <TextInput
              value={semesterFilter}
              onChangeText={setSemesterFilter}
              placeholder={periodCopy.gradesFilterPlaceholder}
              placeholderTextColor={colors.subtle}
              style={inputStyle}
            />

            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
              {totalCount} grade record{totalCount === 1 ? '' : 's'}
            </AppText>

            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              grades.map((grade) => (
                <ClayView key={grade.id} depth={2} color={colors.card} style={{ borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <AppText weight="bold">{grade.courseName}</AppText>
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    {grade.studentName ?? grade.userId} · {grade.semester}
                  </AppText>
                  <AppText variant="body" style={{ marginTop: 4 }}>
                    Score {grade.score} · {grade.credits} cr · {grade.letterGrade ?? '—'}
                  </AppText>
                  <AppButton title="Delete" variant="outline" onPress={() => grade.id && deleteGrade(grade.id)} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
                </ClayView>
              ))
            )}
          </ScrollView>
        </PageContainer>
      </SafeAreaView>
    </View>
  );
}
