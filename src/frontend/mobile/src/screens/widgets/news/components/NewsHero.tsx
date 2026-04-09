import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProgressiveImage, AppText, Skeleton, WidgetEmptyState, WidgetErrorState, ImageScrimGradient } from '@/src/components/ui';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useNewsLogic } from '../hooks/useNewsLogic';

export const NewsHero = () => {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const { data, isLoading, isError, refetch } = useNewsLogic({
    orgId,
    page: 1,
    pageSize: 5,
    enabled: !!orgId,
  });

  const items = data?.items ?? [];
  const latest = items[0];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Skeleton height="100%" borderRadius={20} />
      </View>
    );
  }

  if (isError) {
    return <WidgetErrorState message="Failed to load highlights." onRetry={() => void refetch()} />;
  }

  if (!latest) {
    return (
      <WidgetEmptyState
        title="No news yet"
        description="Announcements will appear here."
        icon="campaign"
      />
    );
  }

  return (
    <View style={styles.container}>
      {latest.coverImageUrl ? (
        <ProgressiveImage source={{ uri: latest.coverImageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.fallbackBg} />
      )}

      <ImageScrimGradient colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.72)']} />

      <View style={styles.content}>
        <AppText variant="caption" weight="bold" style={styles.kicker}>
          LATEST NEWS
        </AppText>
        <AppText variant="h2" weight="bold" style={styles.title} numberOfLines={3}>
          {latest.title}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 180,
    justifyContent: 'flex-end',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  fallbackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#334155',
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 28,
  },
  kicker: {
    color: '#FFFFFF',
    opacity: 0.86,
  },
  title: {
    color: '#FFFFFF',
    marginTop: 6,
  },
});
