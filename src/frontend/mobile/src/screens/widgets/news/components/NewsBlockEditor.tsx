import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  InteractionManager,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { uploadPublicFile } from '@/src/api/uploadFile';
import { prepareNewsImageForUpload } from '@/src/utils/prepareNewsImageForUpload';
import { PressClay } from '@/src/components/animations';
import { AppButton, AppText, BottomSheet, ClayView, Icon } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

import type { NewsBlock, NewsBlockType } from '../types/newsBlocks';
import { createBlock, getNumberedDisplayIndex } from '../types/newsBlocks';
import { useOptionalComposeToolbar } from './ComposeToolbarContext';

function findPrevFocusableId(blocks: NewsBlock[], index: number): string | null {
  for (let i = index - 1; i >= 0; i--) {
    if (blocks[i].type !== 'divider') return blocks[i].id;
  }
  return null;
}

function nextBlockTypeAfterEnter(block: NewsBlock): NewsBlockType {
  switch (block.type) {
    case 'bullet':
    case 'numbered':
    case 'heading':
    case 'blockquote':
    case 'paragraph':
    case 'link':
    case 'document':
      return block.type;
    default:
      return 'paragraph';
  }
}

/** Collapse duplicate empty paragraphs; ensure at least one block. */
function normalizeBlocks(blocks: NewsBlock[]): NewsBlock[] {
  const out: NewsBlock[] = [];
  let lastWasEmptyPara = false;
  for (const b of blocks) {
    const empty = !b.content || b.content.trim() === '';
    const isPara = b.type === 'paragraph';
    if (empty && isPara) {
      if (lastWasEmptyPara) continue;
      lastWasEmptyPara = true;
    } else {
      lastWasEmptyPara = false;
    }
    out.push(b);
  }
  return out.length ? out : [createBlock('paragraph')];
}

/**
 * Medium-style: `- `, `1. `, `## `, `# ` on a single line convert block type.
 * `##` is checked before `#`.
 */
