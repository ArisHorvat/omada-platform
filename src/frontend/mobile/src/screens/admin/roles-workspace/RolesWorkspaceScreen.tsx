import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { AppButton, AppText, ClayView, Icon, IconName, WidgetEmptyState } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { OptionPickerSheet } from '@/src/components/filters/OptionPickerSheet';
import { useThemeColors } from '@/src/hooks';
import { BASE_WIDGETS } from '@/src/constants/widgets';
import type { PermissionLevel } from '@/src/constants/permissions';
import { confirmAction } from '@/src/utils/confirmAction';
import { useRolesWorkspace } from './hooks/useRolesWorkspace';
import { createRolesWorkspaceStyles } from './styles/roles-workspace.styles';
import { resolveHoldingRoleOnDelete } from './utils/defaultRole';

const levelMeta = (level: PermissionLevel | undefined, colors: ReturnType<typeof useThemeColors>) => {
  switch (level) {
    case 'view':
      return { icon: 'visibility' as IconName, color: colors.success, label: 'View', bg: colors.success + '22' };
    case 'edit':
      return { icon: 'edit' as IconName, color: '#F59E0B', label: 'Edit', bg: '#F59E0B22' };
    case 'admin':
      return { icon: 'verified-user' as IconName, color: colors.error, label: 'Admin', bg: colors.error + '22' };
    default:
      return { icon: 'block' as IconName, color: colors.subtle, label: 'None', bg: colors.border };
  }
};

