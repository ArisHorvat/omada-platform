import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { alertAction } from '@/src/utils/confirmAction';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { AppButton, AppFormField, AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { OptionPickerSheet } from '@/src/components/filters/OptionPickerSheet';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { CreateGroupRequest, UpdateGroupRequest } from '@/src/api/generatedClient';
import { getApiErrorMessage, groupsApi, orgAdminApi, unwrap } from '@/src/api';
import { markOnboardingStepComplete } from '../../utils/onboarding';
import type { GroupsWorkspaceModel } from '../hooks/useGroupsWorkspace';
import { suggestGroupTypeKey } from '../utils/groupTypeUtils';
import { canonicalGroupTypeKey } from '../utils/groupTypeLabels';
import { collectDescendantIds } from '../utils/groupTreeUtils';
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
    copy,
    labelForType,
    detail,
    selectedGroupId,
    flatRows,
    invalidateGroups,
    setSelectedGroupId,
  } = model;

  const [name, setName] = useState('');
  const [typeKey, setTypeKey] = useState(typeCatalog[0]?.key ?? 'group');
  const [parentGroupId, setParentGroupId] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState('');
  const [saving, setSaving] = useState(false);
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  useEffect(() => {
    if (formMode === 'edit' && detail) {
      setName(detail.name);
      setTypeKey(canonicalGroupTypeKey(detail.type));
      setParentGroupId(detail.parentGroupId ?? null);
      setAcademicYear((detail as { academicYear?: string }).academicYear ?? '');
    } else if (formMode === 'create') {
      setName('');
      setTypeKey(suggestGroupTypeKey(typeCatalog, selectedGroupId, flatRows));
      setParentGroupId(selectedGroupId);
      setAcademicYear('');
    }
  }, [formMode, detail, typeCatalog, selectedGroupId, flatRows]);

  const typePickerOptions = useMemo(
    () =>
      typeCatalog.map((t) => ({
        value: t.key,
        label: t.label,
        subtitle: t.description,
        icon: 'category',
      })),
    [typeCatalog],
  );

  const typeLabel = useMemo(() => {
    const match = typeCatalog.find((t) => t.key === typeKey);
    return match?.label ?? labelForType(typeKey);
  }, [typeCatalog, typeKey, labelForType]);

  const parentOptions = useMemo(() => {
    if (formMode === 'edit' && selectedGroupId) {
      const blocked = new Set([
        selectedGroupId,
        ...collectDescendantIds(selectedGroupId, flatRows),
      ]);
      return flatRows.filter((r) => !blocked.has(r.id));
    }
    return flatRows;
  }, [flatRows, formMode, selectedGroupId]);

  const parentPickerOptions = useMemo(
    () =>
      parentOptions.map((row) => ({
        value: row.id,
        label: row.name,
        subtitle: `${' '.repeat(row.depth * 2)}${labelForType(row.type)} · ${row.memberCount} members`,
        icon: 'account-tree',
      })),
    [parentOptions, labelForType],
  );

  const parentLabel = useMemo(() => {
    if (!parentGroupId) return copy.parentNoneLabel;
    const row = flatRows.find((r) => r.id === parentGroupId);
    return row ? `${row.name} (${labelForType(row.type)})` : copy.parentNoneLabel;
  }, [parentGroupId, flatRows, labelForType, copy.parentNoneLabel]);

  const onSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        type: typeKey,
        parentGroupId: parentGroupId ?? undefined,
        academicYear:
          (typeKey === 'group' || typeKey === 'cohort') && academicYear.trim()
            ? academicYear.trim()
            : undefined,
      };
      if (formMode === 'edit' && selectedGroupId) {
        await unwrap(groupsApi.updateGroup(selectedGroupId, new UpdateGroupRequest(body)));
      } else {
        const created = await unwrap(groupsApi.createGroup(new CreateGroupRequest(body)));
        setSelectedGroupId(created.id);

        const current = await unwrap(orgAdminApi.getCurrent());
        await unwrap(
          orgAdminApi.updateCurrent({
            name: current.name,
            primaryColor: current.primaryColor,
            secondaryColor: current.secondaryColor,
            tertiaryColor: current.tertiaryColor,
            completedOnboardingSteps: markOnboardingStepComplete(
              current.completedOnboardingSteps,
              'groups',
            ),
          } as never),
        );
      }
      await invalidateGroups();
      setFormMode(null);
    } catch (e) {
      alertAction({ title: 'Save failed', message: getApiErrorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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
            <AppFormField label="Name" value={name} onChangeText={setName} placeholder={copy.namePlaceholder} />
          </View>

          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>
            {copy.typeLabel}
          </AppText>
          <PressClay onPress={() => setTypePickerOpen(true)}>
            <ClayView depth={2} color={colors.card} style={[s.selectField, { marginBottom: 14 }]}>
              <AppText variant="body" weight="medium" numberOfLines={1} style={{ flex: 1 }}>
                {typeLabel}
              </AppText>
              <Icon name="expand-more" size={22} color={colors.subtle} />
            </ClayView>
          </PressClay>

          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>
            {copy.parentLabel}
          </AppText>
          <PressClay onPress={() => setParentPickerOpen(true)}>
            <ClayView depth={2} color={colors.card} style={[s.selectField, { marginBottom: 16 }]}>
              <AppText variant="body" weight="medium" numberOfLines={2} style={{ flex: 1 }}>
                {parentLabel}
              </AppText>
              <Icon name="expand-more" size={22} color={colors.subtle} />
            </ClayView>
          </PressClay>

          {(typeKey === 'group' || typeKey === 'cohort') ? (
            <View style={s.sheetField}>
              <AppFormField
                label={copy.academicYearLabel}
                value={academicYear}
                onChangeText={setAcademicYear}
                placeholder={copy.academicYearPlaceholder}
                autoCapitalize="none"
              />
            </View>
          ) : null}

          <AppButton title={saving ? 'Saving…' : 'Save'} onPress={onSave} disabled={saving || !name.trim()} />
        </View>
      </BottomSheet>

      <OptionPickerSheet
        isVisible={typePickerOpen}
        onClose={() => setTypePickerOpen(false)}
        title={copy.typeFilterPickerTitle}
        options={typePickerOptions}
        selected={typeKey}
        onSelect={(v) => {
          if (v) setTypeKey(v);
        }}
        includeAllOption={false}
        height={480}
        zIndexBase={250}
      />

      <SearchableOptionPickerSheet
        isVisible={parentPickerOpen}
        onClose={() => setParentPickerOpen(false)}
        title={copy.parentPickerTitle}
        options={parentPickerOptions}
        selected={parentGroupId}
        onSelect={(v) => setParentGroupId(v)}
        allLabel={copy.parentNoneLabel}
        searchPlaceholder={copy.parentSearchPlaceholder}
        height={560}
        zIndexBase={260}
      />
    </>
  );
}
