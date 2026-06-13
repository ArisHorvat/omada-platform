import React, { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppFormField, AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { OptionPickerSheet } from '@/src/components/filters/OptionPickerSheet';
import type { GroupTreeNodeDto } from '@/src/api/generatedClient';
import type { GroupsWorkspaceModel } from '../hooks/useGroupsWorkspace';
import { groupsWorkspaceStyles as s } from '../styles/groupsWorkspace.styles';

type Props = {
  model: GroupsWorkspaceModel;
};

type TreeNodeProps = {
  node: GroupTreeNodeDto;
  depth: number;
  model: GroupsWorkspaceModel;
};

function GroupTreeNodeRow({ node, depth, model }: TreeNodeProps) {
  const {
    colors,
    selectedGroupId,
    setSelectedGroupId,
    labelForType,
    expandedIds,
    toggleExpanded,
  } = model;

  const hasChildren = (node.children?.length ?? 0) > 0;
  const expanded = expandedIds.has(node.id);
  const active = selectedGroupId === node.id;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
        {hasChildren ? (
          <PressClay
            onPress={() => toggleExpanded(node.id)}
            style={{ width: 28, justifyContent: 'center', alignItems: 'center', marginLeft: depth * 12 }}
          >
            <Icon
              name={expanded ? 'expand-more' : 'chevron-right'}
              size={20}
              color={colors.subtle}
            />
          </PressClay>
        ) : (
          <View style={{ width: 28, marginLeft: depth * 12 }} />
        )}

        <PressClay onPress={() => setSelectedGroupId(node.id)} style={{ flex: 1 }}>
          <ClayView
            depth={active ? 4 : 2}
            color={active ? colors.primary + '20' : colors.card}
            style={[
              s.treeRow,
              {
                marginLeft: hasChildren ? 0 : depth * 12,
                borderWidth: active ? 1 : 0,
                borderColor: colors.primary,
              },
            ]}
          >
            <Icon
              name={hasChildren ? 'folder' : 'people'}
              size={18}
              color={active ? colors.primary : colors.subtle}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="body" weight={active ? 'bold' : 'medium'} numberOfLines={1}>
                {node.name}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <View style={[s.typePill, { backgroundColor: colors.background }]}>
                  <AppText variant="caption" style={{ color: colors.subtle, fontSize: 10 }}>
                    {labelForType(node.type)}
                  </AppText>
                </View>
                <AppText variant="caption" style={{ color: colors.subtle, fontSize: 11 }}>
                  {node.memberCount}
                </AppText>
                {hasChildren ? (
                  <AppText variant="caption" style={{ color: colors.subtle, fontSize: 11 }}>
                    · {node.children.length} sub
                  </AppText>
                ) : null}
              </View>
            </View>
          </ClayView>
        </PressClay>
      </View>

      {hasChildren && expanded
        ? node.children.map((child) => (
            <GroupTreeNodeRow key={child.id} node={child} depth={depth + 1} model={model} />
          ))
        : null}
    </View>
  );
}

export function GroupTreeList({ model }: Props) {
  const {
    colors,
    copy,
    treeQuery,
    filteredTree,
    totalGroupCount,
    typeCatalog,
    treeSearch,
    setTreeSearch,
    typeFilter,
    setTypeFilter,
    expandAll,
    collapseAll,
    openCreate,
  } = model;

  const [typePickerOpen, setTypePickerOpen] = useState(false);

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

  const typeFilterLabel =
    typeFilter === null
      ? copy.typeFilterAll
      : (typePickerOptions.find((o) => o.value === typeFilter)?.label ?? copy.typeFilterAll);

  if (treeQuery.isLoading) {
    return <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />;
  }

  if (treeQuery.isError) {
    return (
      <ClayView depth={2} color={colors.card} style={{ borderRadius: 14, padding: 16 }}>
        <AppText variant="body" style={{ color: colors.text }}>
          Could not load groups. Check your connection and groups permission.
        </AppText>
      </ClayView>
    );
  }

  if (totalGroupCount === 0) {
    return (
      <ClayView depth={2} color={colors.card} style={{ borderRadius: 14, padding: 18 }}>
        <AppText variant="h3" weight="bold" style={{ marginBottom: 8 }}>
          {copy.emptyTitle}
        </AppText>
        <AppText variant="body" style={{ marginBottom: 12, lineHeight: 22, color: colors.subtle }}>
          {copy.emptyMessage}
        </AppText>
        <PressClay onPress={openCreate}>
          <ClayView
            depth={3}
            color={colors.primary + '22'}
            style={{ alignSelf: 'flex-start', padding: 12, borderRadius: 12 }}
          >
            <AppText variant="label" style={{ color: colors.primary }}>
              + {copy.emptyCta}
            </AppText>
          </ClayView>
        </PressClay>
      </ClayView>
    );
  }

  return (
    <View>
      <View style={s.treeToolbar}>
        <AppText variant="caption" style={{ color: colors.subtle }}>
          {copy.groupCount(totalGroupCount)}
        </AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PressClay onPress={expandAll}>
            <AppText variant="caption" style={{ color: colors.primary }}>
              {copy.expandAll}
            </AppText>
          </PressClay>
          <AppText variant="caption" style={{ color: colors.border }}>
            ·
          </AppText>
          <PressClay onPress={collapseAll}>
            <AppText variant="caption" style={{ color: colors.primary }}>
              {copy.collapseAll}
            </AppText>
          </PressClay>
        </View>
      </View>

      <AppFormField
        value={treeSearch}
        onChangeText={setTreeSearch}
        placeholder={copy.searchPlaceholder}
        icon="search"
        style={{ marginBottom: 10 }}
      />

      {typeCatalog.length > 1 ? (
        <View style={{ marginBottom: 10 }}>
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>
            {copy.typeFilterLabel}
          </AppText>
          <PressClay onPress={() => setTypePickerOpen(true)}>
            <ClayView depth={2} color={colors.card} style={s.selectField}>
              <AppText variant="body" weight="medium" numberOfLines={1} style={{ flex: 1 }}>
                {typeFilterLabel}
              </AppText>
              <Icon name="expand-more" size={22} color={colors.subtle} />
            </ClayView>
          </PressClay>
        </View>
      ) : null}

      {filteredTree.length === 0 ? (
        <ClayView depth={1} color={colors.card} style={{ borderRadius: 12, padding: 14 }}>
          <AppText variant="caption" style={{ color: colors.subtle }}>
            No groups match your search or filter.
          </AppText>
        </ClayView>
      ) : (
        filteredTree.map((node) => (
          <GroupTreeNodeRow key={node.id} node={node} depth={0} model={model} />
        ))
      )}

      <OptionPickerSheet
        isVisible={typePickerOpen}
        onClose={() => setTypePickerOpen(false)}
        title={copy.typeFilterPickerTitle}
        options={typePickerOptions}
        selected={typeFilter}
        onSelect={(v) => setTypeFilter(v)}
        allLabel={copy.typeFilterAll}
        height={480}
        zIndexBase={200}
      />
    </View>
  );
}