/** Ensure http(s) URL for markdown links. */
function normalizeLinkUrl(raw: string): string {
  const u = raw.trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u.replace(/^\/+/, '')}`;
}

/** Avoid `]` / `[` in label so `[label](url)` tokenizes correctly. */
function sanitizeMarkdownLinkLabel(label: string): string {
  return label.replace(/[\[\]]/g, '').trim() || 'Link';
}

function tryApplyLinePrefix(block: NewsBlock, text: string): Partial<NewsBlock> | null {
  if (text.includes('\n')) return null;
  if (block.type !== 'paragraph') return null;

  if (/^##\s+/.test(text)) {
    return { type: 'heading', content: text.replace(/^##\s+/, ''), headingLevel: 2 };
  }
  if (/^#\s+/.test(text)) {
    return { type: 'heading', content: text.replace(/^#\s+/, ''), headingLevel: 1 };
  }
  if (/^-\s+/.test(text)) {
    return { type: 'bullet', content: text.replace(/^-\s+/, '') };
  }
  if (/^\d+\.\s+/.test(text)) {
    return { type: 'numbered', content: text.replace(/^\d+\.\s+/, '') };
  }
  return null;
}

export interface NewsBlockEditorProps {
  blocks: NewsBlock[];
  onBlocksChange: React.Dispatch<React.SetStateAction<NewsBlock[]>>;
  focusRequestId?: string | null;
  onFocusRequestHandled?: () => void;
  embedded?: boolean;
  hideBlockHeaders?: boolean;
  continueSameTypeOnEnter?: boolean;
  /** Medium-style: one continuous doc, prefix shortcuts, toolbar, no add-block UX. */
  composeMode?: 'default' | 'continuous';
  /** Parent ScrollView ref — used to scroll the active line above the keyboard. */
  composerScrollRef?: React.RefObject<ScrollView | null>;
}

export function NewsBlockEditor({
  blocks,
  onBlocksChange,
  focusRequestId,
  onFocusRequestHandled,
  embedded = false,
  hideBlockHeaders: hideBlockHeadersProp,
  continueSameTypeOnEnter = true,
  composeMode = 'default',
  composerScrollRef,
}: NewsBlockEditorProps) {
  const colors = useThemeColors();
  const composeToolbar = useOptionalComposeToolbar();
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const selectionRef = useRef<Record<string, { start: number; end: number }>>({});
  /** Captured when link modal opens — editor blur resets selection; applyLink must use this. */
  const linkTargetBlockIdRef = useRef<string | null>(null);
  const linkSelectionSnapshotRef = useRef<{ start: number; end: number } | null>(null);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkKeyboardHeight, setLinkKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!linkOpen) {
      setLinkKeyboardHeight(0);
      return;
    }
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvt, (e) => setLinkKeyboardHeight(e.endCoordinates.height));
    const subHide = Keyboard.addListener(hideEvt, () => setLinkKeyboardHeight(0));
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [linkOpen]);

  const hideBlockHeaders = hideBlockHeadersProp ?? embedded;
  const isContinuous = composeMode === 'continuous';

  const dispatch = useCallback(
    (updater: React.SetStateAction<NewsBlock[]>) => {
      onBlocksChange((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return isContinuous ? normalizeBlocks(next) : next;
      });
    },
    [onBlocksChange, isContinuous],
  );

  const setContent = useCallback(
    (id: string, content: string) => {
      dispatch((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)));
    },
    [dispatch],
  );

  const updateBlock = useCallback(
    (id: string, patch: Partial<NewsBlock>) => {
      dispatch((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    },
    [dispatch],
  );

  const insertBlockAfter = useCallback(
    (afterId: string, type: NewsBlockType) => {
      const nb = createBlock(type);
      dispatch((prev) => {
        const i = prev.findIndex((b) => b.id === afterId);
        if (i < 0) return [...prev, nb];
        return [...prev.slice(0, i + 1), nb, ...prev.slice(i + 1)];
      });
      setPendingFocusId(nb.id);
    },
    [dispatch],
  );

  const removeBlock = useCallback(
    (id: string) => {
      dispatch((prev) => {
        const next = prev.filter((b) => b.id !== id);
        return next.length ? next : [createBlock('paragraph')];
      });
    },
    [dispatch],
  );

  const focusId = focusRequestId ?? pendingFocusId;

  useEffect(() => {
    if (!focusId) return;
    if (!blocks.some((b) => b.id === focusId)) return;
    const block = blocks.find((b) => b.id === focusId);
    if (block?.type === 'divider') {
      setPendingFocusId(null);
      if (focusRequestId) onFocusRequestHandled?.();
      return;
    }
    const t = setTimeout(() => {
      inputRefs.current[focusId]?.focus();
      setPendingFocusId(null);
      if (focusRequestId) onFocusRequestHandled?.();
    }, 48);
    return () => clearTimeout(t);
  }, [focusId, blocks, focusRequestId, onFocusRequestHandled]);

  const handleTextChange = useCallback(
    (blockId: string, newText: string) => {
      const normalized = newText.replace(/\r\n/g, '\n');
      const block = blocks.find((b) => b.id === blockId);
      if (!block || block.type === 'divider') return;

      if (isContinuous) {
        const prefix = tryApplyLinePrefix(block, normalized);
        if (prefix) {
          updateBlock(blockId, prefix as NewsBlock);
          setPendingFocusId(blockId);
          return;
        }
      }

      const old = (block.content ?? '').replace(/\r\n/g, '\n');

      /** Do not rely on selection timing — RN may fire onChangeText before onSelectionChange. */
      const appendedNewlineAtEnd =
        normalized.length === old.length + 1 && normalized.endsWith('\n') && normalized.slice(0, -1) === old;

      if (appendedNewlineAtEnd) {
        const body = normalized.slice(0, -1);

        if ((block.type === 'bullet' || block.type === 'numbered') && body.trim() === '') {
          updateBlock(blockId, { type: 'paragraph', content: '' });
          return;
        }

        if (isContinuous && block.type === 'paragraph' && body.trim() === '') {
          setContent(blockId, '');
          return;
        }

        setContent(blockId, body);

        let nextType: NewsBlockType;
        if (isContinuous) {
          if (block.type === 'bullet' || block.type === 'numbered') {
            nextType = block.type;
          } else {
            nextType = 'paragraph';
          }
        } else if (continueSameTypeOnEnter) {
          nextType = nextBlockTypeAfterEnter(block);
        } else {
          nextType = 'paragraph';
          if (block.type === 'bullet') nextType = 'bullet';
          else if (block.type === 'numbered') nextType = 'numbered';
        }

        insertBlockAfter(blockId, nextType);
        return;
      }

      setContent(blockId, normalized);
    },
    [
      blocks,
      continueSameTypeOnEnter,
      insertBlockAfter,
      isContinuous,
      setContent,
      updateBlock,
    ],
  );

  const handleKeyPress = useCallback(
    (blockId: string, key: string, block: NewsBlock) => {
      if (key !== 'Backspace') return;
      if ((block.content ?? '').length > 0) return;
      const sel = selectionRef.current[blockId];
      if (sel && sel.start !== 0) return;

      const idx = blocks.findIndex((b) => b.id === blockId);
      if (idx <= 0) return;

      const prev = blocks[idx - 1];
      if (prev.type === 'divider') {
        dispatch((prevList) => prevList.filter((b) => b.id !== prev.id));
        setPendingFocusId(blockId);
        return;
      }

      const prevId = findPrevFocusableId(blocks, idx);
      if (!prevId) return;

      dispatch((prevList) => {
        const next = prevList.filter((b) => b.id !== blockId);
        return next.length ? next : [createBlock('paragraph')];
      });
      setPendingFocusId(prevId);
    },
    [blocks, dispatch],
  );

  const attachDocument = async (blockId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.uri) return;
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'Please select a file under 5MB.');
        return;
      }
      const name = asset.name || 'document';
      const mime = asset.mimeType || 'application/octet-stream';
      setUploadingId(blockId);
      const url = await uploadPublicFile(asset.uri, mime, name, 'news');
      setContent(blockId, `[${name}](${url})`);
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setUploadingId(null);
    }
  };

  const setInputRef = (id: string) => (r: TextInput | null) => {
    inputRefs.current[id] = r;
  };

  const onSelChange =
    (id: string) =>
    (e: { nativeEvent: { selection: { start: number; end: number } } }) => {
      const { start, end } = e.nativeEvent.selection;
      selectionRef.current[id] = { start, end };
    };

  const getFocusedBlock = useCallback(() => {
    const fid = composeToolbar?.focusedBlockId;
    if (!fid) return undefined;
    return blocks.find((b) => b.id === fid);
  }, [blocks, composeToolbar?.focusedBlockId]);

  const applyWrap = useCallback(
    (wrap: '**' | '*') => {
      const block = getFocusedBlock();
      if (!block || block.type === 'divider') return;
      const id = block.id;
      const text = block.content ?? '';
      const sel = selectionRef.current[id] ?? { start: text.length, end: text.length };
      const { start, end } = sel;
      if (start === end) return;
      const before = text.slice(0, start);
      const mid = text.slice(start, end);
      const after = text.slice(end);
      setContent(id, `${before}${wrap}${mid}${wrap}${after}`);
    },
    [getFocusedBlock, setContent],
  );

  const setParagraphBlock = useCallback(
    (id: string) => {
      dispatch((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;
          const { headingLevel: _h, ...rest } = b;
          return { ...rest, type: 'paragraph' as const };
        }),
      );
    },
    [dispatch],
  );

  const applyToolbarText = useCallback(() => {
    const block = getFocusedBlock();
    if (!block || block.type === 'divider') return;
    setParagraphBlock(block.id);
  }, [getFocusedBlock, setParagraphBlock]);

  const applyToolbarH1 = useCallback(() => {
    const block = getFocusedBlock();
    if (!block || block.type === 'divider') return;
    updateBlock(block.id, { type: 'heading', headingLevel: 1 });
  }, [getFocusedBlock, updateBlock]);

  const applyToolbarH2 = useCallback(() => {
    const block = getFocusedBlock();
    if (!block || block.type === 'divider') return;
    updateBlock(block.id, { type: 'heading', headingLevel: 2 });
  }, [getFocusedBlock, updateBlock]);

  const applyToolbarBullet = useCallback(() => {
    const block = getFocusedBlock();
    if (!block || block.type === 'divider') return;
    if (block.type === 'bullet') {
      setParagraphBlock(block.id);
    } else {
      updateBlock(block.id, { type: 'bullet' });
    }
  }, [getFocusedBlock, updateBlock, setParagraphBlock]);

  const applyToolbarNumbered = useCallback(() => {
    const block = getFocusedBlock();
    if (!block || block.type === 'divider') return;
    if (block.type === 'numbered') {
      setParagraphBlock(block.id);
    } else {
      updateBlock(block.id, { type: 'numbered' });
    }
  }, [getFocusedBlock, updateBlock, setParagraphBlock]);

  const applyToolbarQuote = useCallback(() => {
    const block = getFocusedBlock();
    if (!block || block.type === 'divider') return;
    if (block.type === 'blockquote') {
      setParagraphBlock(block.id);
    } else {
      updateBlock(block.id, { type: 'blockquote' });
    }
  }, [getFocusedBlock, updateBlock, setParagraphBlock]);

  const insertDividerBelowFocused = useCallback(() => {
    const block = getFocusedBlock();
    if (!block || block.type === 'divider') return;
    const div = createBlock('divider');
    const para = createBlock('paragraph');
    const emptyPara = block.type === 'paragraph' && !(block.content ?? '').trim();
    dispatch((prev) => {
      const i = prev.findIndex((b) => b.id === block.id);
      if (i < 0) return [...prev, div, para];
      if (emptyPara) {
        return [...prev.slice(0, i), div, para, ...prev.slice(i + 1)];
      }
      return [...prev.slice(0, i + 1), div, para, ...prev.slice(i + 1)];
    });
    setPendingFocusId(para.id);
  }, [dispatch, getFocusedBlock]);

  const insertImageAtSelection = useCallback(async () => {
    const block = getFocusedBlock();
    if (!block || block.type === 'divider') return;
    const blockId = block.id;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos', 'Allow photo library access to insert an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    setUploadingId(blockId);
    try {
      const prepared = await prepareNewsImageForUpload(
        asset.uri,
        asset.mimeType,
        asset.fileName || 'image.jpg',
      );
      const url = await uploadPublicFile(prepared.uri, prepared.mimeType, prepared.fileName, 'news');
      const defaultAlt = prepared.fileName.replace(/\.[^.]+$/, '') || 'Image';
      dispatch((prev) => {
        const b = prev.find((x) => x.id === blockId);
        if (!b) return prev;
        const textNow = b.content ?? '';
        const sel = selectionRef.current[blockId] ?? { start: textNow.length, end: textNow.length };
        const { start, end } = sel;
        const before = textNow.slice(0, start);
        const mid = textNow.slice(start, end);
        const after = textNow.slice(end);
        const alt = mid.trim() ? mid.trim().replace(/[\[\]]/g, '') : defaultAlt;
        const nextContent = `${before}![${alt}](${url})${after}`;
        return prev.map((x) => (x.id === blockId ? { ...x, content: nextContent } : x));
      });
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setUploadingId(null);
    }
  }, [dispatch, getFocusedBlock]);

  const closeLinkModal = useCallback(() => {
    Keyboard.dismiss();
    setLinkOpen(false);
    linkTargetBlockIdRef.current = null;
    linkSelectionSnapshotRef.current = null;
    composeToolbar?.setEditorChromeMode('body');
  }, [composeToolbar]);

  const openLinkModal = useCallback(() => {
    const block = getFocusedBlock();
    if (!block || block.type === 'divider') return;
    const text = block.content ?? '';
    const sel = selectionRef.current[block.id] ?? { start: 0, end: 0 };
    linkTargetBlockIdRef.current = block.id;
    linkSelectionSnapshotRef.current = { start: sel.start, end: sel.end };
    const mid = text.slice(sel.start, sel.end);
    setLinkLabel(mid.trim() || 'Link');
    setLinkUrl('https://');
    inputRefs.current[block.id]?.blur();
    Keyboard.dismiss();
    composeToolbar?.setEditorChromeMode('modal');
    InteractionManager.runAfterInteractions(() => {
      setTimeout(
        () => setLinkOpen(true),
        Platform.OS === 'ios' ? 120 : 60,
      );
    });
  }, [composeToolbar, getFocusedBlock]);

  const applyLink = useCallback(() => {
    const id = linkTargetBlockIdRef.current;
    if (!id) return;
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    const text = block.content ?? '';
    const sel = linkSelectionSnapshotRef.current ?? { start: text.length, end: text.length };
    const { start, end } = sel;
    const label = sanitizeMarkdownLinkLabel(linkLabel.trim() || 'Link');
    const url = normalizeLinkUrl(linkUrl);
    if (!url || !/^https?:\/\//i.test(url)) {
      Alert.alert('Invalid URL', 'Enter a website address (e.g. https://example.com).');
      return;
    }
    try {
      const parsed = new URL(url);
      if (!parsed.hostname || parsed.hostname.length < 1) {
        Alert.alert('Invalid URL', 'Include a domain (e.g. example.com).');
        return;
      }
    } catch {
      Alert.alert('Invalid URL', 'Check the address and try again.');
      return;
    }
    const before = text.slice(0, start);
    const mid = text.slice(start, end);
    const after = text.slice(end);
    const linkText = mid.trim() ? sanitizeMarkdownLinkLabel(mid) : label;
    const inserted = `${before}[${linkText}](${url})${after}`;
    setContent(id, inserted);
    Keyboard.dismiss();
    setLinkOpen(false);
    linkTargetBlockIdRef.current = null;
    linkSelectionSnapshotRef.current = null;
    composeToolbar?.setEditorChromeMode('body');
  }, [blocks, composeToolbar, linkLabel, linkUrl, setContent]);

  const onBlockFocus = useCallback(
    (id: string) => {
      composeToolbar?.setFocusedBlockId(id);
      composeToolbar?.setEditorChromeMode('body');
    },
    [composeToolbar],
  );

  useEffect(() => {
    if (!isContinuous || !composeToolbar) return;
    composeToolbar.setToolbarHandlers({
      onText: applyToolbarText,
      onH1: applyToolbarH1,
      onH2: applyToolbarH2,
      onBullet: applyToolbarBullet,
      onNumbered: applyToolbarNumbered,
      onQuote: applyToolbarQuote,
      onDivider: insertDividerBelowFocused,
      onBold: () => applyWrap('**'),
      onItalic: () => applyWrap('*'),
      onLink: () => openLinkModal(),
      onImage: () => void insertImageAtSelection(),
    });
    return () => composeToolbar.setToolbarHandlers(null);
  }, [
    isContinuous,
    composeToolbar,
    applyWrap,
    applyToolbarText,
    applyToolbarH1,
    applyToolbarH2,
    applyToolbarBullet,
    applyToolbarNumbered,
    applyToolbarQuote,
    insertDividerBelowFocused,
    openLinkModal,
    insertImageAtSelection,
  ]);

  const renderBlockFields = (b: NewsBlock, idx: number, continuous: boolean) => {
    if (b.type === 'divider') {
      return <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />;
    }

    const isBullet = b.type === 'bullet';
    const isNum = b.type === 'numbered';
    const isList = isBullet || isNum;
    const isQuote = b.type === 'blockquote';
    const isHeading = b.type === 'heading';
    const headingLevel = b.headingLevel ?? 2;
    const isDoc = b.type === 'document';
    const isLink = b.type === 'link';

    return (
      <View 
        style={[isList && styles.bulletRow, isQuote && [styles.quoteShell, { borderLeftColor: colors.primary }]]}
      >
        {isDoc && (
          <View style={{ marginBottom: 8 }}>
            <AppButton
              title={uploadingId === b.id ? 'Uploading…' : 'Attach document'}
              variant="outline"
              size="sm"
              onPress={() => attachDocument(b.id)}
              disabled={uploadingId === b.id}
              style={{ alignSelf: 'flex-start' }}
            />
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6, marginBottom: 8 }}>
              PDF or other file (max 5MB). Stored as a markdown link `[name](url)`.
            </AppText>
          </View>
        )}

        {isBullet && (
          <AppText weight="bold" style={[styles.listGlyph, { color: colors.text }]}>
            •
          </AppText>
        )}
        {isNum && (
          <AppText weight="bold" style={[styles.listGlyph, { color: colors.text }]}>
            {getNumberedDisplayIndex(blocks, idx)}.
          </AppText>
        )}

        <TextInput
          ref={setInputRef(b.id)}
          value={b.content}
          onChangeText={(t) => handleTextChange(b.id, t)}
          onKeyPress={(e) => handleKeyPress(b.id, e.nativeEvent.key, b)}
          onSelectionChange={onSelChange(b.id)}
          onFocus={() => onBlockFocus(b.id)}
          placeholder={
            isLink ? '[Label](https://example.com)' :
            isDoc ? '[filename](url)' :
            isHeading ? 'Heading' :
            isQuote ? 'Quote' :
            isList ? 'List item' :
            continuous && idx === 0 ? 'Start writing your article…' : 'Paragraph'
          }
          placeholderTextColor={colors.subtle}
          style={[
            styles.blockInput,
            { color: colors.text },
            isList && styles.listBlockInput,
            isList && { flex: 1 },
            isQuote && styles.quoteInput,
            isHeading && (headingLevel === 1 ? styles.h1Input : styles.h2Input),
            embedded && styles.embeddedInputPad,
          ]}
          multiline
          scrollEnabled={false}
          textAlignVertical="top"
        />
      </View>
    );
  };

  const continuousInner = (b: NewsBlock, idx: number) => {
    const prev = idx > 0 ? blocks[idx - 1] : undefined;
    const tightListGap =
      !!prev &&
      (prev.type === 'bullet' || prev.type === 'numbered') &&
      (b.type === 'bullet' || b.type === 'numbered');
    return (
      <View
        style={[styles.continuousRow, idx > 0 && (tightListGap ? styles.continuousRowGapTight : styles.continuousRowGap)]}
        collapsable={false}
      >
        {renderBlockFields(b, idx, true)}
      </View>
    );
  };

  const defaultInner = (b: NewsBlock, idx: number) => {
    const inner = (
      <>
        {!hideBlockHeaders ? (
          <View style={styles.blockHeader}>
            <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
              {b.type.toUpperCase()} · {idx + 1}
            </AppText>
            <PressClay onPress={() => removeBlock(b.id)}>
              <ClayView depth={6} puffy={8} color={colors.card} style={styles.blockDelete}>
                <Icon name="close" size={18} color={colors.subtle} />
              </ClayView>
            </PressClay>
          </View>
        ) : null}
        {embedded ? (
          <PressClay onPress={() => removeBlock(b.id)} style={styles.embedDelete}>
            <Icon name="close" size={18} color={colors.subtle} />
          </PressClay>
        ) : null}
        {renderBlockFields(b, idx, false)}
      </>
    );

    if (embedded) {
      return (
        <View key={b.id} style={styles.embedBlock}>
          {inner}
        </View>
      );
    }

    return (
      <ClayView key={b.id} depth={4} puffy={10} color={colors.background} style={styles.blockCard}>
        {inner}
      </ClayView>
    );
  };

  return (
    <>
      {isContinuous ? (
        <View style={styles.continuousWrap}>
          {blocks.map((b, idx) => (
            <React.Fragment key={b.id}>{continuousInner(b, idx)}</React.Fragment>
          ))}
        </View>
      ) : (
        <View>{blocks.map((b, idx) => defaultInner(b, idx))}</View>
      )}

      <Modal
        visible={linkOpen}
        transparent
        animationType="fade"
        statusBarTranslucent={Platform.OS === 'android'}
        onRequestClose={closeLinkModal}
      >
        <View
          style={[styles.linkModalRoot, { paddingBottom: linkKeyboardHeight }]}
          pointerEvents="box-none"
        >
          <BottomSheet
              isVisible={linkOpen}
              onClose={closeLinkModal}
              height={Math.min(400, Dimensions.get('window').height * 0.52)}
              zIndexBase={0}
            >
              <ScrollView
                style={styles.linkSheetScrollView}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.linkSheetScroll}
              >
                <View style={styles.linkSheetInner}>
                  <AppText variant="h3" weight="bold" style={styles.linkSheetTitle}>
                    Add link
                  </AppText>
                  <AppText variant="caption" style={[styles.linkSheetHint, { color: colors.subtle }]}>
                    Text in the article; the address opens in the browser.
                  </AppText>

                  <AppText variant="caption" weight="bold" style={[styles.linkFieldLabel, { color: colors.subtle }]}>
                    Text in article
                  </AppText>
                  <ClayView depth={4} puffy={0} color={colors.background} style={styles.linkFieldShell}>
                    <TextInput
                      value={linkLabel}
                      onChangeText={setLinkLabel}
                      placeholder="e.g. Read more"
                      placeholderTextColor={colors.subtle}
                      style={[styles.linkFieldInput, { color: colors.text }]}
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />
                  </ClayView>

                  <AppText variant="caption" weight="bold" style={[styles.linkFieldLabel, { color: colors.subtle }]}>
                    Web address
                  </AppText>
                  <ClayView depth={4} puffy={0} color={colors.background} style={styles.linkFieldShell}>
                    <TextInput
                      value={linkUrl}
                      onChangeText={setLinkUrl}
                      placeholder="https://example.com"
                      autoCapitalize="none"
                      keyboardType="url"
                      autoCorrect={false}
                      placeholderTextColor={colors.subtle}
                      style={[styles.linkFieldInput, { color: colors.text }]}
                      returnKeyType="done"
                      onSubmitEditing={() => applyLink()}
                    />
                  </ClayView>

                  <View style={styles.linkSheetActions}>
                    <AppButton
                      title="Cancel"
                      variant="outline"
                      size="sm"
                      onPress={closeLinkModal}
                      style={styles.linkSheetBtn}
                    />
                    <AppButton title="Insert" size="sm" onPress={applyLink} style={styles.linkSheetBtn} />
                  </View>
                </View>
              </ScrollView>
            </BottomSheet>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  blockCard: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  blockDelete: {
    borderRadius: 14,
  },
  blockInput: {
    fontSize: 16,
    padding: 0,
    minHeight: 44,
  },
  listBlockInput: {
    minHeight: 28,
    paddingTop: 0,
    paddingBottom: 2,
  },
  h1Input: {
    fontSize: 26,
    fontWeight: '800',
    padding: 0,
    minHeight: 48,
  },
  h2Input: {
    fontSize: 20,
    fontWeight: '800',
    padding: 0,
    minHeight: 44,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listGlyph: {
    minWidth: 24,
    marginTop: 0,
    fontSize: 16,
    lineHeight: 22,
  },
  quoteShell: {
    borderLeftWidth: 4,
    paddingLeft: 12,
  },
  quoteInput: {
    fontStyle: 'italic',
  },
  dividerLine: {
    height: StyleSheet.hairlineWidth * 2,
    borderRadius: 2,
    marginVertical: 12,
  },
  embedBlock: {
    position: 'relative',
    marginBottom: 4,
  },
  embedDelete: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 2,
    padding: 4,
  },
  embeddedInputPad: {
    paddingRight: 28,
  },
  continuousWrap: {
    paddingVertical: 4,
  },
  continuousRow: {},
  continuousRowGap: {
    marginTop: 10,
  },
  continuousRowGapTight: {
    marginTop: 3,
  },
  linkModalRoot: {
    flex: 1,
  },
  linkSheetScrollView: {
    flex: 1,
  },
  linkSheetScroll: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  linkSheetInner: {
    paddingBottom: 4,
  },
  linkSheetTitle: {
    marginBottom: 6,
  },
  linkSheetHint: {
    marginBottom: 16,
    lineHeight: 18,
  },
  linkFieldLabel: {
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
  },
  linkFieldShell: {
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
  },
  linkFieldInput: {
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
  },
  linkSheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  linkSheetBtn: {
    flex: 1,
  },
});