export default function RolesWorkspaceScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createRolesWorkspaceStyles(colors), [colors]);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

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
    isCreating,
    isDeleting,
    isLoading,
    isRoleDetailLoading,
    refetch,
  } = useRolesWorkspace();

  const roleOptions = useMemo(
    () =>
      roles
        .filter((r) => r.id && r.name)
        .map((r) => ({
          value: r.id!,
          label: `${r.name} · ${r.memberCount} member${r.memberCount === 1 ? '' : 's'}`,
        })),
    [roles],
  );

  const selectedRoleLabel = selectedRole?.name ?? 'Select role';

  const widgetRows = useMemo(() => {
    return widgets
      .filter((w) => !w.isCoreFeature)
      .map((w) => {
        const mobileDef = BASE_WIDGETS[w.key ?? ''];
        return {
          key: w.key ?? '',
          name: mobileDef?.name ?? w.name ?? w.key ?? '',
          description: w.description ?? '',
          icon: (mobileDef?.icon ?? 'widgets') as IconName,
          orgEnabled: w.isEnabledForOrganization !== false,
        };
      })
      .sort((a, b) => {
        if (a.orgEnabled === b.orgEnabled) return a.name.localeCompare(b.name);
        return a.orgEnabled ? -1 : 1;
      });
  }, [widgets]);

  const disabledOrgWidgetCount = widgetRows.filter((w) => !w.orgEnabled).length;
  const isProtectedRole = selectedRole?.name?.toLowerCase() === 'admin';
  const holdingRole = useMemo(
    () => (selectedRole?.id ? resolveHoldingRoleOnDelete(roles, selectedRole.id) : null),
    [roles, selectedRole?.id],
  );
  const canDeleteRole = !!selectedRole?.id && !isProtectedRole;

  const handleDeleteRole = () => {
    if (!selectedRole?.id || !canDeleteRole) return;
    const memberNote =
      selectedRole.memberCount > 0 && holdingRole
        ? holdingRole.willBeCreated
          ? ` ${selectedRole.memberCount} member${selectedRole.memberCount === 1 ? '' : 's'} will be moved to a new "${holdingRole.name}" holding role until you assign them another role in Members.`
          : ` ${selectedRole.memberCount} member${selectedRole.memberCount === 1 ? '' : 's'} will be moved to "${holdingRole.name}" until you assign them another role in Members.`
        : '';
    confirmAction({
      title: 'Delete role',
      message: `Delete "${selectedRole.name}"?${memberNote} This cannot be undone.`,
      confirmText: 'Delete role',
      destructive: true,
      onConfirm: () => deleteRole(selectedRole.id!),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageContainer fullBleed>
          <ScreenHeader
            title="Roles & permissions"
            subtitle={`${roles.length} role${roles.length === 1 ? '' : 's'} · widget access per role`}
          />

          <ScrollView
            contentContainerStyle={styles.scroll}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          >
            <View style={styles.clayShell}>
              <ClayView depth={4} puffy={10} color={colors.card} contentOverflow="hidden" style={styles.clayInner}>
                <AppText weight="bold">Role</AppText>
                <AppText variant="caption" style={styles.sectionHint}>
                  Choose a role to review or edit its widget permissions.
                </AppText>
                <RoleSelectField
                  label="Selected role"
                  value={selectedRoleLabel}
                  onPress={() => roles.length > 0 && setRolePickerOpen(true)}
                  colors={colors}
                  styles={styles}
                  disabled={roles.length === 0}
                />
                {selectedRole ? (
                  <View style={styles.roleSummaryRow}>
                    <ClayView depth={2} color={colors.primaryContainer} style={styles.statChip}>
                      <AppText variant="caption" style={{ color: colors.subtle }}>
                        Members
                      </AppText>
                      <AppText weight="bold">{selectedRole.memberCount}</AppText>
                    </ClayView>
                    <ClayView depth={2} color={colors.primaryContainer} style={styles.statChip}>
                      <AppText variant="caption" style={{ color: colors.subtle }}>
                        Permissions
                      </AppText>
                      <AppText weight="bold">{selectedRole.permissionCount}</AppText>
                    </ClayView>
                  </View>
                ) : null}
              </ClayView>
            </View>

            <View style={styles.clayShell}>
              <ClayView depth={4} puffy={10} color={colors.card} contentOverflow="hidden" style={styles.clayInner}>
                <AppText weight="bold">Create role</AppText>
                <AppText variant="caption" style={styles.sectionHint}>
                  Add a custom role, then assign widget access below.
                </AppText>
                <TextInput
                  value={newRoleName}
                  onChangeText={setNewRoleName}
                  placeholder="e.g. Department lead"
                  placeholderTextColor={colors.subtle}
                  style={styles.input}
                />
                <AppButton
                  title={isCreating ? 'Creating…' : 'Add role'}
                  variant="outline"
                  onPress={createRole}
                  disabled={isCreating || !newRoleName.trim()}
                />
              </ClayView>
            </View>

            {roles.length === 0 && !isLoading ? (
              <WidgetEmptyState
                title="No roles yet"
                description="Create your first role to configure widget access."
                icon="admin-panel-settings"
              />
            ) : null}

            {selectedRole ? (
              <View style={styles.clayShell}>
                <ClayView depth={4} puffy={10} color={colors.card} contentOverflow="hidden" style={styles.clayInner}>
                  <View style={styles.sectionTitleRow}>
                    <AppText weight="bold">Widget access</AppText>
                    {isRoleDetailLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
                  </View>
                  <AppText variant="caption" style={styles.sectionHint}>
                    Tap a widget to cycle access: View → Edit → Admin → None.
                    {disabledOrgWidgetCount > 0
                      ? ` ${disabledOrgWidgetCount} widget${disabledOrgWidgetCount === 1 ? ' is' : 's are'} turned off in your organization catalog.`
                      : ''}
                  </AppText>

                  <View style={styles.permLegend}>
                    {(['view', 'edit', 'admin'] as PermissionLevel[]).map((level) => {
                      const meta = levelMeta(level, colors);
                      return (
                        <View key={level} style={[styles.legendItem, { backgroundColor: meta.bg }]}>
                          <Icon name={meta.icon} size={14} color={meta.color} />
                          <AppText variant="caption" weight="bold" style={{ color: meta.color }}>
                            {meta.label}
                          </AppText>
                        </View>
                      );
                    })}
                  </View>

                  {widgetRows.map((widget) => {
                    const level = localPermissions[widget.key];
                    const meta = levelMeta(level, colors);
                    return (
                      <PressClay key={widget.key} onPress={() => cyclePermission(widget.key)}>
                        <View style={[styles.widgetShell, { opacity: widget.orgEnabled ? 1 : 0.7 }]}>
                          <ClayView depth={widget.orgEnabled ? 5 : 2} color={colors.card} style={styles.widgetInner}>
                            <View
                              style={[
                                styles.widgetIcon,
                                {
                                  backgroundColor: widget.orgEnabled ? meta.bg : colors.border,
                                },
                              ]}
                            >
                              <Icon
                                name={widget.icon}
                                size={22}
                                color={widget.orgEnabled ? meta.color : colors.subtle}
                              />
                            </View>
                            <View style={styles.widgetMeta}>
                              <AppText weight="bold" numberOfLines={1}>
                                {widget.name}
                              </AppText>
                              {widget.orgEnabled ? (
                                <AppText variant="caption" style={{ color: meta.color, marginTop: 2 }}>
                                  {meta.label} access
                                </AppText>
                              ) : (
                                <View style={styles.orgDisabledBadge}>
                                  <Icon name="visibility-off" size={14} color={colors.subtle} />
                                  <AppText variant="caption" style={{ color: colors.subtle }}>
                                    Disabled in organization
                                  </AppText>
                                </View>
                              )}
                              {!widget.orgEnabled && level ? (
                                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>
                                  Saved as {meta.label.toLowerCase()} — applies when enabled in catalog
                                </AppText>
                              ) : null}
                            </View>
                            <View style={[styles.levelPill, { backgroundColor: meta.bg }]}>
                              <Icon name={meta.icon} size={16} color={meta.color} />
                            </View>
                          </ClayView>
                        </View>
                      </PressClay>
                    );
                  })}

                  <AppButton
                    title={isSaving ? 'Saving…' : 'Save permissions'}
                    onPress={savePermissions}
                    disabled={isSaving || isRoleDetailLoading}
                    style={{ marginTop: 8 }}
                  />

                  {!isProtectedRole ? (
                    <View style={styles.dangerZone}>
                      {selectedRole.memberCount > 0 && holdingRole ? (
                        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
                          {selectedRole.memberCount} member{selectedRole.memberCount === 1 ? '' : 's'} will move to
                          {holdingRole.willBeCreated ? ' a new ' : ' '}
                          &quot;{holdingRole.name}&quot; holding role until you assign them another role in Members.
                        </AppText>
                      ) : (
                        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
                          Removing a role is permanent.
                        </AppText>
                      )}
                      <AppButton
                        title={isDeleting ? 'Deleting…' : 'Delete role'}
                        variant="outline"
                        onPress={handleDeleteRole}
                        disabled={isDeleting || !canDeleteRole}
                      />
                    </View>
                  ) : (
                    <AppText variant="caption" style={{ color: colors.subtle, marginTop: 16 }}>
                      The Admin role is protected and cannot be deleted.
                    </AppText>
                  )}
                </ClayView>
              </View>
            ) : (
              <ClayView depth={4} puffy={16} color={colors.card} style={styles.emptyState}>
                <Icon name="admin-panel-settings" size={32} color={colors.subtle} />
                <AppText style={{ color: colors.subtle, textAlign: 'center', marginTop: 10 }}>
                  Select a role to edit its widget permissions.
                </AppText>
              </ClayView>
            )}
          </ScrollView>

          <OptionPickerSheet
            isVisible={rolePickerOpen}
            onClose={() => setRolePickerOpen(false)}
            title="Select role"
            options={roleOptions}
            selected={selectedRoleId}
            onSelect={(value) => value && setSelectedRoleId(value)}
            includeAllOption={false}
            height={Math.min(520, 120 + roleOptions.length * 62)}
          />
        </PageContainer>
      </SafeAreaView>
    </View>
  );
}

function RoleSelectField({
  label,
  value,
  onPress,
  colors,
  styles,
  disabled,
}: {
  label: string;
  value: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  styles: ReturnType<typeof createRolesWorkspaceStyles>;
  disabled?: boolean;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginBottom: 8, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </AppText>
      <PressClay onPress={disabled ? undefined : onPress}>
        <View style={[styles.selectField, disabled && { opacity: 0.5 }]}>
          <ClayView
            depth={4}
            puffy={0}
            color={colors.background}
            contentOverflow="hidden"
            style={styles.selectFieldInner}
          >
            <View style={styles.selectFieldRow}>
              <AppText weight="bold" style={styles.selectFieldLabel} numberOfLines={1}>
                {value}
              </AppText>
              <Icon name="expand-more" size={24} color={colors.subtle} />
            </View>
          </ClayView>
        </View>
      </PressClay>
    </View>
  );
}
