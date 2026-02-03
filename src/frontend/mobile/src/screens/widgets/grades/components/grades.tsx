import React from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';

// UI Kit
import { useThemeColors } from '@/src/hooks';
import { GlassView, AppText, Icon } from '@/src/components/ui';
import { AnimatedItem } from '@/src/components/animations/AnimatedItem';
import { createStyles } from '../styles/grades.styles';

const AnimatedView = Animated.View as any;

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
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      
      {/* HERO HEADER (Animated Container) */}
      <AnimatedView 
        sharedTransitionTag="widget-grades" 
        style={styles.heroContainer}
      >
        <GlassView 
          intensity={90} 
          style={[styles.heroGlass, { backgroundColor: colors.secondary }]}
        >
           {/* Use SafeAreaView to ensure content doesn't hit the notch */}
           <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
              
              {/* 1. NEW NAV BAR (Back Button + Title) */}
              <View style={styles.navBar}>
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    activeOpacity={0.7}
                    style={styles.backButton}
                >
                    <Icon name="arrow-back" size={24} color={colors.onSecondary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="bold" style={{ color: colors.onSecondary, marginLeft: 16 }}>
                    Academic Record
                </AppText>
              </View>

              {/* 2. METRICS DISPLAY */}
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
                 
                 {/* Decorative Icon */}
                 <View style={styles.heroIcon}>
                    <Icon name="school" size={60} color={colors.onSecondary} style={{ opacity: 0.3 }} />
                 </View>
              </View>

           </SafeAreaView>
        </GlassView>
      </AnimatedView>

      {/* LIST CONTENT */}
      <View style={styles.listContainer}>
        <FlatList
          data={GRADES}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          renderItem={({ item, index }) => (
            <AnimatedItem index={index} delay={100}>
              <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* Subject Icon Placeholder */}
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