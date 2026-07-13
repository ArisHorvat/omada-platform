import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { AppText, Skeleton, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { documentsApi } from '@/src/api/documentsApi';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { usePermission } from '@/src/context/PermissionContext';
import { isCorporateOrganization } from '@/src/screens/widgets/schedule/utils/organizationType';
import { categoryLabel } from '../utils/documentLabels';

interface DocumentsCardProps {
  accentColor: string;
}

export const DocumentsCard: React.FC<DocumentsCardProps> = ({ accentColor }) => {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const { can, isLoading: permissionsLoading } = usePermission();
  const isCorporate = isCorporateOrganization(organization);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.documents.list(orgId, '', null, 1),
    queryFn: () => documentsApi.list({ page: 1, pageSize: 3 }),
    enabled: !!orgId && isCorporate && can('documents.view'),
    staleTime: 60_000,
  });

  if (permissionsLoading || isLoading) {
    return (
      <View style={styles.wrap}>
        <Skeleton height={14} width="80%" />
        <Skeleton height={12} width="65%" style={{ marginTop: 10 }} />
        <Skeleton height={12} width="72%" style={{ marginTop: 8 }} />
      </View>
    );
  }

  if (!isCorporate) {
    return (
      <WidgetEmptyState
        title="Corporate only"
        description="Documents are available in corporate organizations."
        icon="folder-shared"
      />
    );
  }

  if (!can('documents.view')) {
    return (
      <WidgetEmptyState
        title="Documents unavailable"
        description="Enable the Documents widget for your role."
        icon="folder-shared"
      />
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
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <AppText variant="body" weight="bold" style={{ color: accentColor }}>
        {total} file{total === 1 ? '' : 's'} in library
      </AppText>
      {recent.map((doc) => (
        <AppText
          key={doc.id}
          variant="caption"
          numberOfLines={1}
          style={{ color: accentColor, opacity: 0.85, marginTop: 8 }}
        >
          {doc.title} · {categoryLabel(doc.category)}
        </AppText>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 0 },
});
