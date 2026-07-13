import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ProgressiveImage,
  AppText,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
  ClayView,
} from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { AppButton } from '@/src/components/ui';
import { useUsersWidgetLogic } from '../hooks/useUsersWidgetLogic';
import { useThemeColors } from '@/src/hooks';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { getDirectoryCopy } from '../utils/directoryCopy';

const AVATAR_SIZE = 44;

export const UsersCard = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const { organization } = useCurrentOrganization();
  const copy = useMemo(() => getDirectoryCopy(organization?.organizationType), [organization?.organizationType]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { manager, teamUsers, isLoadingTeam, isErrorTeam, refetchTeam } = useUsersWidgetLogic({
    teamPageSize: 12,
  });

  if (!manager) {
    return (
      <View style={styles.container}>
        <WidgetEmptyState
          title="Browse the directory"
          description="Find colleagues and open their profiles."
          icon="group"
        />
        <AppButton
          title="Open directory"
          variant="secondary"
          icon="group"
          onPress={() => router.push('/users' as never)}
          style={{ marginTop: 8 }}
        />
      </View>
    );
  }

  if (isLoadingTeam) {
    return (
      <View style={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <View key={idx} style={styles.avatarSkeletonWrap}>
              <Skeleton width={AVATAR_SIZE} height={AVATAR_SIZE} borderRadius={AVATAR_SIZE / 2} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (isErrorTeam) {
    return <WidgetErrorState message="Failed to load team." onRetry={() => void refetchTeam()} />;
  }

  return (
    <View style={styles.container}>
      <AppText variant="caption" weight="bold" style={[styles.title, { color: colors.subtle }]}>
        {copy.teamKicker}
      </AppText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {teamUsers.length === 0 ? (
          <WidgetEmptyState title="No teammates yet" description="Your peers will appear here." icon="person" style={{ minHeight: 84 }} />
        ) : (
          teamUsers.map((u) => (
            <PressClay
              key={u.id}
              onPress={() =>
                router.push({ pathname: '/user-profile', params: { id: u.id } } as never)
              }
            >
              <View style={styles.avatarWrap}>
                <ClayView depth={10} puffy={18} color={colors.primaryContainer} style={styles.avatarClay}>
                  {u.avatarUrl ? (
                    <ProgressiveImage source={{ uri: u.avatarUrl }} resizeMode="cover" style={styles.avatarImage} />
                  ) : (
                    <AppText variant="body" weight="bold" style={{ color: colors.onPrimaryContainer }}>
                      {(u.firstName?.[0] ?? '').toUpperCase()}
                    </AppText>
                  )}
                </ClayView>
                <AppText variant="caption" numberOfLines={1} style={[styles.avatarName, { color: colors.text }]}>
                  {u.firstName}
                </AppText>
              </View>
            </PressClay>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const makeStyles = (colors: { subtle: string; text: string }) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 140,
    },
    title: {
      marginBottom: 10,
      opacity: 0.9,
    },
    scrollContent: {
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 4,
    },
    avatarWrap: {
      width: 72,
      alignItems: 'center',
    },
    avatarClay: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      ...StyleSheet.absoluteFillObject,
    },
    avatarName: {
      marginTop: 6,
      maxWidth: 72,
      textAlign: 'center',
    },
    avatarSkeletonWrap: {
      width: AVATAR_SIZE + 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
