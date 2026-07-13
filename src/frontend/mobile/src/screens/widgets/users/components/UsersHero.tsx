import React, { useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { AppText, Icon, ProgressiveImage, Skeleton, WidgetEmptyState, WidgetErrorState, AppButton } from '@/src/components/ui';
import { useUsersWidgetLogic } from '../hooks/useUsersWidgetLogic';
import { useThemeColors } from '@/src/hooks';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { getDirectoryCopy } from '../utils/directoryCopy';
import { useRouter } from 'expo-router';
import { PressClay } from '@/src/components/animations/PressClay';

const getInitials = (firstName: string, lastName: string) => {
  const a = firstName?.trim()?.[0] ?? '';
  const b = lastName?.trim()?.[0] ?? '';
  return (a + b).toUpperCase();
};

export const UsersHero = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const { organization } = useCurrentOrganization();
  const copy = useMemo(() => getDirectoryCopy(organization?.organizationType), [organization?.organizationType]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { manager, isLoadingManager, isErrorManager, refetchManager, isLoadingMe } = useUsersWidgetLogic({
    teamPageSize: 12,
  });

  if (isLoadingMe || isLoadingManager) {
    return (
      <View style={styles.container}>
        <Skeleton height={86} borderRadius={24} />
      </View>
    );
  }

  if (isErrorManager) {
    return <WidgetErrorState message="Failed to load your advisor." onRetry={() => void refetchManager()} />;
  }

  if (!manager) {
    return (
      <View style={styles.container}>
        <WidgetEmptyState title="No manager assigned" description="Open the directory to find people." icon="person" />
        <AppButton title="Open directory" size="sm" variant="outline" icon="group" onPress={() => router.push('/users' as never)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PressClay onPress={() => router.push({ pathname: '/user-profile', params: { id: manager.id } } as never)}>
        <View style={styles.topRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            {manager.avatarUrl ? (
              <ProgressiveImage
                source={{ uri: manager.avatarUrl }}
                resizeMode="cover"
                style={styles.avatarImage}
              />
            ) : (
              <AppText variant="h3" weight="bold" style={{ color: colors.onPrimary }}>
                {getInitials(manager.firstName, manager.lastName)}
              </AppText>
            )}
          </View>

          <View style={styles.textBlock}>
            <AppText variant="caption" weight="bold" style={[styles.kicker, { color: colors.subtle }]}>
              {copy.managerKicker}
            </AppText>
            <AppText variant="h2" weight="bold" style={{ color: colors.text }} numberOfLines={1}>
              {manager.firstName} {manager.lastName}
            </AppText>
            {manager.title ? (
              <AppText variant="body" style={{ color: colors.subtle }} numberOfLines={1}>
                {manager.title}
              </AppText>
            ) : (
              <AppText variant="body" style={{ color: colors.subtle }} numberOfLines={1}>
                {manager.roleName}
              </AppText>
            )}
          </View>
        </View>
      </PressClay>

      <View style={styles.actionsRow}>
        {manager.email ? (
          <AppButton
            title="Email"
            size="sm"
            variant="outline"
            icon="mail"
            onPress={() => Linking.openURL(`mailto:${manager.email}`)}
            style={styles.actionButton}
          />
        ) : null}

        {manager.phone ? (
          <AppButton
            title="Call"
            size="sm"
            variant="outline"
            icon={'call' as any}
            onPress={() => Linking.openURL(`tel:${manager.phone}`)}
            style={styles.actionButton}
          />
        ) : null}

        {!manager.email && !manager.phone ? (
          <View style={styles.noActions}>
            <Icon name="info" size={18} color={colors.subtle} />
            <AppText variant="caption" style={{ color: colors.subtle, marginLeft: 6 }}>
              Contact hidden
            </AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      padding: 14,
      borderRadius: 20,
      minHeight: 140,
      justifyContent: 'space-between',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      ...StyleSheet.absoluteFillObject,
    },
    textBlock: {
      flex: 1,
      marginTop: 2,
    },
    kicker: {
      opacity: 0.95,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 14,
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
    },
    actionButton: {
      paddingHorizontal: 10,
    },
    noActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

