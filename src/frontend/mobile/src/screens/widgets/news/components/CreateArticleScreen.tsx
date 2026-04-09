import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { uploadPublicFile } from '@/src/api/uploadFile';
import { prepareNewsImageForUpload } from '@/src/utils/prepareNewsImageForUpload';
import { NewsCategory, NewsType } from '@/src/api/generatedClient';
import { PressClay } from '@/src/components/animations';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import {
  AppButton,
  AppText,
  BottomSheet,
  ClayView,
  Icon,
  ImageScrimGradient,
  ProgressiveImage,
  WidgetErrorState,
} from '@/src/components/ui';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { usePermission } from '@/src/context/PermissionContext';
import { useThemeColors } from '@/src/hooks';
import { useNewsLogic } from '../hooks/useNewsLogic';
import type { NewsBlock } from '../types/newsBlocks';
import { blocksToMarkdown, createBlock } from '../types/newsBlocks';
import {
  NEWS_CATEGORY_DETAIL,
  NEWS_CATEGORY_ORDER,
  NEWS_CATEGORY_SHORT,
  NEWS_TYPE_LABELS,
  NEWS_TYPE_ORDER,
} from '../utils/newsLabels';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ComposeToolbarProvider, useOptionalComposeToolbar } from './ComposeToolbarContext';
import { NewsBlockEditor } from './NewsBlockEditor';

const MAX_HEADLINE_LENGTH = 90;

const WRITING_RULES: readonly string[] = [
  'Use the bar above the keyboard for paragraph, headings, lists, quote, divider, bold, italic, links, and inline images.',
  'Bold and italic wrap your selection in markdown—highlight text first.',
  'Start a line with "- " for a bullet, "1. " for a numbered list, or "#" / "##" at the start of a line for a heading.',
  'On an empty list line, press Enter to return to a normal paragraph.',
  'For links: select text (optional), tap Link, enter a web address, then Done. https:// is added if you omit it.',
  'Attachments at the bottom are files only (e.g. PDF)—add web links inside the article with the Link tool.',
];

type ArticleAttachment = { id: string; name: string; url: string };

function buildArticleMarkdown(blocks: NewsBlock[], attachments: ArticleAttachment[]): string {
  const base = blocksToMarkdown(blocks);
  if (!attachments.length) return base;
  const lines = attachments.map((a) => `[${a.name}](${a.url})`);
  return [base, '', '---', '', ...lines].join('\n');
}

/** Show filename only, shortened with ellipsis when long. */
function displayAttachmentName(name: string, maxLen = 34): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLen) return trimmed;
  const dot = trimmed.lastIndexOf('.');
  const ext = dot > 0 ? trimmed.slice(dot) : '';
  const base = dot > 0 ? trimmed.slice(0, dot) : trimmed;
  const budget = maxLen - ext.length - 1;
  if (budget < 6) return `${trimmed.slice(0, maxLen - 1)}…`;
  return `${base.slice(0, budget)}…${ext}`;
}

const typeMeta = (type: NewsType, colors: { error: string; tertiary: string; secondary?: string; primary: string }) => {
  switch (type) {
    case NewsType.Alert:
      return { label: 'alert', color: colors.error };
    case NewsType.Event:
      return { label: 'event', color: colors.tertiary };
    case NewsType.Info:
      return { label: 'info', color: colors.secondary ?? colors.primary };
    case NewsType.Announcement:
    default:
      return { label: 'announcement', color: colors.primary };
  }
};

