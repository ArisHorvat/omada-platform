import React, { useMemo } from 'react';
import { Dimensions, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { ScreenTransition } from '@/src/components/animations';
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
import { useUserProfileLogic } from '../hooks/useUserProfileLogic';

const AVATAR_SIZE = 120;
const SCREEN_W = Dimensions.get('window').width;

const statusColor = (s: string | null | undefined, colors: any) => {
  switch (s) {
    case 'Busy':
      return colors.warning ?? '#f59e0b';
    case 'Offline':
      return colors.subtle;
    case 'Free':
    default:
      return colors.success ?? '#22c55e';
  }
};

export default function UserProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { profile, manager, availability, isLoading, isError, refetch, isLoadingStatus } = useUserProfileLogic(id);

  const initials = (() => {
    if (!profile) return '?';
    const a = profile.firstName?.[0] ?? '';
    const b = profile.lastName?.[0] ?? '';
    return `${a}${b}`.toUpperCase();
  })();

  const roleLabel = profile?.title ? profile.title : profile?.roleName ?? '';
  const availabilityText = isLoadingStatus ? '…' : availability ?? '—';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <ScreenTransition style={{ flex: 1 }}>
        <View style={styles.headerBar}>
          <ClayBackButton />
        </View>

        {isLoading ? (
          <View style={styles.loadingPad}>
            <View style={styles.heroCenter}>
              <Skeleton width={AVATAR_SIZE} height={AVATAR_SIZE} borderRadius={AVATAR_SIZE / 2} />
              <View style={{ height: 16 }} />
              <Skeleton height={28} width="60%" borderRadius={8} />
              <View style={{ height: 8 }} />
              <Skeleton height={16} width="40%" borderRadius={8} />
            </View>
            <View style={{ height: 40 }} />
            <Skeleton height={120} borderRadius={20} />
          </View>
        ) : isError ? (
          <View style={styles.centered}>
            <WidgetErrorState message="Could not load profile." onRetry={() => void refetch()} />
          </View>
        ) : !profile ? (
          <View style={styles.centered}>
            <WidgetEmptyState title="User not found" icon="person" />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. BREATHABLE HERO SECTION */}
            <View style={styles.hero}>
              <ClayView
                depth={12}
                puffy={6}
                color={colors.background}
                style={styles.avatarRing}
              >
                {/* 🚀 ADDED INNER WRAPPER TO FORCE PERFECT CIRCLE */}
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

              {roleLabel ? (
                <AppText variant="h3" style={[styles.roleLabel, { color: colors.subtle }]} numberOfLines={1}>
                  {roleLabel}
                </AppText>
              ) : null}

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusPill,
                    { borderColor: statusColor(availability, colors) + 'AA', backgroundColor: statusColor(availability, colors) + '15' },
                  ]}
                >
                  <View style={[styles.statusDot, { backgroundColor: statusColor(availability, colors) }]} />
                  <AppText
                    variant="caption"
                    weight="bold"
                    style={{ color: statusColor(availability, colors) }}
                  >
                    {availabilityText}
                  </AppText>
                </View>
              </View>
            </View>

            {/* 2. QUICK ACTIONS (Call / Email) */}
            <View style={styles.quickActionsRow}>
              {/* 🚀 WRAPPED BUTTONS IN FLEX: 1 TO FORCE ALIGNMENT */}
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
                  icon={'call' as any}
                  variant={profile.phone ? 'secondary' : 'secondary'}
                  disabled={!profile.phone}
                  onPress={() => Linking.openURL(`tel:${profile.phone}`)}
                />
              </View>
            </View>

            {/* 3. DETAILS BENTO BOX */}
            <ClayView depth={8} puffy={14} color={colors.card} style={styles.detailsCard}>
              
              {/* Bio Section */}
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

              {/* Contact Info Section */}
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
                      <AppText variant="caption" style={{ color: colors.subtle }}>Email</AppText>
                      <AppText variant="body" weight="bold" style={{ color: colors.text }}>{profile.email}</AppText>
                    </View>
                  </View>
                ) : null}

                {profile.phone ? (
                  <View style={[styles.infoRow, { marginTop: 16 }]}>
                    <ClayView depth={4} puffy={6} color={colors.background} style={styles.infoIconWrap}>
                      <Icon name="call" size={18} color={colors.subtle} />
                    </ClayView>
                    <View style={styles.infoTextCol}>
                      <AppText variant="caption" style={{ color: colors.subtle }}>Phone</AppText>
                      <AppText variant="body" weight="bold" style={{ color: colors.text }}>{profile.phone}</AppText>
                    </View>
                  </View>
                ) : null}

                {!profile.email && !profile.phone ? (
                   <AppText variant="body" style={{ color: colors.subtle, fontStyle: 'italic' }}>
                     Contact information is hidden.
                   </AppText>
                ) : null}
              </View>

              {/* Organization Section */}
              {profile.managerId ? (
                <View style={[styles.detailSection, styles.detailSectionBorder]}>
                  <AppText variant="caption" weight="bold" style={[styles.sectionTitle, { color: colors.subtle }]}>
                    REPORTS TO
                  </AppText>
                  <PressClay
                    onPress={() => router.push({ pathname: '/user-profile', params: { id: profile.managerId } } as any)}
                  >
                    <View style={styles.managerRow}>
                      <ClayView depth={4} puffy={6} color={colors.primaryContainer} style={styles.infoIconWrap}>
                        <Icon name="person" size={20} color={colors.primary} />
                      </ClayView>
                      <View style={styles.infoTextCol}>
                        <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                          {manager ? `${manager.firstName} ${manager.lastName}` : 'Loading...'}
                        </AppText>
                        <AppText variant="caption" style={{ color: colors.subtle }}>
                           {manager?.title || manager?.roleName || 'Manager'}
                        </AppText>
                      </View>
                      <Icon name="chevron-right" size={24} color={colors.subtle} />
                    </View>
                  </PressClay>
                </View>
              ) : null}

            </ClayView>

          </ScrollView>
        )}
      </ScreenTransition>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    root: { flex: 1 },
    headerBar: {
      paddingHorizontal: 16,
      paddingBottom: 6,
      paddingTop: 8,
      zIndex: 10,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    loadingPad: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    centered: { 
      flex: 1, 
      justifyContent: 'center', 
      paddingHorizontal: 18 
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
      padding: 4, // 🚀 Changed to padding to perfectly space the inner circle
      marginBottom: 16,
    },
    // 🚀 ADDED NEW INNER WRAPPER STYLE
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
      marginBottom: 4,
    },
    roleLabel: {
      textAlign: 'center',
      marginBottom: 12,
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
      width: '100%', // Ensure the row takes up full width
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
  });