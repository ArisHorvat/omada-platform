import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { AppButton, AppFormField, AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import type { GroupMemberDto } from '@/src/api/generatedClient';
import { groupsApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import type { GroupsWorkspaceModel } from '../hooks/useGroupsWorkspace';
import { GroupDetailSummaryCard } from './GroupDetailSummaryCard';
import { GroupMemberRow } from './GroupMemberRow';
import { groupsWorkspaceStyles as s } from '../styles/groupsWorkspace.styles';

const BROWSE_PAGE_SIZE = 200;

type Props = {
  model: GroupsWorkspaceModel;
  members: GroupMemberDto[];
  totalCount: number;
  directCount: number;
  loading: boolean;
};

function formatMemberPreview(members: GroupMemberDto[], max = 2): string {
  if (members.length === 0) return '';
  const names = members.map((m) => `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()).filter(Boolean);
  const shown = names.slice(0, max);
  const rest = totalRest(names.length, max);
  if (rest <= 0) return shown.join(', ');
  return `${shown.join(', ')} +${rest} more`;
}

function totalRest(total: number, max: number) {
  return Math.max(total - max, 0);
}

export function GroupMembersSection({ model, members, totalCount, directCount, loading }: Props) {
  const {
    colors,
    copy,
    orgId,
    selectedGroupId,
    setAddMembersSheetOpen,
    confirmMoveMembers,
    selectedMemberIds,
    toggleMemberSelection,
    confirmRemoveMember,
    setSelectedMemberIds,
  } = model;

  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseSearch, setBrowseSearch] = useState('');

  useEffect(() => {
    if (!browseOpen) setBrowseSearch('');
  }, [browseOpen]);

  const browseQuery = useQuery({
    queryKey: QUERY_KEYS.groups.members(
      orgId,
      selectedGroupId ?? '',
      `browse:${browseSearch}:${totalCount}`,
    ),
    queryFn: () =>
      unwrap(
        groupsApi.getMembers(
          selectedGroupId!,
          1,
          Math.min(Math.max(totalCount, 1), BROWSE_PAGE_SIZE),
          browseSearch.trim() || null,
        ),
      ),
    enabled: !!orgId && !!selectedGroupId && browseOpen,
  });

  const browseMembers = browseQuery.data?.items ?? members;

  const subtitle = useMemo(() => {
    if (totalCount === 0) return copy.membersEmpty;
    return formatMemberPreview(members);
  }, [totalCount, members, copy.membersEmpty]);

  const selectionBadge =
    selectedMemberIds.size > 0 ? copy.membersSelectedBadge(selectedMemberIds.size) : undefined;

  return (
    <View style={s.detailSection}>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
      ) : (
        <GroupDetailSummaryCard
          icon="people"
          title={copy.membersCountBreakdown(totalCount, directCount)}
          subtitle={
            totalCount > directCount
              ? `${copy.membersRollupHint} ${subtitle}`.trim()
              : subtitle
          }
          badge={selectionBadge}
          onPress={() => setBrowseOpen(true)}
        />
      )}

      <BottomSheet
        isVisible={browseOpen}
        onClose={() => setBrowseOpen(false)}
        height={560}
        zIndexBase={230}
      >
        <View style={{ flex: 1, minHeight: 0, paddingHorizontal: 4 }}>
          <View style={s.sheetHeader}>
            <AppText variant="h3" weight="bold" style={{ flex: 1 }}>
              {copy.membersPickerTitle(totalCount)}
            </AppText>
            <PressClay onPress={() => setBrowseOpen(false)}>
              <ClayView depth={4} color={colors.card} style={s.sheetCloseBtn}>
                <Icon name="close" size={22} color={colors.subtle} />
              </ClayView>
            </PressClay>
          </View>

          <AppFormField
            value={browseSearch}
            onChangeText={setBrowseSearch}
            placeholder={copy.membersSearchPlaceholder}
            icon="search"
            style={{ marginBottom: 10 }}
          />

          <View style={s.sheetActionRow}>
            <AppButton
              title={`Move (${selectedMemberIds.size})`}
              variant="outline"
              onPress={() => {
                confirmMoveMembers();
                if (selectedMemberIds.size > 0) setBrowseOpen(false);
              }}
              style={{ flex: 1, minWidth: 0 }}
            />
            <AppButton
              title="Add members"
              onPress={() => {
                setBrowseOpen(false);
                setAddMembersSheetOpen(true);
              }}
              style={{ flex: 1, minWidth: 0 }}
            />
          </View>

          {browseQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          ) : browseMembers.length === 0 ? (
            <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center', marginTop: 16 }}>
              {copy.membersEmpty}
            </AppText>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {browseMembers.map((m) => {
                const placementId = m.placementGroupId ?? selectedGroupId ?? m.userId!;
                return (
                  <GroupMemberRow
                    key={`${m.userId}-${placementId}`}
                    member={m}
                    selected={selectedMemberIds.has(m.userId)}
                    onToggleSelect={() => toggleMemberSelection(m.userId)}
                    onRemove={() =>
                      confirmRemoveMember(
                        m.userId!,
                        m.firstName ?? 'this member',
                        placementId,
                        m.isDirectMember ? undefined : m.placementGroupName,
                      )
                    }
                  />
                );
              })}
            </ScrollView>
          )}

          {selectedMemberIds.size > 0 ? (
            <AppButton
              title="Clear selection"
              variant="outline"
              onPress={() => setSelectedMemberIds(new Set())}
              style={{ marginTop: 8, alignSelf: 'flex-start' }}
            />
          ) : null}
        </View>
      </BottomSheet>
    </View>
  );
}
