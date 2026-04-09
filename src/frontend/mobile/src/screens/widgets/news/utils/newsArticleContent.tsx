import React from 'react';
import { Linking, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ProgressiveImage } from '@/src/components/ui';
import { resolveMediaUrl } from '@/src/screens/widgets/map/utils/resolveMediaUrl';
import { toAbsoluteUrl } from '@/src/screens/widgets/news/utils/newsArticleUrls';

export type InlineToken =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'italic'; value: string }
  | { kind: 'link'; label: string; href: string };

/**
 * Inline markdown: **bold**, *italic*, `[label](url)` (http(s) or root-relative).
 * Images are handled at block level via splitParagraphByImages.
 */
export function tokenizeInlineMarkdown(input: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let rest = input;

  while (rest.length > 0) {
    const md = rest.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (md) {
      tokens.push({ kind: 'link', label: md[1], href: md[2] });
      rest = rest.slice(md[0].length);
      continue;
    }

    const bare = rest.match(/^(https?:\/\/[^\s\[\]`]+)/);
    if (bare) {
      tokens.push({ kind: 'link', label: bare[1], href: bare[1] });
      rest = rest.slice(bare[1].length);
      continue;
    }

    const bold = rest.match(/^\*\*([^*]+)\*\*/);
    if (bold) {
      tokens.push({ kind: 'bold', value: bold[1] });
      rest = rest.slice(bold[0].length);
      continue;
    }

    const italic = rest.match(/^\*([^*\n]+)\*/);
    if (italic) {
      tokens.push({ kind: 'italic', value: italic[1] });
      rest = rest.slice(italic[0].length);
      continue;
    }

    const nextMd = rest.search(/\[/);
    const nextHttp = rest.search(/https?:\/\//);
    const nextBold = rest.search(/\*\*/);
    const nextItalic = rest.search(/\*(?!\*)/);
    const candidates = [nextMd, nextHttp, nextBold, nextItalic].filter((n) => n >= 0);
    const nextSpecial = candidates.length ? Math.min(...candidates) : -1;

    if (nextSpecial === -1) {
      tokens.push({ kind: 'text', value: rest });
      break;
    }
    if (nextSpecial > 0) {
      tokens.push({ kind: 'text', value: rest.slice(0, nextSpecial) });
      rest = rest.slice(nextSpecial);
      continue;
    }

    tokens.push({ kind: 'text', value: rest[0] });
    rest = rest.slice(1);
  }

  return tokens;
}

type ImageSegment = { type: 'image'; alt: string; src: string };
type TextSegment = { type: 'text'; source: string };
type ParagraphSegment = ImageSegment | TextSegment;

/** Split a line on `![alt](url)` so images are block-level (Image cannot nest in Text). */
function splitParagraphByImages(line: string): ParagraphSegment[] {
  const segments: ParagraphSegment[] = [];
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) {
      segments.push({ type: 'text', source: line.slice(last, m.index) });
    }
    segments.push({ type: 'image', alt: m[1] || 'Image', src: m[2] });
    last = m.index + m[0].length;
  }
  if (last < line.length) {
    segments.push({ type: 'text', source: line.slice(last) });
  }
  if (segments.length === 0) {
    segments.push({ type: 'text', source: line });
  }
  return segments;
}

function renderInlineNodes(
  tokens: InlineToken[],
  textColor: string,
  linkColor: string,
  baseStyle: object,
  keyPrefix: string,
): React.ReactNode[] {
  return tokens.map((tok, i) => {
    const key = `${keyPrefix}-${i}`;
    if (tok.kind === 'text') {
      return (
        <Text key={key} style={baseStyle}>
          {tok.value}
        </Text>
      );
    }
    if (tok.kind === 'bold') {
      return (
        <Text key={key} style={[baseStyle, { fontWeight: '700' }]}>
          {tok.value}
        </Text>
      );
    }
    if (tok.kind === 'italic') {
      return (
        <Text key={key} style={[baseStyle, { fontStyle: 'italic' }]}>
          {tok.value}
        </Text>
      );
    }
    const href = toAbsoluteUrl(tok.href);
    return (
      <Text
        key={key}
        style={[baseStyle, { color: linkColor, textDecorationLine: 'underline' }]}
        onPress={() => Linking.openURL(href).catch(() => {})}
      >
        {tok.label}
      </Text>
    );
  });
}

interface NewsArticleContentProps {
  content: string;
  textColor: string;
  linkColor: string;
  /** Divider / subtle lines */
  borderColor?: string;
  lineHeight?: number;
}

/** Renders stored article markdown: headings, hr, quotes, lists, bold/italic, links, images. */
export function NewsArticleContent({
  content,
  textColor,
  linkColor,
  borderColor,
  lineHeight = 22,
}: NewsArticleContentProps) {
  const { width: windowWidth } = useWindowDimensions();
  const hrColor = borderColor ?? textColor + '33';
  const quoteBorder = linkColor;
  const bodyFont = { color: textColor, lineHeight, fontSize: 16 };
  const lines = content.split('\n');

  const INLINE_IMAGE_HEIGHT = 220;

  const renderParagraphLine = (
    line: string,
    keyPrefix: string,
    extraTextStyle?: object,
    density: 'default' | 'list' = 'default',
  ) => {
    const segments = splitParagraphByImages(line);
    const baseStyle = { ...bodyFont, ...extraTextStyle };
    const blockStyle = density === 'list' ? styles.paragraphBlockList : styles.paragraphBlock;

    return (
      <View key={keyPrefix} style={blockStyle}>
        {segments.map((seg, si) => {
          if (seg.type === 'image') {
            const uri = resolveMediaUrl(seg.src) ?? toAbsoluteUrl(seg.src);
            if (!uri) return null;
            const maxW = Math.min(windowWidth - 56, 720);
            return (
              <View
                key={`${keyPrefix}-img-${si}`}
                style={[
                  styles.imageWrap,
                  density === 'list' ? styles.imageWrapList : null,
                  { width: maxW, height: INLINE_IMAGE_HEIGHT },
                ]}
              >
                <ProgressiveImage
                  source={{ uri }}
                  style={{ width: maxW, height: INLINE_IMAGE_HEIGHT }}
                  resizeMode="contain"
                  accessibilityLabel={seg.alt}
                />
              </View>
            );
          }
          const inline = tokenizeInlineMarkdown(seg.source);
          if (inline.length === 1 && inline[0].kind === 'text' && inline[0].value === '') {
            return null;
          }
          return (
            <Text key={`${keyPrefix}-t-${si}`} style={baseStyle}>
              {renderInlineNodes(inline, textColor, linkColor, baseStyle, `${keyPrefix}-i-${si}`)}
            </Text>
          );
        })}
      </View>
    );
  };

  const isListLine = (t: string) => /^-\s+/.test(t) || /^\d+\.\s+/.test(t);

  const blocks: React.ReactNode[] = [];
  let i = 0;
  /** Used to shrink blank lines between consecutive list items (markdown uses paragraph breaks). */
  let lastEmittedList = false;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();
    const key = `ln-${i}`;

    if (trimmed === '') {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      const nextTrim = lines[j]?.trim() ?? '';
      const tightListGap = lastEmittedList && isListLine(nextTrim);
      blocks.push(<View key={key} style={tightListGap ? styles.blankGapList : styles.blankGap} />);
      i += 1;
      continue;
    }

    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      lastEmittedList = false;
      blocks.push(<View key={key} style={[styles.hr, { backgroundColor: hrColor }]} />);
      i += 1;
      continue;
    }

    let m = trimmed.match(/^##\s+(.+)$/);
    if (m) {
      const font = styles.h2Font;
      blocks.push(
        <Text key={key} style={[font, styles.h2Wrap, { color: textColor }]}>
          {renderInlineNodes(tokenizeInlineMarkdown(m[1]), textColor, linkColor, font, `${key}-h`)}
        </Text>,
      );
      i += 1;
      continue;
    }

    m = trimmed.match(/^#\s+(.+)$/);
    if (m) {
      lastEmittedList = false;
      const font = styles.h1Font;
      blocks.push(
        <Text key={key} style={[font, styles.h1Wrap, { color: textColor }]}>
          {renderInlineNodes(tokenizeInlineMarkdown(m[1]), textColor, linkColor, font, `${key}-h`)}
        </Text>,
      );
      i += 1;
      continue;
    }

    m = trimmed.match(/^###\s+(.+)$/);
    if (m) {
      const font = styles.h3Font;
      blocks.push(
        <Text key={key} style={[font, styles.h3Wrap, { color: textColor }]}>
          {renderInlineNodes(tokenizeInlineMarkdown(m[1]), textColor, linkColor, font, `${key}-h`)}
        </Text>,
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      lastEmittedList = false;
      const quoteBody = trimmed.slice(2);
      blocks.push(
        <View key={key} style={[styles.quoteRow, { borderLeftColor: quoteBorder }]}>
          {renderParagraphLine(quoteBody, `${key}-q`, { fontStyle: 'italic' as const })}
        </View>,
      );
      i += 1;
      continue;
    }

    m = trimmed.match(/^-\s+(.+)$/);
    if (m) {
      blocks.push(
        <View key={key} style={styles.listRow}>
          <Text style={[styles.bulletGlyph, { color: textColor }]}>•</Text>
          <View style={styles.listBody}>{renderParagraphLine(m[1], `${key}-b`, undefined, 'list')}</View>
        </View>,
      );
      i += 1;
      continue;
    }

    m = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (m) {
      lastEmittedList = true;
      blocks.push(
        <View key={key} style={styles.listRow}>
          <Text style={[styles.numGlyph, { color: textColor }]}>{m[1]}.</Text>
          <View style={styles.listBody}>{renderParagraphLine(m[2], `${key}-b`, undefined, 'list')}</View>
        </View>,
      );
      i += 1;
      continue;
    }

    blocks.push(renderParagraphLine(raw, key));
    i += 1;
  }

  return <View style={styles.root}>{blocks}</View>;
}

const styles = StyleSheet.create({
  root: {},
  blankGap: {
    height: 8,
  },
  blankGapList: {
    height: 2,
  },
  hr: {
    height: StyleSheet.hairlineWidth * 2,
    borderRadius: 2,
    marginVertical: 14,
    alignSelf: 'stretch',
  },
  h1Font: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  h1Wrap: {
    marginBottom: 10,
    marginTop: 4,
  },
  h2Font: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  h2Wrap: {
    marginBottom: 8,
    marginTop: 4,
  },
  h3Font: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },
  h3Wrap: {
    marginBottom: 6,
    marginTop: 2,
  },
  quoteRow: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginBottom: 10,
    paddingVertical: 4,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
    paddingRight: 4,
  },
  bulletGlyph: {
    fontSize: 16,
    lineHeight: 20,
    width: 20,
    marginTop: 0,
    fontWeight: '700',
  },
  numGlyph: {
    fontSize: 16,
    lineHeight: 20,
    minWidth: 26,
    marginTop: 0,
    fontWeight: '700',
  },
  listBody: {
    flex: 1,
  },
  paragraphBlock: {
    marginBottom: 10,
  },
  paragraphBlockList: {
    marginBottom: 2,
  },
  imageWrap: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    backgroundColor: '#00000010',
  },
  imageWrapList: {
    marginVertical: 4,
  },
  inlineImage: {
    borderRadius: 12,
    backgroundColor: '#00000010',
  },
});
