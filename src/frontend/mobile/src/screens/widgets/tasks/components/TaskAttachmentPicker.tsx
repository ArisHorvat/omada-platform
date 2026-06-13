import React, { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { AppButton, AppText } from '@/src/components/ui';
import { COURSEWORK_MAX_BYTES, uploadPublicFile } from '@/src/api/uploadFile';
import type { TaskAttachment } from '@/src/api/tasksWorkApi';
import { useThemeColors } from '@/src/hooks';

import { TaskAttachmentsList } from './TaskAttachmentsList';

async function resolvePickedFileSize(asset: DocumentPicker.DocumentPickerAsset): Promise<number | undefined> {
  if (asset.size && asset.size > 0) return asset.size;
  if (!asset.uri) return undefined;
  try {
    const res = await fetch(asset.uri);
    const blob = await res.blob();
    return blob.size;
  } catch {
    return undefined;
  }
}

function isFileTooLargeMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('too large') || lower.includes('15 mb');
}

type Props = {
  label: string;
  hint?: string;
  attachments: TaskAttachment[];
  onChange: (attachments: TaskAttachment[]) => void;
  disabled?: boolean;
  attachmentKind?: TaskAttachment['kind'];
};

export function TaskAttachmentPicker({
  label,
  hint,
  attachments,
  onChange,
  disabled,
  attachmentKind = 'material',
}: Props) {
  const colors = useThemeColors();
  const [uploading, setUploading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets[0]?.uri) return;

      const asset = result.assets[0];
      const byteSize = await resolvePickedFileSize(asset);
      if (byteSize != null && byteSize > COURSEWORK_MAX_BYTES) {
        Alert.alert('File too large', 'Please choose a file under 15 MB.');
        return;
      }

      const name = asset.name || 'document';
      const mime = asset.mimeType || 'application/octet-stream';

      setUploading(true);
      const url = await uploadPublicFile(asset.uri, mime, name, 'coursework');
      onChange([
        ...attachments,
        { url, fileName: name, contentType: mime, kind: attachmentKind },
      ]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Try again.';
      if (isFileTooLargeMessage(message)) {
        Alert.alert('File too large', 'Please choose a file under 15 MB.');
      } else {
        Alert.alert('Upload failed', message);
      }
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (index: number) => {
    onChange(attachments.filter((_, i) => i !== index));
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <AppText variant="label" weight="bold" style={{ marginBottom: 4 }}>
        {label}
      </AppText>
      {hint ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
          {hint}
        </AppText>
      ) : null}

      <TaskAttachmentsList
        title=""
        attachments={attachments}
        onRemove={removeAt}
        disabled={disabled || uploading}
      />

      <AppButton
        title={uploading ? 'Uploading…' : 'Attach document'}
        variant="outline"
        icon="attach-file"
        onPress={() => void pickDocument()}
        disabled={disabled || uploading}
        style={{ marginTop: attachments.length ? 4 : 0 }}
      />
      {uploading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} /> : null}
    </View>
  );
}
