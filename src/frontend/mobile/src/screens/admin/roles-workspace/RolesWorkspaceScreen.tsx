import React, { useMemo } from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { AppButton, AppText, ClayView, Icon, IconName } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { useThemeColors } from '@/src/hooks';
import { BASE_WIDGETS } from '@/src/constants/widgets';
import type { PermissionLevel } from '@/src/constants/permissions';
import { useRolesWorkspace } from '../hooks/useRolesWorkspace';

const levelMeta = (level: PermissionLevel | undefined, colors: ReturnType<typeof useThemeColors>) => {
  switch (level) {
    case 'view':
      return { icon: 'visibility' as IconName, color: colors.success, label: 'Viewer' };
    case 'edit':
      return { icon: 'edit' as IconName, color: '#F59E0B', label: 'Editor' };
    case 'admin':
      return { icon: 'verified-user' as IconName, color: colors.error, label: 'Admin' };
    default:
      return { icon: 'add-circle-outline' as IconName, color: colors.subtle, label: 'None' };
  }
};

export default function RolesWorkspaceScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    roles,
    widgets,
    selectedRoleId,
    setSelectedRoleId,
    selectedRole,
    localPermissions,
    cyclePermission,
    newRoleName,
    setNewRoleName,
    createRole,
    savePermissions,
    deleteRole,
    isSaving,
  } = useRolesWorkspace();

  const widgetRows = useMemo(() => {
    return widgets
      .filter((w) => !w.isCoreFeature)
      .map((w) => {
        const mobileDef = BASE_WIDGETS[w.key ?? ''];
        return {
          key: w.key ?? '',
          name: mobileDef?.name ?? w.name ?? w.key ?? '',
          icon: (mobileDef?.icon ?? 'widgets') as IconName,
        };
      });
  }, [widgets]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <PageContainer>
        <View style={styles.header}>
          <ClayBackButton />
          <AppText variant="h3" weight="bold">
            Roles & permissions
          </AppText>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <AppText variant="caption" style={styles.sectionLabel}>
            ROLES
          </AppText>
          <View style={styles.roleRow}>
            {roles.map((role) => (
              <Pressable key={role.id} onPress={() => setSelectedRoleId(role.id ?? null)}>
                <ClayView
                  depth={selectedRoleId === role.id ? 8 : 4}
                  puffy={10}
                  color={selectedRoleId === role.id ? colors.primaryContainer : colors.card}
                  style={styles.roleChip}
                >
                  <AppText weight="bold" variant="caption">
                    {role.name}
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    {role.memberCount} members
                  </AppText>
                </ClayView>
              </Pressable>
            ))}
          </View>

          <ClayView depth={4} puffy={12} color={colors.card} style={styles.newRoleCard}>
            <TextInput
              value={newRoleName}
              onChangeText={setNewRoleName}
              placeholder="New role name"
              placeholderTextColor={colors.subtle}
              style={{ color: colors.text, marginBottom: 10 }}
            />
            <AppButton title="Add role" variant="outline" size="sm" onPress={createRole} />
          </ClayView>

          {selectedRole ? (
            <>
              <View style={styles.permHeader}>
                <AppText weight="bold">{selectedRole.name} — widget access</AppText>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  Tap to cycle: View → Edit → Admin → None
                </AppText>
              </View>

              {widgetRows.map((widget) => {
                const level = localPermissions[widget.key];
                const meta = levelMeta(level, colors);
                return (
                  <PressClay key={widget.key} onPress={() => cyclePermission(widget.key)}>
                    <ClayView depth={6} puffy={12} color={colors.card} style={styles.widgetRow}>
                      <View style={[styles.widgetIcon, { backgroundColor: meta.color + '22' }]}>
                        <Icon name={widget.icon} size={20} color={meta.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText weight="bold">{widget.name}</AppText>
                        <AppText variant="caption" style={{ color: meta.color }}>
                          {meta.label}
                        </AppText>
                      </View>
                      <Icon name={meta.icon} size={22} color={meta.color} />
                    </ClayView>
                  </PressClay>
                );
              })}

              <AppButton
                title={isSaving ? 'Saving…' : 'Save permissions'}
                onPress={savePermissions}
                disabled={isSaving}
                style={{ marginTop: 16 }}
              />

              {selectedRole.name?.toLowerCase() !== 'admin' ? (
                <AppButton
                  title="Delete role"
                  variant="outline"
                  onPress={() => selectedRole.id && deleteRole(selectedRole.id)}
                  style={{ marginTop: 10 }}
                />
              ) : null}
            </>
          ) : (
            <ClayView depth={4} puffy={16} color={colors.card} style={{ borderRadius: 16, marginTop: 16 }}>
              <AppText style={{ color: colors.subtle, textAlign: 'center' }}>
                Select a role to edit its widget permissions.
              </AppText>
            </ClayView>
          )}
        </ScrollView>
      </PageContainer>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    header: { paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
    scroll: { paddingHorizontal: 16, paddingBottom: 120 },
    sectionLabel: { color: colors.subtle, marginBottom: 8 },
    roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    roleChip: { borderRadius: 14, paddingHorizontal: 12, minWidth: 100 },
    newRoleCard: { borderRadius: 14, marginBottom: 20 },
    permHeader: { marginBottom: 12 },
    widgetRow: {
      borderRadius: 14,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    widgetIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
