import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Icon, IconName } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { useBreakpoint, useThemeColors } from '@/src/hooks';
import {
  filterOnboardingItems,
  isOnboardingItemDone,
  ONBOARDING_ITEMS,
} from '../config/onboarding.config';
import { isOrgWidgetEnabled } from '../utils/orgEnabledWidgets';
import { createOrgDashboardStyles } from '../styles/org-dashboard.styles';

type Props = {
  onboardingStep: number;
  memberCount?: number;
  enabledWidgets?: string[] | null;
};

export function OnboardingChecklist({ onboardingStep, memberCount = 0, enabledWidgets }: Props) {
  const colors = useThemeColors();
  const router = useRouter();
  const { isWideShell } = useBreakpoint();
  const styles = useMemo(() => createOrgDashboardStyles(colors), [colors]);

  const applicableItems = useMemo(
    () => filterOnboardingItems(ONBOARDING_ITEMS, enabledWidgets, isOrgWidgetEnabled),
    [enabledWidgets],
  );

  const completedCount = applicableItems.filter((item) =>
    isOnboardingItemDone(item, onboardingStep, memberCount),
  ).length;
  const progress = applicableItems.length ? completedCount / applicableItems.length : 1;

  const steps = applicableItems.map((item, index) => {
    const done = isOnboardingItemDone(item, onboardingStep, memberCount);
    const isLast = index === applicableItems.length - 1;
    return (
      <PressClay key={item.id} onPress={() => router.push(item.route as never)}>
        <View style={styles.stepRow}>
          <View style={styles.stepRail}>
            <View
              style={[
                styles.stepDot,
                {
                  borderColor: done ? colors.success : colors.border,
                  backgroundColor: done ? colors.success + '22' : colors.background,
                },
              ]}
            >
              <Icon
                name={(done ? 'check' : 'radio-button-unchecked') as IconName}
                size={done ? 14 : 18}
                color={done ? colors.success : colors.subtle}
              />
            </View>
            {!isLast ? (
              <View
                style={[
                  styles.stepLine,
                  { backgroundColor: done ? colors.success + '55' : colors.border },
                ]}
              />
            ) : null}
          </View>
          <View style={[styles.stepBody, isLast && styles.stepBodyLast]}>
            <AppText
              variant="body"
              weight="bold"
              style={{
                color: colors.text,
                textDecorationLine: done ? 'line-through' : 'none',
                opacity: done ? 0.7 : 1,
              }}
            >
              {item.title}
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>
              {item.subtitle}
            </AppText>
          </View>
          <View style={{ justifyContent: 'center', paddingRight: 4 }}>
            <Icon name="chevron-right" size={20} color={colors.subtle} />
          </View>
        </View>
      </PressClay>
    );
  });

  const checklistBody = (
    <>
      <View style={styles.checklistHeader}>
        <AppText variant="label" weight="bold">
          Setup checklist
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle }}>
          {completedCount}/{applicableItems.length}
        </AppText>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      {steps}
    </>
  );

  return (
    <View style={styles.checklistCard}>
      {isWideShell ? (
        checklistBody
      ) : (
        <ScrollView
          style={styles.checklistScrollCompact}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {checklistBody}
        </ScrollView>
      )}
    </View>
  );
}

// Re-export for any legacy imports
export { ONBOARDING_ITEMS } from '../config/onboarding.config';
export type { OnboardingItem } from '../config/onboarding.config';
