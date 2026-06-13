import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { AppButton, AppFormField, AppText, ClayView } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { AddGroupMembersRequest } from '@/src/api/generatedClient';
import { getApiErrorMessage, groupsApi, unwrap } from '@/src/api';
import type { GroupsWorkspaceModel } from '../hooks/useGroupsWorkspace';
import { groupsWorkspaceStyles as s } from '../styles/groupsWorkspace.styles';

type Props = {
  model: GroupsWorkspaceModel;
};

type DirectoryRow = {
  id: string;
  firstName: string;
  lastName: string;
  roleName: string;
};

export function AddMembersSheet({ model }: Props) {
  const {
    colors,
    copy,
    detail,
    addMembersSheetOpen,
    setAddMembersSheetOpen,
    selectedGroupId,
    searchDirectoryUsers,
    invalidateGroups,
  } = model;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DirectoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!addMembersSheetOpen) {
      setQuery('');
      setResults([]);
      setPicked(new Set());
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const rows = await searchDirectoryUsers(query);
        setResults(
          rows.map((r) => ({
            id: r.id!,
            firstName: r.firstName!,
            lastName: r.lastName!,
            roleName: r.roleName ?? 'Member',
          })),
        );
      } finally {
        setLoading(false);
      }
    }, 320);
    return () => clearTimeout(t);
  }, [query, addMembersSheetOpen, searchDirectoryUsers]);

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onAdd = async () => {
    if (!selectedGroupId || picked.size === 0) return;
    setSaving(true);
    try {
      await unwrap(
        groupsApi.addMembers(
          selectedGroupId,
          new AddGroupMembersRequest({ userIds: [...picked], roleInGroup: 'Member' }),
        ),
      );
      await invalidateGroups();
      setAddMembersSheetOpen(false);
    } catch (e) {
      Alert.alert('Add failed', getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      isVisible={addMembersSheetOpen}
      onClose={() => setAddMembersSheetOpen(false)}
      height={520}
      zIndexBase={260}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="h3" weight="bold" style={{ marginBottom: 10 }}>
          Add members
        </AppText>
        {detail && detail.children.length > 0 ? (
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12, lineHeight: 18 }}>
            {copy.addMembersLeafHint}
          </AppText>
        ) : null}
        <AppFormField
          value={query}
          onChangeText={setQuery}
          placeholder="Search directory…"
          style={{ marginBottom: 12 }}
        />
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {results.map((u) => {
              const active = picked.has(u.id);
              return (
                <PressClay key={u.id} onPress={() => toggle(u.id)}>
                  <ClayView
                    depth={active ? 3 : 1}
                    color={active ? colors.primary + '18' : colors.card}
                    style={s.memberRow}
                  >
                    <View style={{ flex: 1 }}>
                      <AppText variant="body" weight="medium">
                        {u.firstName} {u.lastName}
                      </AppText>
                      <AppText variant="caption" style={{ color: colors.subtle }}>
                        {u.roleName}
                      </AppText>
                    </View>
                  </ClayView>
                </PressClay>
              );
            })}
          </ScrollView>
        )}
        <AppButton
          title={saving ? 'Adding…' : `Add ${picked.size} member(s)`}
          onPress={onAdd}
          disabled={saving || picked.size === 0}
          style={{ marginTop: 12 }}
        />
      </View>
    </BottomSheet>
  );
}