function CreateArticleScreenContent() {
  const colors = useThemeColors();
  const composeToolbar = useOptionalComposeToolbar();
  const router = useRouter();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const { can } = usePermission();
  const canPublish = can('news.publish');

  const { publishNews, isPublishingNews } = useNewsLogic({ orgId, enabled: false });

  const [headline, setHeadline] = useState('');
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverAsset, setCoverAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [blocks, setBlocks] = useState<NewsBlock[]>(() => [createBlock('paragraph')]);
  const [attachments, setAttachments] = useState<ArticleAttachment[]>([]);
  const [newsType, setNewsType] = useState<NewsType>(NewsType.Announcement);
  const [newsCategory, setNewsCategory] = useState<NewsCategory>(NewsCategory.General);

  const [publishSheetOpen, setPublishSheetOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [writingRulesOpen, setWritingRulesOpen] = useState(false);
  const composeScrollRef = useRef<ScrollView>(null);

  const meta = useMemo(() => typeMeta(newsType, colors), [newsType, colors]);

  const toggleWritingRules = () => {
    setWritingRulesOpen((o) => !o);
  };

  const pickCover = async () => {
    setSubmitError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos', 'Allow photo library access to set a cover image.');
      setSubmitError('Photo library permission is required for the cover image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: Platform.OS === 'ios',
      ...(Platform.OS === 'ios' ? { aspect: [16, 9] as [number, number] } : {}),
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    try {
      const prepared = await prepareNewsImageForUpload(
        asset.uri,
        asset.mimeType,
        asset.fileName || 'news-cover.jpg',
      );
      setCoverAsset({ ...asset, uri: prepared.uri, mimeType: prepared.mimeType, fileName: prepared.fileName });
      setCoverUri(prepared.uri);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not process cover image.');
    }
  };

  const addDocumentAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.uri) return;
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        setSubmitError('Please choose a file under 5MB.');
        return;
      }
      const name = asset.name || 'document';
      const mime = asset.mimeType || 'application/octet-stream';
      setUploadingAttachment(true);
      setSubmitError(null);
      const url = await uploadPublicFile(asset.uri, mime, name, 'news');
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setAttachments((prev) => [...prev, { id, name, url }]);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
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
    const safeTitle = headline.trim();
    const body = buildArticleMarkdown(blocks, attachments).trim();
    if (!safeTitle || !body) {
      setSubmitError('Headline and article body are required.');
      return;
    }
    try {
      let coverImageUrl: string | undefined;
      if (coverAsset?.uri) {
        const mime = coverAsset.mimeType || 'image/jpeg';
        const fileName = coverAsset.fileName || 'news-cover.jpg';
        coverImageUrl = await uploadPublicFile(coverAsset.uri, mime, fileName, 'news');
      }
      await publishNews({
        title: safeTitle,
        content: body,
        coverImageUrl,
        type: newsType,
        category: newsCategory,
      });
      setPublishSheetOpen(false);
      Alert.alert('Published', 'Your article is now in the news feed.', [
        { text: 'OK', onPress: () => router.replace('/news') },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Publish failed.';
      setSubmitError(msg);
      Alert.alert('Could not publish', msg);
    }
  };

  if (!canPublish) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <ClayBackButton />
          <AppText variant="h2" weight="bold" style={styles.headerTitle}>
            Compose
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
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <ClayBackButton />
            <AppText variant="h2" weight="bold" style={styles.headerTitle}>
              Compose
            </AppText>
            <AppButton title="Next" size="sm" onPress={() => setPublishSheetOpen(true)} />
          </View>

          <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
          >
          <ScrollView
            ref={composeScrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollInner}
            contentInset={{ bottom: 80 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'android'}
          >
            <View style={styles.container}>
              <ClayView depth={8} puffy={12} style={styles.cover}>
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={pickCover}
                  accessibilityRole="button"
                  accessibilityLabel="Choose cover image"
                >
                  {coverUri ? (
                    <ProgressiveImage source={{ uri: coverUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : (
                    <View
                      style={[StyleSheet.absoluteFill, styles.coverPlaceholder, { backgroundColor: colors.subtle + '28' }]}
                    >
                      <Icon name="image" size={48} color={colors.subtle} />
                      <AppText variant="caption" style={{ color: colors.subtle, marginTop: 10, textAlign: 'center' }}>
                        Tap to choose cover
                      </AppText>
                    </View>
                  )}
                </Pressable>

                <ImageScrimGradient
                  colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.82)']}
                  locations={[0, 0.5, 1]}
                />

                <View style={styles.coverTopLabels} pointerEvents="box-none">
                  <View style={styles.badgeChipsRow}>
                    <View style={[styles.badgeChip, { borderColor: meta.color + '66' }]}>
                      <AppText weight="bold" style={[styles.badgeChipText, { color: '#FFFFFF' }]}>
                        {meta.label.toUpperCase()}
                      </AppText>
                    </View>
                    <View style={styles.badgeChip}>
                      <AppText weight="bold" style={styles.badgeChipText}>
                        {NEWS_CATEGORY_SHORT[newsCategory].toUpperCase()}
                      </AppText>
                    </View>
                  </View>
                </View>

                <View style={styles.coverBottom} pointerEvents="box-none">
                  <TextInput
                    value={headline}
                    onChangeText={(t) => setHeadline(t.replace(/\r?\n/g, ' ').slice(0, MAX_HEADLINE_LENGTH))}
                    onFocus={() => composeToolbar?.setEditorChromeMode('headline')}
                    onBlur={() => composeToolbar?.setEditorChromeMode('body')}
                    placeholder="Headline (one line)"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    style={styles.coverTitleInput}
                    maxLength={MAX_HEADLINE_LENGTH}
                    multiline={false}
                    numberOfLines={1}
                    scrollEnabled={false}
                  />
                  <View style={styles.headlineMetaRow}>
                    <AppText variant="caption" style={styles.coverMeta}>
                      {new Date().toLocaleDateString()}
                    </AppText>
                    <AppText variant="caption" style={styles.headlineCount}>
                      {headline.length}/{MAX_HEADLINE_LENGTH}
                    </AppText>
                  </View>
                </View>
              </ClayView>

              <View style={{ height: 14 }} />

              <ClayView depth={6} puffy={10} style={styles.body}>
                <ClayView depth={4} puffy={0} color={colors.background} style={styles.rulesAccordion}>
                  <PressClay onPress={toggleWritingRules}>
                    <View style={styles.rulesAccordionHeader}>
                      <Icon name="info" size={20} color={colors.primary} />
                      <AppText weight="bold" style={{ flex: 1, color: colors.text }}>
                        Writing rules
                      </AppText>
                      <Icon name={writingRulesOpen ? 'expand-less' : 'expand-more'} size={26} color={colors.subtle} />
                    </View>
                  </PressClay>
                  {writingRulesOpen ? (
                    <Animated.View
                      entering={FadeInDown.duration(320).springify().damping(16).stiffness(220)}
                      style={styles.rulesAccordionBody}
                    >
                      {WRITING_RULES.map((rule, i) => (
                        <View
                          key={i}
                          style={[
                            styles.rulesRow,
                            i > 0 && [styles.rulesRowDivider, { borderTopColor: colors.border }],
                          ]}
                        >
                          <View style={[styles.rulesNumber, { backgroundColor: colors.primary + '24' }]}>
                            <AppText weight="bold" style={{ color: colors.primary, fontSize: 13 }}>
                              {i + 1}
                            </AppText>
                          </View>
                          <AppText variant="caption" style={[styles.rulesRowText, { color: colors.subtle }]}>
                            {rule}
                          </AppText>
                        </View>
                      ))}
                    </Animated.View>
                  ) : null}
                </ClayView>

                <View style={{ height: 12 }} />

                <NewsBlockEditor
                  blocks={blocks}
                  onBlocksChange={setBlocks}
                  composeMode="continuous"
                  composerScrollRef={composeScrollRef}
                />

                <View style={{ height: 12 }} />

                <AppButton
                  title="+ Add Attachment"
                  variant="outline"
                  onPress={() => void addDocumentAttachment()}
                  disabled={uploadingAttachment}
                />

                {attachments.length ? (
                  <View style={{ marginTop: 14, gap: 10 }}>
                    {attachments.map((a) => (
                      <ClayView key={a.id} depth={5} puffy={12} color={colors.background} style={styles.attachmentCard}>
                        <View style={styles.attachmentRow}>
                          <Icon name="attach-file" size={22} color={colors.primary} />
                          <AppText
                            weight="bold"
                            style={{ flex: 1, marginLeft: 10 }}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {displayAttachmentName(a.name)}
                          </AppText>
                          <PressClay onPress={() => removeAttachment(a.id)}>
                            <ClayView depth={6} puffy={8} color={colors.card} style={styles.attachRemove}>
                              <Icon name="close" size={18} color={colors.subtle} />
                            </ClayView>
                          </PressClay>
                        </View>
                      </ClayView>
                    ))}
                  </View>
                ) : null}

                {submitError ? (
                  <View style={{ marginTop: 14 }}>
                    <WidgetErrorState message={submitError} />
                  </View>
                ) : null}
              </ClayView>
            </View>
          </ScrollView>
          </KeyboardAvoidingView>
        </View>

      <BottomSheet isVisible={publishSheetOpen} onClose={() => setPublishSheetOpen(false)} height={460} zIndexBase={110}>
        <AppText variant="h3" weight="bold" style={{ marginBottom: 6 }}>
          Review & publish
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 14 }}>
          Choose how this article appears in the feed, then publish.
        </AppText>

        <AppText weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
          Type
        </AppText>
        <PressClay onPress={() => setTypePickerOpen(true)}>
          <ClayView depth={6} puffy={0} color={colors.card} style={styles.metaRow}>
            <View style={styles.metaRowIconWrap}>
              <Icon name="category" size={22} color={colors.primary} />
            </View>
            <AppText weight="bold" style={styles.metaRowLabel} numberOfLines={1}>
              {NEWS_TYPE_LABELS[newsType]}
            </AppText>
            <Icon name="expand-more" size={24} color={colors.subtle} />
          </ClayView>
        </PressClay>

        <View style={{ height: 14 }} />

        <AppText weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
          Category
        </AppText>
        <PressClay onPress={() => setCategoryPickerOpen(true)}>
          <ClayView depth={6} puffy={0} color={colors.card} style={styles.metaRow}>
            <View style={styles.metaRowIconWrap}>
              <Icon name="local-offer" size={22} color={colors.primary} />
            </View>
            <AppText weight="bold" style={styles.metaRowLabel} numberOfLines={2}>
              {NEWS_CATEGORY_SHORT[newsCategory]}
            </AppText>
            <Icon name="expand-more" size={24} color={colors.subtle} />
          </ClayView>
        </PressClay>

        <View style={{ height: 22 }} />

        <AppButton
          title={isPublishingNews ? 'Publishing…' : 'Publish'}
          onPress={() => void handlePublish()}
          loading={isPublishingNews}
          disabled={
            isPublishingNews ||
            !headline.trim() ||
            buildArticleMarkdown(blocks, attachments).trim().length === 0 ||
            !orgId
          }
        />
      </BottomSheet>

      <BottomSheet isVisible={typePickerOpen} onClose={() => setTypePickerOpen(false)} height={440} zIndexBase={200}>
        <View style={styles.pickerSheetHeader}>
          <AppText variant="h3" weight="bold">
            Article type
          </AppText>
          <PressClay onPress={() => setTypePickerOpen(false)}>
            <ClayView depth={8} puffy={10} color={colors.card} style={styles.pickerCloseBtn}>
              <Icon name="close" size={22} color={colors.subtle} />
            </ClayView>
          </PressClay>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.pickerList}
        >
          {NEWS_TYPE_ORDER.map((t) => {
            const active = newsType === t;
            return (
              <PressClay
                key={String(t)}
                onPress={() => {
                  setNewsType(t);
                  setTypePickerOpen(false);
                }}
              >
                <ClayView
                  depth={6}
                  puffy={0}
                  color={colors.card}
                  style={[
                    styles.pickerOption,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary + '18' : colors.card,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <AppText weight="bold" numberOfLines={2} style={{ color: active ? colors.primary : colors.text }}>
                      {NEWS_TYPE_LABELS[t]}
                    </AppText>
                    <AppText variant="caption" numberOfLines={2} style={{ color: colors.subtle, marginTop: 4 }}>
                      {`Label this article as ${NEWS_TYPE_LABELS[t].toLowerCase()}.`}
                    </AppText>
                  </View>
                  {active ? <Icon name="check" size={24} color={colors.primary} /> : null}
                </ClayView>
              </PressClay>
            );
          })}
        </ScrollView>
      </BottomSheet>

      <BottomSheet isVisible={categoryPickerOpen} onClose={() => setCategoryPickerOpen(false)} height={560} zIndexBase={200}>
        <View style={styles.pickerSheetHeader}>
          <AppText variant="h3" weight="bold">
            Topic
          </AppText>
          <PressClay onPress={() => setCategoryPickerOpen(false)}>
            <ClayView depth={8} puffy={10} color={colors.card} style={styles.pickerCloseBtn}>
              <Icon name="close" size={22} color={colors.subtle} />
            </ClayView>
          </PressClay>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.pickerList}
        >
          {NEWS_CATEGORY_ORDER.map((c) => {
            const active = newsCategory === c;
            return (
              <PressClay
                key={String(c)}
                onPress={() => {
                  setNewsCategory(c);
                  setCategoryPickerOpen(false);
                }}
              >
                <ClayView
                  depth={6}
                  puffy={0}
                  color={colors.card}
                  style={[
                    styles.pickerOption,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary + '18' : colors.card,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <AppText weight="bold" numberOfLines={2} style={{ color: active ? colors.primary : colors.text }}>
                      {NEWS_CATEGORY_SHORT[c]}
                    </AppText>
                    <AppText variant="caption" numberOfLines={3} style={{ color: colors.subtle, marginTop: 4 }}>
                      {NEWS_CATEGORY_DETAIL[c]}
                    </AppText>
                  </View>
                  {active ? <Icon name="check" size={24} color={colors.primary} /> : null}
                </ClayView>
              </PressClay>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

export default function CreateArticleScreen() {
  return (
    <ComposeToolbarProvider>
      <CreateArticleScreenContent />
    </ComposeToolbarProvider>
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
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 6,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: 400,
  },
  container: {
    paddingHorizontal: 18,
  },
  cover: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 300,
    padding: 0,
  },
  coverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  coverTopLabels: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 3,
  },
  badgeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  badgeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  badgeChipText: {
    color: '#FFFFFF',
    opacity: 0.94,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  coverBottom: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 3,
  },
  coverTitleInput: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    padding: 0,
    minHeight: 36,
    maxHeight: 40,
  },
  coverMeta: {
    color: '#FFFFFF',
    opacity: 0.88,
  },
  headlineMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  headlineCount: {
    color: '#FFFFFF',
    opacity: 0.65,
    fontSize: 11,
  },
  body: {
    borderRadius: 20,
    padding: 16,
  },
  rulesAccordion: {
    borderRadius: 16,
    marginBottom: 2,
    overflow: 'hidden',
  },
  rulesAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rulesAccordionBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  rulesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  rulesRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rulesNumber: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  rulesRowText: {
    flex: 1,
    lineHeight: 20,
  },
  attachmentCard: {
    borderRadius: 18,
    minHeight: 68,
    paddingVertical: 4,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 4,
  },
  attachRemove: {
    borderRadius: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  metaRowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRowLabel: {
    flex: 1,
    fontSize: 16,
  },
  pickerSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pickerCloseBtn: {
    borderRadius: 14,
  },
  pickerList: {
    gap: 10,
    paddingBottom: 12,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
});
