import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ProgressiveImage, AppText, Skeleton, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';
import { useUsersWidgetLogic } from '../hooks/useUsersWidgetLogic';
import { useThemeColors } from '@/src/hooks';
import { ClayView } from '@/src/components/ui/ClayView';

const AVATAR_SIZE = 44;

export const UsersCard = () => {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { manager, teamUsers, isLoadingTeam, isErrorTeam, refetchTeam } = useUsersWidgetLogic({
    teamPageSize: 12,
  });

  // If user has no manager set, we cannot build "My Team" reliably.
  if (!manager) {
    return <WidgetEmptyState title="No team yet" description="Your team will appear here." icon="person" />;
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
        MY TEAM
      </AppText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {teamUsers.length === 0 ? (
          <WidgetEmptyState title="No one here yet" description="Try again later." icon="person" style={{ minHeight: 84 }} />
        ) : (
          teamUsers.map((u) => (
            <View key={u.id} style={styles.avatarWrap}>
              <ClayView depth={10} puffy={18} color={colors.primaryContainer} style={styles.avatarClay}>
                {u.avatarUrl ? (
                  <ProgressiveImage source={{ uri: u.avatarUrl }} resizeMode="cover" style={styles.avatarImage} />
                ) : (
                  <AppText variant="body" weight="bold" style={{ color: colors.onPrimaryContainer }}>
                    {(u.firstName?.[0] ?? '').toUpperCase()}
                  </AppText>
                )}
              </ClayView>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const makeStyles = (colors: any) =>
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
      alignItems: 'center',
      gap: 12,
      paddingVertical: 4,
    },
    avatarWrap: {
      width: AVATAR_SIZE + 10,
      alignItems: 'center',
      justifyContent: 'center',
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
    avatarSkeletonWrap: {
      width: AVATAR_SIZE + 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

