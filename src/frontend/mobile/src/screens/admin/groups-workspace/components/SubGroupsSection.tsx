import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import type { GroupSummaryDto } from '@/src/api/generatedClient';
import type { GroupsWorkspaceModel } from '../hooks/useGroupsWorkspace';
import { GroupDetailSummaryCard } from './GroupDetailSummaryCard';
import { groupsWorkspaceStyles as s } from '../styles/groupsWorkspace.styles';

type Props = {
  subGroups: GroupSummaryDto[];
  model: GroupsWorkspaceModel;
};

function formatNamePreview(names: string[], max = 2): string {
  if (names.length === 0) return '';
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  if (rest <= 0) return shown.join(', ');
  return `${shown.join(', ')} +${rest} more`;
}

export function SubGroupsSection({ subGroups, model }: Props) {
  const { copy, labelForType, setSelectedGroupId } = model;
  const [pickerOpen, setPickerOpen] = useState(false);

  const options = useMemo(
    () =>
      subGroups.map((c) => ({
        value: c.id,
        label: c.name,
        subtitle: `${labelForType(c.type)} · ${c.memberCount} members`,
        icon: 'account-tree',
      })),
    [subGroups, labelForType],
  );

  if (subGroups.length === 0) return null;

  const subtitle = formatNamePreview(subGroups.map((g) => g.name));

  return (
    <View style={s.detailSection}>
      <GroupDetailSummaryCard
        icon="account-tree"
        title={copy.subGroupsSummary(subGroups.length)}
        subtitle={subtitle}
        onPress={() => setPickerOpen(true)}
      />

      <SearchableOptionPickerSheet
        isVisible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={copy.subGroupsPickerTitle}
        options={options}
        selected={null}
        onSelect={(id) => {
          if (id) setSelectedGroupId(id);
        }}
        includeAllOption={false}
        searchPlaceholder={copy.subGroupsSearchPlaceholder}
        height={520}
        zIndexBase={210}
      />
    </View>
  );
}
