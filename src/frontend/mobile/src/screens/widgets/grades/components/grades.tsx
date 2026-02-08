import React from 'react';
import { View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { useThemeColors } from '@/src/hooks';
import { GlassView, AppText, Icon } from '@/src/components/ui';
import { AnimatedItem } from '@/src/components/animations/AnimatedItem';
import { createStyles } from '../styles/grades.styles';
import { ScreenTransition } from '@/src/components/animations';


const GRADES = [
  { id: '1', subject: 'Mathematics', grade: 'A', score: '95%' },
  { id: '2', subject: 'Physics', grade: 'B+', score: '88%' },
  { id: '3', subject: 'Computer Science', grade: 'A-', score: '92%' },
  { id: '4', subject: 'History', grade: 'B', score: '85%' },
  { id: '5', subject: 'English', grade: 'A', score: '98%' },
];

export default function GradesScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Floating Back Button (Top Level) */}
      <ClayBackButton />
      
      {/* HERO HEADER (Animated Container) */}
      {/* This matches the 'widget-grades' tag from dashboard */}
      <ScreenTransition 
        style={styles.heroContainer}
      >
        <GlassView 
          intensity={90} 
          style={[styles.heroGlass, { backgroundColor: colors.secondary }]}
        >
           <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
              
              {/* Header Title (Moved down slightly to clear back button) */}
              <View style={[styles.navBar, { paddingLeft: 60, marginTop: 10 }]}>
                <AppText variant="h3" weight="bold" style={{ color: colors.onSecondary }}>
                    Academic Record
                </AppText>
              </View>

              {/* METRICS */}
              <View style={styles.heroContent}>
                 <View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <AppText variant="display" weight="bold" style={{ color: colors.onSecondary, fontSize: 64, lineHeight: 70 }}>
                            3.8
                        </AppText>
                        <AppText variant="h2" style={{ color: colors.onSecondary, opacity: 0.8, marginLeft: 8 }}>
                            GPA
                        </AppText>
                    </View>
                    <AppText variant="caption" style={{ color: colors.onSecondary, opacity: 0.7, marginTop: -4 }}>
                        Cumulative • Fall 2024
                    </AppText>
                 </View>
                 <View style={styles.heroIcon}>
                    <Icon name="school" size={60} color={colors.onSecondary} style={{ opacity: 0.3 }} />
                 </View>
              </View>

           </SafeAreaView>
        </GlassView>
      </ScreenTransition>

      {/* LIST CONTENT */}
      <View style={styles.listContainer}>
        <FlatList
          data={GRADES}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          renderItem={({ item, index }) => (
            <AnimatedItem index={index} >
              <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.subjectIcon, { backgroundColor: colors.background }]}>
                        <AppText weight="bold" style={{ color: colors.subtle }}>{item.subject.charAt(0)}</AppText>
                    </View>
                    <View>
                        <AppText variant="body" weight="bold">{item.subject}</AppText>
                        <AppText variant="caption" style={{ color: colors.subtle }}>Score: {item.score}</AppText>
                    </View>
                </View>
                <View style={[styles.gradeBadge, { backgroundColor: colors.primary + '15' }]}>
                  <AppText variant="h3" weight="bold" style={{ color: colors.primary }}>
                    {item.grade}
                  </AppText>
                </View>
              </View>
            </AnimatedItem>
          )}
        />
      </View>
    </View>
  );
}