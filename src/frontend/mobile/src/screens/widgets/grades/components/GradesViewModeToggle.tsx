import React from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText, ClayView } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';

export type GradesScreenMode = 'student' | 'teacher';

interface GradesViewModeToggleProps {
  mode: GradesScreenMode;
  onModeChange: (mode: GradesScreenMode) => void;
  showStudent: boolean;
  showTeacher: boolean;
}

export function GradesViewModeToggle({
  mode,
  onModeChange,
  showStudent,
  showTeacher,
}: GradesViewModeToggleProps) {
  const colors = useThemeColors();

  if (!showStudent || !showTeacher) return null;

  return (
    <View style={styles.wrap}>
      <ClayView depth={4} color={colors.card} style={styles.segment}>
        <PressClay onPress={() => onModeChange('student')} style={{ flex: 1 }}>
          <ClayView
            depth={mode === 'student' ? 6 : 1}
            color={mode === 'student' ? colors.primary : colors.background}
            style={styles.btn}
          >
            <AppText
              weight="bold"
              style={{ color: mode === 'student' ? '#FFF' : colors.subtle, textAlign: 'center' }}
            >
              My grades
            </AppText>
          </ClayView>
        </PressClay>
        <PressClay onPress={() => onModeChange('teacher')} style={{ flex: 1 }}>
          <ClayView
            depth={mode === 'teacher' ? 6 : 1}
            color={mode === 'teacher' ? colors.primary : colors.background}
            style={styles.btn}
          >
            <AppText
              weight="bold"
              style={{ color: mode === 'teacher' ? '#FFF' : colors.subtle, textAlign: 'center' }}
            >
              Teaching
            </AppText>
          </ClayView>
        </PressClay>
      </ClayView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});
