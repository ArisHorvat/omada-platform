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
import { OrganizationType } from '@/src/api/generatedClient';
import { createOrgWidgetEnabledChecker } from '../utils/orgEnabledWidgets';
import { createOrgDashboardStyles } from '../styles/org-dashboard.styles';

type Props = {
  completedOnboardingSteps?: string[] | null;
  memberCount?: number;
  enabledWidgets?: string[] | null;
  organizationType?: OrganizationType;
};

export function OnboardingChecklist({
  completedOnboardingSteps,
  memberCount = 0,
  enabledWidgets,
  organizationType,
}: Props) {
  const colors = useThemeColors();
  const router = useRouter();
  const { isWideShell } = useBreakpoint();
  const styles = useMemo(() => createOrgDashboardStyles(colors), [colors]);

  const isWidgetEnabled = useMemo(
    () => createOrgWidgetEnabledChecker(organizationType),
    [organizationType],
  );

  const applicableItems = useMemo(
    () => filterOnboardingItems(ONBOARDING_ITEMS, enabledWidgets, isWidgetEnabled),
    [enabledWidgets, isWidgetEnabled],
  );

  const completedCount = applicableItems.filter((item) =>
    isOnboardingItemDone(item, completedOnboardingSteps, memberCount),
  ).length;
  const progress = applicableItems.length ? completedCount / applicableItems.length : 1;

  const steps = applicableItems.map((item, index) => {
    const done = isOnboardingItemDone(item, completedOnboardingSteps, memberCount);
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
