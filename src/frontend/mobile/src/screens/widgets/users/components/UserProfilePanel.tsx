import React, { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { PressClay } from '@/src/components/animations/PressClay';
import {
  AppButton,
  AppText,
  ClayView,
  Icon,
  ProgressiveImage,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useUserProfileLogic } from '../hooks/useUserProfileLogic';
import { getDirectoryCopy } from '../utils/directoryCopy';

const AVATAR_SIZE = 120;

const statusColor = (s: string | null | undefined, colors: ReturnType<typeof useThemeColors>) => {
  switch (s) {
    case 'Busy':
      return '#f59e0b';
    case 'Offline':
      return colors.subtle;
    case 'Free':
    default:
      return colors.success ?? '#22c55e';
  }
};

interface UserProfilePanelProps {
  userId: string | undefined;
  onOpenUser?: (id: string) => void;
  onFilterByGroup?: (groupId: string) => void;
}

export function UserProfilePanel({ userId, onOpenUser, onFilterByGroup }: UserProfilePanelProps) {
  const colors = useThemeColors();
  const { organization } = useCurrentOrganization();
  const copy = useMemo(() => getDirectoryCopy(organization?.organizationType), [organization?.organizationType]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { profile, manager, availability, isLoading, isError, refetch, isLoadingStatus } =
    useUserProfileLogic(userId);

  const initials = (() => {
    if (!profile) return '?';
    const a = profile.firstName?.[0] ?? '';
    const b = profile.lastName?.[0] ?? '';
    return `${a}${b}`.toUpperCase();
  })();

  const availabilityText = isLoadingStatus ? '…' : availability ?? '—';
  const departmentName = (profile as { departmentName?: string | null } | null)?.departmentName ?? null;
  const groups = ((profile as { groups?: { id?: string; name?: string; type?: string }[] } | null)?.groups ?? []).filter(
    (g) => g.id && g.name,
  );

  if (!userId) {
    return (
      <View style={styles.centered}>
        <WidgetEmptyState
          title="Select a person"
          description="Pick someone from the directory to view their profile."
          icon="person"
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingPad}>
        <View style={styles.heroCenter}>
          <Skeleton width={AVATAR_SIZE} height={AVATAR_SIZE} borderRadius={AVATAR_SIZE / 2} />
          <View style={{ height: 16 }} />
          <Skeleton height={28} width="60%" borderRadius={8} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <WidgetErrorState message="Could not load profile." onRetry={() => void refetch()} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <WidgetEmptyState title="User not found" icon="person" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <ClayView depth={12} puffy={6} color={colors.background} style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            {profile.avatarUrl ? (
              <ProgressiveImage source={{ uri: profile.avatarUrl }} style={styles.avatarImg} resizeMode="cover" />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.primaryContainer }]}>
                <AppText variant="h1" weight="bold" style={{ color: colors.primary, fontSize: 42 }}>
                  {initials}
                </AppText>
              </View>
            )}
          </View>
        </ClayView>

        <AppText variant="display" weight="bold" style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {profile.firstName} {profile.lastName}
        </AppText>

        {profile.roleName ? (
          <View style={[styles.rolePill, { backgroundColor: `${colors.primary}14`, borderColor: `${colors.primary}33` }]}>
            <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
              {profile.roleName}
            </AppText>
          </View>
        ) : null}

        {departmentName ? (
          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8, textAlign: 'center' }} numberOfLines={2}>
            {copy.primaryDepartmentLabel}: {departmentName}
          </AppText>
        ) : null}

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusPill,
              {
                borderColor: statusColor(availability, colors) + 'AA',
                backgroundColor: statusColor(availability, colors) + '15',
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColor(availability, colors) }]} />
            <AppText variant="caption" weight="bold" style={{ color: statusColor(availability, colors) }}>
              {availabilityText}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.quickActionsRow}>
        <View style={{ flex: 1 }}>
          <AppButton
            title="Message"
            icon="mail"
            variant={profile.email ? 'primary' : 'secondary'}
            disabled={!profile.email}
            onPress={() => Linking.openURL(`mailto:${profile.email}`)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppButton
            title="Call"
            icon={'call' as never}
            variant="secondary"
            disabled={!profile.phone}
            onPress={() => Linking.openURL(`tel:${profile.phone}`)}
          />
        </View>
      </View>

      <ClayView depth={8} puffy={14} color={colors.card} style={styles.detailsCard}>
        {profile.bio ? (
          <View style={styles.detailSection}>
            <AppText variant="caption" weight="bold" style={[styles.sectionTitle, { color: colors.subtle }]}>
              ABOUT
            </AppText>
            <AppText variant="body" style={{ color: colors.text, lineHeight: 24 }}>
              {profile.bio}
            </AppText>
          </View>
        ) : null}

        <View style={[styles.detailSection, profile.bio && styles.detailSectionBorder]}>
          <AppText variant="caption" weight="bold" style={[styles.sectionTitle, { color: colors.subtle }]}>
            CONTACT INFO
          </AppText>

          {profile.email ? (
            <View style={styles.infoRow}>
              <ClayView depth={4} puffy={6} color={colors.background} style={styles.infoIconWrap}>
                <Icon name="mail" size={18} color={colors.subtle} />
              </ClayView>
              <View style={styles.infoTextCol}>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  Email
                </AppText>
                <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                  {profile.email}
                </AppText>
              </View>
            </View>
          ) : null}

          {profile.phone ? (
            <View style={[styles.infoRow, { marginTop: 16 }]}>
              <ClayView depth={4} puffy={6} color={colors.background} style={styles.infoIconWrap}>
                <Icon name="call" size={18} color={colors.subtle} />
              </ClayView>
              <View style={styles.infoTextCol}>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  Phone
                </AppText>
                <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                  {profile.phone}
                </AppText>
              </View>
            </View>
          ) : null}

          {!profile.email && !profile.phone ? (
            <AppText variant="body" style={{ color: colors.subtle, fontStyle: 'italic' }}>
              Contact information is hidden.
            </AppText>
          ) : null}
        </View>

        {groups.length > 0 ? (
          <View style={[styles.detailSection, styles.detailSectionBorder]}>
            <AppText variant="caption" weight="bold" style={[styles.sectionTitle, { color: colors.subtle }]}>
              {copy.groupsSectionTitle.toUpperCase()}
            </AppText>
            <View style={styles.groupChipWrap}>
              {groups.map((group) => (
                <PressClay
                  key={group.id}
                  onPress={() => {
                    if (group.id && onFilterByGroup) onFilterByGroup(group.id);
                  }}
                >
                  <ClayView
                    depth={4}
                    color={colors.background}
                    style={[styles.groupChip, { borderColor: colors.border }]}
                  >
                    <Icon name="groups" size={14} color={colors.primary} />
                    <AppText variant="caption" weight="bold" style={{ color: colors.text, flex: 1 }} numberOfLines={1}>
                      {group.name}
                    </AppText>
                  </ClayView>
                </PressClay>
              ))}
            </View>
          </View>
        ) : null}

        {profile.managerId ? (
          <View style={[styles.detailSection, styles.detailSectionBorder]}>
            <AppText variant="caption" weight="bold" style={[styles.sectionTitle, { color: colors.subtle }]}>
              REPORTS TO
            </AppText>
            <PressClay
              onPress={() => {
                if (profile.managerId && onOpenUser) onOpenUser(profile.managerId);
              }}
            >
              <View style={styles.managerRow}>
                <ClayView depth={4} puffy={6} color={colors.primaryContainer} style={styles.infoIconWrap}>
                  <Icon name="person" size={20} color={colors.primary} />
                </ClayView>
                <View style={styles.infoTextCol}>
                  <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                    {manager ? `${manager.firstName} ${manager.lastName}` : 'Loading...'}
                  </AppText>
                  {manager?.roleName ? (
                    <View
                      style={[
                        styles.rolePill,
                        styles.managerRolePill,
                        { backgroundColor: `${colors.primary}14`, borderColor: `${colors.primary}33` },
                      ]}
                    >
                      <AppText variant="caption" weight="bold" style={{ color: colors.primary }} numberOfLines={1}>
                        {manager.roleName}
                      </AppText>
                    </View>
                  ) : null}
                </View>
                {onOpenUser ? <Icon name="chevron-right" size={24} color={colors.subtle} /> : null}
              </View>
            </PressClay>
          </View>
        ) : null}
      </ClayView>
    </ScrollView>
  );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      paddingTop: 8,
    },
    loadingPad: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 18,
    },
    hero: {
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 24,
    },
    heroCenter: {
      alignItems: 'center',
    },
    avatarRing: {
      width: AVATAR_SIZE + 8,
      height: AVATAR_SIZE + 8,
      borderRadius: (AVATAR_SIZE + 8) / 2,
      padding: 4,
      marginBottom: 16,
    },
    avatarInner: {
      flex: 1,
      borderRadius: AVATAR_SIZE / 2,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImg: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
    },
    avatarFallback: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {
      textAlign: 'center',
      marginBottom: 8,
    },
    rolePill: {
      alignSelf: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: 4,
    },
    managerRolePill: {
      alignSelf: 'flex-start',
      marginTop: 4,
      marginBottom: 0,
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    quickActionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
      width: '100%',
    },
    detailsCard: {
      borderRadius: 24,
      overflow: 'hidden',
    },
    detailSection: {
      padding: 20,
    },
    detailSectionBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    sectionTitle: {
      marginBottom: 12,
      letterSpacing: 0.8,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    infoTextCol: {
      flex: 1,
      justifyContent: 'center',
    },
    managerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    groupChipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    groupChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      maxWidth: '100%',
    },
  });
