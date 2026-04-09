import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { PressClay } from '@/src/components/animations';
import { AppText, BottomSheet, FullScreenImageModal, Icon } from '@/src/components/ui';
import { useRemoteFileActions, useThemeColors } from '@/src/hooks';
import { toAbsoluteUrl } from '@/src/utils/toAbsoluteMediaUrl';
import type { ParsedArticleAttachment } from '@/src/screens/widgets/news/utils/splitArticleBodyAndAttachments';

function extensionOf(name: string, url: string): string {
  const fromName = name.includes('.') ? name.split('.').pop() ?? '' : '';
  if (fromName && fromName.length <= 8) return fromName.toLowerCase();
  try {
    const u = url.split('?')[0] ?? '';
    const seg = u.split('/').pop() ?? '';
    if (seg.includes('.')) return (seg.split('.').pop() ?? '').toLowerCase();
  } catch {
    /* ignore */
  }
  return '';
}

function attachmentKind(ext: string): 'image' | 'pdf' | 'other' {
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'bmp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
}

interface ArticleAttachmentsSectionProps {
  attachments: ParsedArticleAttachment[];
}

export function ArticleAttachmentsSection({ attachments }: ArticleAttachmentsSectionProps) {
  const colors = useThemeColors();
  const {
    busy,
    downloadAndShare,
    openInExternalBrowser: openRemoteExternal,
    openInAppBrowser: openRemoteInApp,
  } = useRemoteFileActions();
  const [menuIndex, setMenuIndex] = useState<number | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const closeMenu = useCallback(() => setMenuIndex(null), []);

  const runDownload = useCallback(
    async (item: ParsedArticleAttachment) => {
      await downloadAndShare(item.url, item.name);
      closeMenu();
    },
    [closeMenu, downloadAndShare],
  );

  const onOpenExternalBrowser = useCallback(
    async (item: ParsedArticleAttachment) => {
      closeMenu();
      await openRemoteExternal(item.url);
    },
    [closeMenu, openRemoteExternal],
  );

  const onOpenInApp = useCallback(
    async (item: ParsedArticleAttachment) => {
      const absUrl = toAbsoluteUrl(item.url);
      const ext = extensionOf(item.name, item.url);
      const kind = attachmentKind(ext);
      closeMenu();
      if (kind === 'image') {
        setPreviewUri(absUrl);
        return;
      }
      await openRemoteInApp(item.url);
    },
    [closeMenu, openRemoteInApp],
  );

  if (!attachments.length) return null;

  const menuItem = menuIndex != null ? attachments[menuIndex] : null;

  return (
    <>
      <View style={styles.section}>
        <AppText weight="bold" style={[styles.sectionTitle, { color: colors.text }]}>
          Attachments
        </AppText>
        {attachments.map((a, i) => {
          const ext = extensionOf(a.name, a.url);
          const kind = attachmentKind(ext);
          return (
            <View
              key={`${a.url}-${i}`}
              style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card + 'CC' }]}
            >
              <View style={styles.rowMain}>
                <View style={[styles.iconWrap, { backgroundColor: colors.subtle + '22' }]}>
                  <Icon
                    name={kind === 'image' ? 'image' : kind === 'pdf' ? 'picture-as-pdf' : 'attach-file'}
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <AppText weight="bold" numberOfLines={2} style={[styles.fileName, { color: colors.text }]}>
                  {a.name}
                </AppText>
              </View>
              <PressClay onPress={() => setMenuIndex(i)}>
                <View style={styles.moreBtn}>
                  <Icon name="more-vert" size={22} color={colors.subtle} />
                </View>
              </PressClay>
            </View>
          );
        })}
      </View>

      <BottomSheet isVisible={menuItem != null} onClose={closeMenu} height={320} zIndexBase={200}>
        <View style={styles.sheetPad}>
          <AppText weight="bold" style={{ color: colors.text, marginBottom: 12 }} numberOfLines={2}>
            {menuItem?.name}
          </AppText>
          {busy ? (
            <View style={styles.busyRow}>
              <ActivityIndicator color={colors.primary} />
              <AppText style={{ marginLeft: 10, color: colors.subtle }}>Preparing file…</AppText>
            </View>
          ) : (
            <>
              <Pressable
                style={({ pressed }) => [styles.sheetAction, pressed && { opacity: 0.7 }]}
                onPress={() => menuItem && void onOpenInApp(menuItem)}
              >
                <Icon name="open-in-browser" size={22} color={colors.primary} />
                <AppText weight="bold" style={{ marginLeft: 12, color: colors.text }}>
                  Open in app
                </AppText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.sheetAction, pressed && { opacity: 0.7 }]}
                onPress={() => menuItem && void onOpenExternalBrowser(menuItem)}
              >
                <Icon name="language" size={22} color={colors.primary} />
                <AppText weight="bold" style={{ marginLeft: 12, color: colors.text }}>
                  Open in browser
                </AppText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.sheetAction, pressed && { opacity: 0.7 }]}
                onPress={() => menuItem && void runDownload(menuItem)}
              >
                <Icon name="download" size={22} color={colors.primary} />
                <AppText weight="bold" style={{ marginLeft: 12, color: colors.text }}>
                  Download / share
                </AppText>
              </Pressable>
            </>
          )}
        </View>
      </BottomSheet>

      <FullScreenImageModal visible={!!previewUri} imageUri={previewUri} onClose={() => setPreviewUri(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 15,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fileName: {
    flex: 1,
    fontSize: 15,
  },
  moreBtn: {
    padding: 8,
    marginLeft: 4,
  },
  sheetPad: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
});
