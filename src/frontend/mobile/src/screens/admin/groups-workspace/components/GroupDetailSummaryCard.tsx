import React from 'react';
import { View } from 'react-native';
import { AppText, ClayView, Icon, type IconName } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { groupsWorkspaceStyles as s } from '../styles/groupsWorkspace.styles';

type Props = {
  icon: IconName;
  title: string;
  subtitle?: string;
  badge?: string;
  onPress: () => void;
};

/** Compact tappable row — opens a sheet for the full list. */
export function GroupDetailSummaryCard({ icon, title, subtitle, badge, onPress }: Props) {
  const colors = useThemeColors();

  return (
    <PressClay onPress={onPress}>
      <ClayView depth={2} color={colors.background} style={s.summaryCard}>
        <ClayView depth={3} color={colors.primary + '18'} style={s.summaryIconWrap}>
          <Icon name={icon} size={20} color={colors.primary} />
        </ClayView>
        <View style={s.summaryText}>
          <AppText variant="body" weight="bold" numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }} numberOfLines={2}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {badge ? (
          <View style={[s.summaryBadge, { backgroundColor: colors.primary + '22' }]}>
            <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
              {badge}
            </AppText>
          </View>
        ) : null}
        <Icon name="chevron-right" size={20} color={colors.subtle} />
      </ClayView>
    </PressClay>
  );
}
