import React, { useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { AppButton, AppFormField, AppText, ClayView } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { CreateGroupRequest, UpdateGroupRequest } from '@/src/api/generatedClient';
import { getApiErrorMessage, groupsApi, unwrap } from '@/src/api';
import type { GroupsWorkspaceModel } from '../hooks/useGroupsWorkspace';
import { groupsWorkspaceStyles as s } from '../styles/groupsWorkspace.styles';

type Props = {
  model: GroupsWorkspaceModel;
};

export function GroupFormSheet({ model }: Props) {
  const {
    colors,
    formMode,
    setFormMode,
    typeCatalog,
    labelForType,
    detail,
    selectedGroupId,
    flatRows,
    invalidateGroups,
    setSelectedGroupId,
  } = model;

  const [name, setName] = useState('');
  const [typeKey, setTypeKey] = useState(typeCatalog[0]?.key ?? 'class');
  const [parentGroupId, setParentGroupId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (formMode === 'edit' && detail) {
      setName(detail.name);
      setTypeKey(detail.type);
      setParentGroupId(detail.parentGroupId ?? null);
    } else if (formMode === 'create') {
      setName('');
      const suggested = typeCatalog[0]?.key ?? 'class';
      setTypeKey(suggested);
      setParentGroupId(selectedGroupId);
    }
  }, [formMode, detail, typeCatalog, selectedGroupId]);

  const parentOptions = useMemo(
    () => flatRows.filter((r) => r.id !== selectedGroupId || formMode === 'create'),
    [flatRows, selectedGroupId, formMode],
  );

  const onSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        type: typeKey,
        parentGroupId: parentGroupId ?? undefined,
      };
      if (formMode === 'edit' && selectedGroupId) {
        await unwrap(groupsApi.updateGroup(selectedGroupId, new UpdateGroupRequest(body)));
      } else {
        const created = await unwrap(groupsApi.createGroup(new CreateGroupRequest(body)));
        setSelectedGroupId(created.id);
      }
      await invalidateGroups();
      setFormMode(null);
    } catch (e) {
      Alert.alert('Save failed', getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      isVisible={formMode !== null}
      onClose={() => setFormMode(null)}
      height={520}
      zIndexBase={240}
    >
      <View style={{ paddingHorizontal: 4, paddingBottom: 12 }}>
        <AppText variant="h3" weight="bold" style={{ marginBottom: 16 }}>
          {formMode === 'edit' ? 'Edit group' : 'New group'}
        </AppText>

        <View style={s.sheetField}>
          <AppFormField label="Name" value={name} onChangeText={setName} placeholder="e.g. CS101 — Group A" />
        </View>

        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
          Type
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {typeCatalog.map((t) => {
            const active = typeKey === t.key;
            return (
              <PressClay key={t.key} onPress={() => setTypeKey(t.key)}>
                <ClayView
                  depth={active ? 3 : 1}
                  color={active ? colors.primary + '22' : colors.card}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                  }}
                >
                  <AppText variant="caption" weight={active ? 'bold' : 'regular'}>
                    {t.label}
                  </AppText>
                </ClayView>
              </PressClay>
            );
          })}
        </View>

        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
          Parent (optional)
        </AppText>
        <View style={{ maxHeight: 120, marginBottom: 16 }}>
          <PressClay onPress={() => setParentGroupId(null)}>
            <ClayView
              depth={parentGroupId === null ? 3 : 1}
              color={colors.card}
              style={[s.treeRow, { marginBottom: 4 }]}
            >
              <AppText variant="body">No parent (top level)</AppText>
            </ClayView>
          </PressClay>
          {parentOptions.slice(0, 12).map((row) => (
            <PressClay key={row.id} onPress={() => setParentGroupId(row.id)}>
              <ClayView
                depth={parentGroupId === row.id ? 3 : 1}
                color={colors.card}
                style={[s.treeRow, { marginLeft: row.depth * 10 }]}
              >
                <AppText variant="body" numberOfLines={1}>
                  {row.name}
                </AppText>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  {labelForType(row.type)}
                </AppText>
              </ClayView>
            </PressClay>
          ))}
        </View>

        <AppButton title={saving ? 'Saving…' : 'Save'} onPress={onSave} disabled={saving || !name.trim()} />
      </View>
    </BottomSheet>
  );
}
