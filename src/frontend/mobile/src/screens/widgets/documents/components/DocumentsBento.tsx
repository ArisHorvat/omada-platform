import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { AppText, Skeleton, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { documentsApi } from '@/src/api/documentsApi';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { usePermission } from '@/src/context/PermissionContext';
import { useThemeColors } from '@/src/hooks';
import { isCorporateOrganization } from '@/src/screens/widgets/schedule/utils/organizationType';
import { categoryLabel } from '../utils/documentLabels';
import type { BaseWidgetProps } from '@/src/constants/widgets.registry';

interface DocumentsBentoProps {
  accentColor: string;
  size?: BaseWidgetProps['size'];
}

export const DocumentsBento: React.FC<DocumentsBentoProps> = ({ size }) => {
  const colors = useThemeColors();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const { can, isLoading: permissionsLoading } = usePermission();
  const isCorporate = isCorporateOrganization(organization);
  const isLarge = size === 'large' || size === 'wide';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.documents.list(orgId, '', null, 1),
    queryFn: () => documentsApi.list({ page: 1, pageSize: 3 }),
    enabled: !!orgId && isCorporate && can('documents.view'),
    staleTime: 60_000,
  });

  if (permissionsLoading) {
    return (
      <View style={styles.wrap}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="86%" height={12} style={{ marginTop: 8 }} />
      </View>
    );
  }

  if (!isCorporate) {
    return (
      <WidgetEmptyState
        title="Corporate only"
        description="Documents are available in corporate organizations."
        icon="folder-shared"
        style={styles.empty}
      />
    );
  }

  if (!can('documents.view')) {
    return (
      <WidgetEmptyState
        title="Documents unavailable"
        description="Enable the Documents widget for your role."
        icon="folder-shared"
        style={styles.empty}
      />
    );
  }

  if (isLoading) {
    return (
      <View style={styles.wrap}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="86%" height={12} style={{ marginTop: 8 }} />
      </View>
    );
  }

  if (isError) {
    return <WidgetErrorState message="Could not load documents." onRetry={() => void refetch()} />;
  }

  const recent = data?.items ?? [];
  const total = data?.totalCount ?? 0;

  if (total === 0) {
    return (
      <WidgetEmptyState
        title="No documents yet"
        description="Policies, HR packs, and templates appear here."
        icon="folder-shared"
        style={styles.empty}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <AppText
        variant={isLarge ? 'body' : 'caption'}
        weight="bold"
        numberOfLines={1}
        style={{ color: colors.text }}
      >
        {total} file{total === 1 ? '' : 's'} in library
      </AppText>
      {recent.slice(0, isLarge ? 3 : 2).map((doc) => (
        <AppText
          key={doc.id}
          variant="caption"
          numberOfLines={1}
          style={{ marginTop: 4, color: colors.subtle }}
        >
          {doc.title} · {categoryLabel(doc.category)}
        </AppText>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', minHeight: 0 },
  empty: { minHeight: 72, paddingVertical: 6 },
});
