import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { AppButton, AppFormField, AppText, ClayView } from '@/src/components/ui';
import { OptionPickerSheet, type PickerOption } from '@/src/components/filters/OptionPickerSheet';
import { useThemeColors } from '@/src/hooks';
import type { DocumentCategoryDto } from '@/src/api/documentsApi';
import { formatDocumentSize } from '@/src/api/documentsApi';
import { categoryLabel } from '../utils/documentLabels';

export type DocumentFormMode = 'upload' | 'edit';

export interface DocumentUploadDraft {
  uri: string;
  mimeType: string;
  fileName: string;
  byteSize?: number | null;
}

export interface DocumentEditDraft {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  originalFileName: string;
  byteSize: number;
}

interface DocumentFormSheetProps {
  visible: boolean;
  mode: DocumentFormMode;
  categories: DocumentCategoryDto[];
  uploadDraft?: DocumentUploadDraft | null;
  editDraft?: DocumentEditDraft | null;
  defaultCategory?: string | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: { title: string; category: string; description?: string | null }) => void;
}

export function DocumentFormSheet({
  visible,
  mode,
  categories,
  uploadDraft,
  editDraft,
  defaultCategory,
  saving = false,
  onClose,
  onSubmit,
}: DocumentFormSheetProps) {
  const colors = useThemeColors();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const categoryOptions: PickerOption<string>[] = useMemo(
    () =>
      categories.map((c) => ({
        value: c.key,
        label: c.label,
      })),
    [categories],
  );

  useEffect(() => {
    if (!visible) return;

    if (mode === 'upload' && uploadDraft) {
      const baseName = uploadDraft.fileName.replace(/\.[^.]+$/, '') || uploadDraft.fileName;
      setTitle(baseName);
      setCategory(defaultCategory ?? 'general');
      setDescription('');
      return;
    }

    if (mode === 'edit' && editDraft) {
      setTitle(editDraft.title);
      setCategory(editDraft.category);
      setDescription(editDraft.description ?? '');
    }
  }, [visible, mode, uploadDraft, editDraft, defaultCategory]);

  const fileLabel =
    mode === 'upload'
      ? uploadDraft?.fileName
      : editDraft?.originalFileName;

  const fileSize =
    mode === 'upload'
      ? uploadDraft?.byteSize
      : editDraft?.byteSize;

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSubmit({
      title: trimmedTitle,
      category,
      description: description.trim() ? description.trim() : null,
    });
  };

  return (
    <>
      <BottomSheet isVisible={visible} onClose={onClose} height={Platform.OS === 'web' ? 520 : 560} zIndexBase={240}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <AppText variant="h3" weight="bold" style={{ color: colors.text, marginBottom: 4 }}>
              {mode === 'upload' ? 'Upload document' : 'Edit document'}
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 16 }}>
              {mode === 'upload'
                ? 'Choose a folder and display name before adding the file to the library.'
                : 'Update the display name, folder, or notes.'}
            </AppText>

            {fileLabel ? (
              <ClayView color={colors.card} style={{ padding: 14, borderRadius: 14, marginBottom: 14 }}>
                <AppText weight="bold" style={{ color: colors.text }} numberOfLines={2}>
                  {fileLabel}
                </AppText>
                {fileSize != null && fileSize > 0 ? (
                  <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                    {formatDocumentSize(fileSize)}
                  </AppText>
                ) : null}
              </ClayView>
            ) : null}

            <AppFormField
              label="Display name"
              value={title}
              onChangeText={setTitle}
              placeholder="How this file appears in the library"
              autoCapitalize="sentences"
            />

            <View style={{ marginBottom: 12 }}>
              <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
                Folder
              </AppText>
              <AppButton
                title={categoryLabel(category)}
                variant="secondary"
                onPress={() => setCategoryPickerOpen(true)}
                rightIcon="expand-more"
              />
            </View>

            <AppFormField
              label="Notes (optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Short description for your team"
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <AppButton title="Cancel" variant="secondary" onPress={onClose} disabled={saving} />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  title={mode === 'upload' ? (saving ? 'Uploading…' : 'Upload') : saving ? 'Saving…' : 'Save'}
                  onPress={handleSubmit}
                  loading={saving}
                  disabled={saving || !title.trim()}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </BottomSheet>

      <OptionPickerSheet
        isVisible={categoryPickerOpen}
        onClose={() => setCategoryPickerOpen(false)}
        title="Choose folder"
        options={categoryOptions}
        selected={category}
        onSelect={(value) => {
          if (value) setCategory(value);
          setCategoryPickerOpen(false);
        }}
        includeAllOption={false}
        height={420}
        zIndexBase={280}
      />
    </>
  );
}
