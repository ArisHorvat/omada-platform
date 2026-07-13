import React, { useMemo } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { AppButton, AppText, ClayView, Icon, IconName } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import type { OrganizationDocumentDto } from '@/src/api/documentsApi';
import { formatDocumentSize } from '@/src/api/documentsApi';
import { categoryLabel } from '../utils/documentLabels';

function fileIconName(contentType: string): IconName {
  const mime = contentType.toLowerCase();
  if (mime.includes('pdf')) return 'picture-as-pdf';
  if (mime.startsWith('image/')) return 'image';
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('presentation') ||
    mime.includes('text')
  ) {
    return 'description';
  }
  return 'insert-drive-file';
}

interface DocumentDetailSheetProps {
  visible: boolean;
  document: OrganizationDocumentDto | null;
  canEdit: boolean;
  canDelete: boolean;
  busy?: boolean;
  onClose: () => void;
  onOpen: () => void;
  onDownload: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function DocumentDetailSheet({
  visible,
  document,
  canEdit,
  canDelete,
  busy = false,
  onClose,
  onOpen,
  onDownload,
  onEdit,
  onDelete,
}: DocumentDetailSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const sheetHeight = useMemo(() => {
    if (!document) return 420;
    const actionCount = 2 + (canEdit ? 1 : 0) + (canDelete ? 1 : 0);
    const metaRows = 3 + (document.createdAt ? 1 : 0) + (document.description ? 1 : 0);
    const estimated =
      88 +
      72 +
      metaRows * 34 +
      28 +
      20 +
      actionCount * 48 +
      (actionCount - 1) * 8 +
      insets.bottom +
      16;
    return Math.min(windowHeight * 0.88, Math.max(estimated, 360));
  }, [canDelete, canEdit, document, insets.bottom, windowHeight]);

  if (!document) return null;

  const uploadedAt = document.createdAt
    ? new Date(document.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <BottomSheet
      isVisible={visible}
      onClose={onClose}
      height={sheetHeight}
      zIndexBase={200}
      contentPadding={16}
      contentInsetBottom={insets.bottom}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <ClayView
            color={colors.card}
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${colors.primary}18`,
            }}
          >
            <Icon name={fileIconName(document.contentType)} size={26} color={colors.primary} />
          </ClayView>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="h3" weight="bold" style={{ color: colors.text }} numberOfLines={3}>
              {document.title}
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }} numberOfLines={2}>
              {document.originalFileName}
            </AppText>
          </View>
        </View>

        <ClayView color={colors.card} style={{ padding: 14, borderRadius: 14, gap: 8 }}>
          <MetaRow label="Folder" value={categoryLabel(document.category)} colors={colors} />
          <MetaRow label="Size" value={formatDocumentSize(document.byteSize)} colors={colors} />
          <MetaRow label="Uploaded by" value={document.uploadedByName} colors={colors} />
          {uploadedAt ? <MetaRow label="Date" value={uploadedAt} colors={colors} /> : null}
          {document.description ? (
            <MetaRow label="Notes" value={document.description} colors={colors} />
          ) : null}
        </ClayView>

        <View style={{ gap: 8 }}>
          <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
            Actions
          </AppText>
          <AppButton title="Open" icon="open-in-new" onPress={onOpen} disabled={busy} />
          <AppButton title="Download" variant="secondary" icon="download" onPress={onDownload} disabled={busy} />
          {canEdit ? (
            <AppButton
              title="Edit details"
              variant="secondary"
              icon="edit"
              onPress={onEdit}
              disabled={busy}
            />
          ) : null}
          {canDelete ? (
            <AppButton title="Delete" variant="danger" icon="delete" onPress={onDelete} disabled={busy} />
          ) : null}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

function MetaRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: { text: string; subtle: string };
}) {
  return (
    <View>
      <AppText variant="caption" style={{ color: colors.subtle }}>
        {label}
      </AppText>
      <AppText style={{ color: colors.text, marginTop: 2 }}>{value}</AppText>
    </View>
  );
}
