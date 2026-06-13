import React from 'react';
import { View } from 'react-native';
import { AppText, ClayView } from '@/src/components/ui';
import type { SpiderSyncRunDto } from '@/src/api/generatedClient';

type Props = {
  colors: { card: string; text: string; subtle: string; border: string; primary: string; error: string; success: string };
  title: string;
  runs: SpiderSyncRunDto[];
  loading?: boolean;
};

function kindLabel(kind: SpiderSyncRunDto['kind']) {
  if (kind === 'News' || kind === 2) return 'News';
  return 'Schedule';
}

function statusColor(
  status: SpiderSyncRunDto['status'],
  colors: Props['colors'],
) {
  if (status === 'Failed' || status === 3) return colors.error;
  if (status === 'Completed' || status === 2) return colors.success;
  if (status === 'Running' || status === 1) return colors.primary;
  return colors.subtle;
}

function statusLabel(status: SpiderSyncRunDto['status']) {
  if (status === 'Failed' || status === 3) return 'Failed';
  if (status === 'Completed' || status === 2) return 'Completed';
  if (status === 'Running' || status === 1) return 'Running';
  return 'Queued';
}

export function SpiderSyncHistoryPanel({ colors, title, runs, loading }: Props) {
  return (
    <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
      <AppText variant="label" style={{ color: colors.subtle, marginBottom: 10 }}>
        {title}
      </AppText>
      {loading ? (
        <AppText variant="caption" style={{ color: colors.subtle }}>
          Loading sync history…
        </AppText>
      ) : !runs.length ? (
        <AppText variant="caption" style={{ color: colors.subtle }}>
          No sync jobs yet. Use Sync to DB to import schedule or news data.
        </AppText>
      ) : (
        runs.slice(0, 8).map((run) => (
          <View
            key={run.id}
            style={{
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                {kindLabel(run.kind)} sync
              </AppText>
              <AppText variant="caption" style={{ color: statusColor(run.status, colors) }}>
                {statusLabel(run.status)}
              </AppText>
            </View>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
              {new Date(run.startedAt).toLocaleString()}
            </AppText>
            {run.status === 'Completed' || run.status === 2 ? (
              <AppText variant="caption" style={{ color: colors.text }}>
                {run.itemsCreated} created · {run.itemsUpdated} updated · {run.itemsSkipped} skipped
                {(run.itemsRemoved ?? 0) > 0 ? ` · ${run.itemsRemoved} removed` : ''}
              </AppText>
            ) : null}
            {run.errorMessage ? (
              <AppText variant="caption" style={{ color: colors.error, marginTop: 4 }}>
                {run.errorMessage}
              </AppText>
            ) : null}
          </View>
        ))
      )}
    </ClayView>
  );
}
