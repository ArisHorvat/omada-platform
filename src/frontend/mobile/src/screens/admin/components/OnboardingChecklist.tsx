import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, ClayView, Icon, IconName } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { useThemeColors } from '@/src/hooks';

export type OnboardingItem = {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  stepIndex: number;
};

const ONBOARDING_ITEMS: OnboardingItem[] = [
  { id: 'invite', title: 'Invite your team', subtitle: 'Add members or share your join link', route: '/members-workspace', stepIndex: 1 },
  { id: 'roles', title: 'Configure roles & permissions', subtitle: 'Control who can access each widget', route: '/roles-workspace', stepIndex: 2 },
  { id: 'branding', title: 'Customize branding', subtitle: 'Logo, colors, and organization identity', route: '/branding-workspace', stepIndex: 3 },
  { id: 'groups', title: 'Set up groups', subtitle: 'Departments, teams, classes, and cohorts', route: '/groups-workspace', stepIndex: 4 },
  { id: 'floorplan', title: 'Upload floorplans', subtitle: 'Map rooms and publish bookable spaces', route: '/floorplan-workspace', stepIndex: 5 },
  { id: 'spider', title: 'Connect web spider', subtitle: 'Import timetable and news from your site', route: '/web-spider-workspace', stepIndex: 6 },
  { id: 'periods', title: 'Define academic periods', subtitle: 'Semesters, terms, or sprints', route: '/periods-workspace', stepIndex: 7 },
  { id: 'grades', title: 'Set up grades', subtitle: 'Record and manage student results', route: '/grades-workspace', stepIndex: 8 },
  { id: 'widgets', title: 'Enable widgets', subtitle: 'Choose which features your org uses', route: '/widgets-workspace', stepIndex: 9 },
  { id: 'rooms', title: 'Manage rooms', subtitle: 'Publish bookable spaces for your org', route: '/rooms-workspace', stepIndex: 10 },
];

type Props = {
  onboardingStep: number;
  memberCount?: number;
};

export function OnboardingChecklist({ onboardingStep, memberCount = 0 }: Props) {
  const colors = useThemeColors();
  const router = useRouter();

  const completedCount = ONBOARDING_ITEMS.filter((item) => {
    if (item.id === 'invite' && memberCount > 1) return true;
    return onboardingStep >= item.stepIndex;
  }).length;

  return (
    <ClayView depth={6} puffy={16} color={colors.card} style={{ borderRadius: 16, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <AppText weight="bold">Getting started</AppText>
        <AppText variant="caption" style={{ color: colors.subtle }}>
          {completedCount}/{ONBOARDING_ITEMS.length}
        </AppText>
      </View>

      {ONBOARDING_ITEMS.map((item) => {
        const done = item.id === 'invite' ? memberCount > 1 : onboardingStep >= item.stepIndex;
        return (
          <PressClay key={item.id} onPress={() => router.push(item.route as never)}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 10,
                opacity: done ? 0.75 : 1,
              }}
            >
              <ClayView
                depth={2}
                color={done ? colors.success + '22' : colors.primary + '18'}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name={(done ? 'check-circle' : 'radio-button-unchecked') as IconName}
                  size={20}
                  color={done ? colors.success : colors.primary}
                />
              </ClayView>
              <View style={{ flex: 1 }}>
                <AppText weight="bold" style={{ textDecorationLine: done ? 'line-through' : 'none' }}>
                  {item.title}
                </AppText>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  {item.subtitle}
                </AppText>
              </View>
              <Icon name="chevron-right" size={20} color={colors.subtle} />
            </View>
          </PressClay>
        );
      })}
    </ClayView>
  );
}
