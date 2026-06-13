import React from 'react';
import { View } from 'react-native';
import { AppText, ClayView, Icon, ProgressiveImage } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import type { GroupMemberDto } from '@/src/api/generatedClient';
import { useThemeColors } from '@/src/hooks';
import { groupsWorkspaceStyles as s } from '../styles/groupsWorkspace.styles';

type Props = {
  member: GroupMemberDto;
  selected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
};

export function GroupMemberRow({ member, selected, onToggleSelect, onRemove }: Props) {
  const colors = useThemeColors();
  const initials = `${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <PressClay onPress={onToggleSelect}>
      <ClayView
        depth={selected ? 3 : 1}
        color={selected ? colors.primary + '16' : colors.background}
        style={[s.memberRow, selected ? { borderWidth: 1, borderColor: colors.primary } : undefined]}
      >
        {member.avatarUrl ? (
          <ProgressiveImage source={{ uri: member.avatarUrl }} style={s.avatar} resizeMode="cover" />
        ) : (
          <ClayView depth={2} color={colors.primary + '33'} style={s.avatar}>
            <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
              {initials}
            </AppText>
          </ClayView>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="body" weight="medium" numberOfLines={1}>
            {member.firstName} {member.lastName}
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle }} numberOfLines={1}>
            {member.roleName}
            {member.roleInGroup ? ` · ${member.roleInGroup}` : ''}
            {member.isDirectMember === false && member.placementGroupName
              ? ` · via ${member.placementGroupName}`
              : ''}
          </AppText>
        </View>
        <PressClay onPress={onRemove}>
          <Icon name="close" size={20} color={colors.subtle} />
        </PressClay>
      </ClayView>
    </PressClay>
  );
}
