import React, { useMemo } from 'react';
import { View } from 'react-native';

import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import { AdminTextInput } from '@/src/screens/admin/components/AdminTextInput';
import { normalizeEventTypeColor } from '@/src/constants/eventTypeColors';
import { useThemeColors } from '@/src/hooks';
import type { EventTypeDto } from '@/src/api/generatedClient';
import { createEventTypesWorkspaceStyles } from '../styles/event-types-workspace.styles';
import { EventTypeColorPicker } from './EventTypeColorPicker';
import { EventTypeUsagePreview } from './EventTypeUsagePreview';

type Props = {
  type: EventTypeDto;
  isEditing: boolean;
  editName: string;
  editColor: string;
  isSaving: boolean;
  onEditNameChange: (value: string) => void;
  onEditColorChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
};

export function EventTypeListCard({
  type,
  isEditing,
  editName,
  editColor,
  isSaving,
  onEditNameChange,
  onEditColorChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createEventTypesWorkspaceStyles(colors), [colors]);
  const displayColor = normalizeEventTypeColor(isEditing ? editColor : type.color);
  const displayName = (isEditing ? editName : type.name)?.trim() || 'Event type';

  return (
    <ClayView depth={2} color={colors.card} style={styles.typeCard}>
      {isEditing ? (
        <>
          <AppText variant="label" style={styles.sectionLabel}>
            EDIT TYPE
          </AppText>
          <AdminTextInput
            value={editName}
            onChangeText={onEditNameChange}
            placeholder="Name"
          />
          <AppText variant="label" style={[styles.sectionLabel, { marginBottom: 8 }]}>
            COLOR
          </AppText>
          <EventTypeColorPicker value={editColor} onChange={onEditColorChange} />
          <EventTypeUsagePreview name={editName} color={editColor} />
          <View style={styles.editActions}>
            <AppButton title="Save" onPress={onSaveEdit} disabled={isSaving || !editName.trim()} style={{ minWidth: 90 }} />
            <AppButton title="Cancel" variant="outline" onPress={onCancelEdit} style={{ minWidth: 90 }} />
          </View>
        </>
      ) : (
        <>
          <View style={styles.typeCardHeader}>
            <View style={styles.typeCardTitleRow}>
              <View style={[styles.typeColorDot, { backgroundColor: displayColor }]} />
              <AppText variant="body" weight="bold" style={{ color: colors.text, flex: 1 }} numberOfLines={1}>
                {type.name}
              </AppText>
            </View>
            <View style={styles.typeActions}>
              <AppButton title="Edit" variant="outline" onPress={onStartEdit} style={{ minWidth: 68 }} />
              <AppButton title="Delete" variant="outline" onPress={onDelete} style={{ minWidth: 72 }} />
            </View>
          </View>

          <View style={styles.miniPreviewRow}>
            <ClayView color={displayColor} depth={3} style={styles.miniPreviewChip}>
              <AppText variant="caption" style={{ color: '#fff', opacity: 0.85 }}>
                09:00
              </AppText>
              <AppText weight="bold" style={{ color: '#fff', fontSize: 12 }} numberOfLines={1}>
                {displayName}
              </AppText>
            </ClayView>
            <ClayView color={displayColor} depth={5} style={styles.miniBookingChip}>
              <AppText weight="bold" style={{ color: '#fff', fontSize: 12, flex: 1 }} numberOfLines={1}>
                {displayName}
              </AppText>
              <Icon name="check" size={16} color="#FFF" />
            </ClayView>
          </View>
        </>
      )}
    </ClayView>
  );
}
