import React from 'react';
import { View } from 'react-native';
import { AppText, ClayView } from '@/src/components/ui';
import type { ScrapedEventDto } from '@/src/api/generatedClient';
import type { WebSpiderWorkspaceModel } from '../hooks/useWebSpiderWorkspace';

type Props = {
  model: WebSpiderWorkspaceModel;
  event: ScrapedEventDto;
  index: number;
};

function FieldRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: WebSpiderWorkspaceModel['colors'];
}) {
  if (!value?.trim()) return null;
  return (
    <View style={{ marginTop: 6 }}>
      <AppText variant="caption" style={{ color: colors.subtle }}>
        {label}
      </AppText>
      <AppText variant="body" style={{ color: colors.text }}>
        {value}
      </AppText>
    </View>
  );
}

export function ScrapedEventPreviewCard({ model, event, index }: Props) {
  const { colors } = model;

  return (
    <ClayView
      depth={2}
      color={colors.card}
      style={{ borderRadius: 14, padding: 14, marginBottom: 10 }}
    >
      <AppText variant="label" weight="bold" style={{ color: colors.primary, marginBottom: 4 }}>
        Row {index + 1}
      </AppText>
      <FieldRow label="Class / course" value={event.className} colors={colors} />
      <FieldRow label="Time" value={event.time} colors={colors} />
      <FieldRow label="Room / location" value={event.room} colors={colors} />
      <FieldRow label="Teacher / professor" value={event.professor} colors={colors} />
      <FieldRow label="Group" value={event.groupNumber} colors={colors} />
    </ClayView>
  );
}
