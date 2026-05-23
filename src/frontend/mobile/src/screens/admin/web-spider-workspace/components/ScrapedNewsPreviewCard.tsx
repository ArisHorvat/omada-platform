import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AppText, ClayView } from '@/src/components/ui';
import type { WebSpiderWorkspaceModel } from '../hooks/useWebSpiderWorkspace';

type Props = {
  model: WebSpiderWorkspaceModel;
};

const PREVIEW_CHARS = 480;

export function ScrapedNewsPreviewCard({ model }: Props) {
  const { colors, newsPreview } = model;
  const [expanded, setExpanded] = useState(false);

  if (!newsPreview?.article) return null;

  const { title, content, category } = newsPreview.article;
  const body = content ?? '';
  const truncated = body.length > PREVIEW_CHARS && !expanded;
  const displayBody = truncated ? `${body.slice(0, PREVIEW_CHARS).trim()}…` : body;

  return (
    <ClayView depth={2} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
        Category (Gemini triage)
      </AppText>
      <AppText variant="label" weight="bold" style={{ color: colors.primary, marginBottom: 10 }}>
        {category ?? 'General'}
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle }}>
        Title
      </AppText>
      <AppText variant="h3" weight="bold" style={{ color: colors.text, marginBottom: 10 }}>
        {title || '(empty title)'}
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle }}>
        Body
      </AppText>
      <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
        {displayBody || '(empty body)'}
      </AppText>
      {body.length > PREVIEW_CHARS ? (
        <TouchableOpacity onPress={() => setExpanded((v) => !v)} style={{ marginTop: 8 }}>
          <AppText variant="caption" style={{ color: colors.primary }}>
            {expanded ? 'Show less' : 'Show full text'}
          </AppText>
        </TouchableOpacity>
      ) : null}
      <AppText variant="caption" style={{ color: colors.subtle, marginTop: 12 }}>
        Source: {newsPreview.sourceUrl}
      </AppText>
    </ClayView>
  );
}
