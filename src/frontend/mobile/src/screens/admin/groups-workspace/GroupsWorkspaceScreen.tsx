import React, { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AppButton, AppText, Icon } from '@/src/components/ui';
import { SplitPane, WidgetPageShell } from '@/src/components/layout';
import { SPLIT_PANE_LIST_WIDTH } from '@/src/constants/layout';
import { useBreakpoint } from '@/src/hooks';

import { useGroupsWorkspace } from './hooks/useGroupsWorkspace';
import { GroupTreeList } from './components/GroupTreeList';
import { GroupDetailPanel } from './components/GroupDetailPanel';
import { GroupFormSheet } from './components/GroupFormSheet';
import { MoveMembersSheet } from './components/MoveMembersSheet';
import { AddMembersSheet } from './components/AddMembersSheet';
import { groupsWorkspaceStyles as s } from './styles/groupsWorkspace.styles';

/**
 * Organization admin workspace: hierarchical groups (departments, teams, classes, subjects, series),
 * member linking, and bulk move between groups.
 */
export default function GroupsWorkspaceScreen() {
  const model = useGroupsWorkspace();
  const { colors, insets, goBack, openCreate, copy, filteredTree, selectedGroupId, setSelectedGroupId } =
    model;
  const { isWideShell } = useBreakpoint();

  useEffect(() => {
    if (!isWideShell || selectedGroupId) return;
    const first = filteredTree[0];
    if (first) setSelectedGroupId(first.id);
  }, [isWideShell, filteredTree, selectedGroupId, setSelectedGroupId]);

  const treeSection = (
    <View style={s.treeSection}>
      <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
        {copy.structureLabel}
      </AppText>
      <GroupTreeList model={model} />
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <WidgetPageShell fullBleed>
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Pressable
                onPress={goBack}
                hitSlop={12}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Icon name="arrow-back" size={22} color={colors.text} />
                <AppText variant="h2" weight="bold">
                  {copy.screenTitle}
                </AppText>
              </Pressable>
              <View style={{ flex: 1 }} />
              <AppButton
                title={copy.newGroupButton}
                onPress={openCreate}
                style={{ paddingHorizontal: 14, minWidth: 0 }}
              />
            </View>
            <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 20 }}>
              {copy.heroHint}
            </AppText>
          </View>

          {isWideShell ? (
            <SplitPane sidebarWidth={SPLIT_PANE_LIST_WIDTH} sidebar={treeSection} style={{ flex: 1 }}>
              <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <GroupDetailPanel model={model} />
              </ScrollView>
            </SplitPane>
          ) : (
            <ScrollView
              contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 24 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {treeSection}
              <GroupDetailPanel model={model} />
            </ScrollView>
          )}
        </View>
      </WidgetPageShell>

      <GroupFormSheet model={model} />
      <MoveMembersSheet model={model} />
      <AddMembersSheet model={model} />
    </View>
  );
}
