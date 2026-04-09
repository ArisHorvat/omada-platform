import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { usePermission } from '@/src/context/PermissionContext';
import { useThemeColors } from '@/src/hooks';
import { uploadPublicFile } from '@/src/api/uploadFile';
import { AppButton, AppText, ClayView, Icon, ProgressiveImage, Skeleton, WidgetErrorState } from '@/src/components/ui';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { PressClay } from '@/src/components/animations';
import { useNewsLogic } from '../hooks/useNewsLogic';
import { NewsCategory, NewsType } from '@/src/api/generatedClient';
import {
  NEWS_CATEGORY_DETAIL,
  NEWS_CATEGORY_ORDER,
  NEWS_CATEGORY_SHORT,
  NEWS_TYPE_LABELS,
  NEWS_TYPE_ORDER,
} from '../utils/newsLabels';
import { OptionPickerSheet, type PickerOption } from '@/src/components/filters';
import type { NewsBlock } from '../types/newsBlocks';
import { blocksToMarkdown, createBlock } from '../types/newsBlocks';
import { ComposeToolbarProvider } from './ComposeToolbarContext';
import { NewsBlockEditor } from './NewsBlockEditor';

export default function CreateNewsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const { can } = usePermission();

  const canPublish = can('news.publish');

  const { publishNews, isPublishingNews } = useNewsLogic({
    orgId,
    enabled: false,
  });

  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<NewsBlock[]>(() => [createBlock('paragraph')]);
  const [newsType, setNewsType] = useState<NewsType>(NewsType.Announcement);
  const [newsCategory, setNewsCategory] = useState<NewsCategory>(NewsCategory.General);
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const pickImage = async () => {
    setSubmitError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setSubmitError('Media library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    setSelectedAsset(asset);
    setSelectedUri(asset.uri);
  };

  const handlePublish = async () => {
    setSubmitError(null);
    if (!canPublish) {
      setSubmitError('Not authorized.');
      return;
    }
    if (!orgId) {
      setSubmitError('Organization is missing.');
      return;
    }
    const safeTitle = title.trim();
    const safeContent = blocksToMarkdown(blocks);
    if (!safeTitle || !safeContent) {
      setSubmitError('Title and content are required.');
      return;
    }
    try {
      let coverImageUrl: string | undefined = undefined;
      if (selectedAsset?.uri) {
        setUploadingImage(true);
        const mime = selectedAsset.mimeType || 'image/jpeg';
        const fileName = selectedAsset.fileName || 'news-cover.jpg';
        coverImageUrl = await uploadPublicFile(selectedAsset.uri, mime, fileName, 'news');
        setUploadingImage(false);
      }
      await publishNews({
        title: safeTitle,
        content: safeContent,
        coverImageUrl,
        type: newsType,
        category: newsCategory,
      });
      router.replace('/news');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Publish failed.';
      setSubmitError(msg);
    } finally {
      setUploadingImage(false);
    }
  };

  const typeOptions: PickerOption<NewsType>[] = useMemo(
    () => NEWS_TYPE_ORDER.map((t) => ({ value: t, label: NEWS_TYPE_LABELS[t] })),
    [],
  );
  const categoryOptions: PickerOption<NewsCategory>[] = useMemo(
    () => NEWS_CATEGORY_ORDER.map((c) => ({ value: c, label: NEWS_CATEGORY_SHORT[c] })),
    [],
  );
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  if (!canPublish) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <ClayBackButton />
          <AppText variant="h2" weight="bold" style={styles.headerTitle}>
            Create News
          </AppText>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 18 }}>
          <WidgetErrorState message="Not authorized to publish news." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ComposeToolbarProvider>
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <ClayBackButton />
            <AppText variant="h2" weight="bold" style={styles.headerTitle}>
              Publish
            </AppText>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            automaticallyAdjustKeyboardInsets
          >
          <ClayView depth={10} puffy={14} style={styles.card}>
            <AppText weight="bold" style={[styles.label, { color: colors.subtle }]}>
              Type & Topic
            </AppText>
            <View style={styles.selectorRow}>
              <PressClay onPress={() => setTypePickerOpen(true)}>
                <ClayView depth={6} puffy={10} color={colors.card} style={styles.selectorChip}>
                  <Icon name="category" size={18} color={colors.primary} />
                  <AppText weight="bold" style={{ marginLeft: 8 }}>
                    {NEWS_TYPE_LABELS[newsType]}
                  </AppText>
                  <View style={{ marginLeft: 'auto' }}>
                    <Icon name="expand-more" size={22} color={colors.subtle} />
                  </View>
                </ClayView>
              </PressClay>
              <PressClay onPress={() => setCategoryPickerOpen(true)}>
                <ClayView depth={6} puffy={10} color={colors.card} style={styles.selectorChip}>
                  <Icon name="local-offer" size={18} color={colors.primary} />
                  <AppText weight="bold" style={{ marginLeft: 8 }}>
                    {NEWS_CATEGORY_SHORT[newsCategory]}
                  </AppText>
                  <View style={{ marginLeft: 'auto' }}>
                    <Icon name="expand-more" size={22} color={colors.subtle} />
                  </View>
                </ClayView>
              </PressClay>
            </View>

            <AppText weight="bold" style={[styles.label, { marginTop: 16, color: colors.subtle }]}>
              Image
            </AppText>
            <View style={styles.imageRow}>
              {selectedUri ? (
                <ProgressiveImage source={{ uri: selectedUri }} style={styles.preview} resizeMode="cover" />
              ) : (
                <View style={styles.previewFallback}>
                  <Icon name="campaign" size={22} color={colors.subtle} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <AppButton
                  title={selectedUri ? 'Change' : 'Select'}
                  variant="outline"
                  size="sm"
                  onPress={pickImage}
                  disabled={uploadingImage || isPublishingNews}
                />
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8 }}>
                  Optional cover image.
                </AppText>
              </View>
            </View>

            {uploadingImage ? (
              <View style={{ marginTop: 12 }}>
                <Skeleton height={16} width="60%" borderRadius={10} />
              </View>
            ) : null}

            <AppText weight="bold" style={[styles.label, { marginTop: 18, color: colors.subtle }]}>
              Title
            </AppText>
            <ClayView depth={3} puffy={6} color={colors.background} style={styles.inputWrap}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Headline"
                placeholderTextColor={colors.subtle}
                style={[styles.input, { color: colors.text }]}
              />
            </ClayView>

            <AppText weight="bold" style={[styles.label, { marginTop: 16, color: colors.subtle }]}>
              Article
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6 }}>
              Write in one flow. Use the toolbar for bold, italic, headings, lists, and links. Start a line with `- `,
              `1. `, `# `, or `## ` for lists and headings.
            </AppText>

            <View style={{ height: 12 }} />

            <NewsBlockEditor blocks={blocks} onBlocksChange={setBlocks} composeMode="continuous" />

            {submitError ? (
              <View style={{ marginTop: 16 }}>
                <WidgetErrorState message={submitError} />
              </View>
            ) : null}

            <View style={{ height: 18 }} />

            <AppButton
              title={isPublishingNews ? 'Publishing...' : 'Publish'}
              onPress={handlePublish}
              disabled={
                uploadingImage ||
                isPublishingNews ||
                !title.trim() ||
                blocksToMarkdown(blocks).trim().length === 0 ||
                !orgId
              }
              loading={isPublishingNews}
              style={{ alignSelf: 'stretch' }}
            />
          </ClayView>
        </ScrollView>
        </View>
      </ComposeToolbarProvider>

      <OptionPickerSheet
        isVisible={typePickerOpen}
        onClose={() => setTypePickerOpen(false)}
        title="Type"
        options={typeOptions}
        selected={newsType}
        onSelect={(v) => v && setNewsType(v)}
        includeAllOption={false}
        height={520}
      />

      <OptionPickerSheet
        isVisible={categoryPickerOpen}
        onClose={() => setCategoryPickerOpen(false)}
        title="Topic"
        options={categoryOptions}
        selected={newsCategory}
        onSelect={(v) => v && setNewsCategory(v)}
        includeAllOption={false}
        height={640}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    paddingTop: 6,
  },
  headerTitle: {
    marginLeft: 14,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 24,
    padding: 16,
  },
  label: {
    opacity: 0.95,
    fontSize: 14,
    fontWeight: '700',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  selectorChip: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 150,
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  preview: {
    width: 120,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#00000020',
  },
  previewFallback: {
    width: 120,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#00000020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    borderRadius: 18,
    padding: 10,
    marginTop: 8,
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
});
