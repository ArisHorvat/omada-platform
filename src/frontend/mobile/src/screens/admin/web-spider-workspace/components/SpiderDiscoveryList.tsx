import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { PressClay } from '@/src/components/animations';
import { AppText, ClayView, Icon } from '@/src/components/ui';
import { NewsPageKind, SpiderPageKind } from '@/src/api/generatedClient';

type DiscoveryItem = {
  url?: string;
  kind?: number;
};

type Props<T extends DiscoveryItem> = {
  colors: { card: string; text: string; subtle: string; primary: string; border: string };
  title: string;
  pages: T[];
  onSelect: (item: T) => void;
  kindLabel: (kind?: number) => string;
  highlightKinds: number[];
  secondaryKinds: number[];
  expanded?: boolean;
  onToggleExpanded?: () => void;
};

function kindColor(
  kind: number | undefined,
  primary: string,
  subtle: string,
  highlightKinds: number[],
  secondaryKinds: number[],
) {
  if (kind != null && highlightKinds.includes(kind)) return primary;
  if (kind != null && secondaryKinds.includes(kind)) return subtle;
  return subtle;
}

export function SpiderDiscoveryList<T extends DiscoveryItem>({
  colors,
  title,
  pages,
  onSelect,
  kindLabel,
  highlightKinds,
  secondaryKinds,
  expanded = true,
  onToggleExpanded,
}: Props<T>) {
  if (!pages.length) return null;

  const collapsible = !!onToggleExpanded;

  return (
    <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
      <PressClay onPress={collapsible ? onToggleExpanded : undefined} disabled={!collapsible}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 10 : 0 }}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
              {title.toUpperCase()}
            </AppText>
            <AppText variant="body" weight="bold" style={{ color: colors.text, marginTop: 4 }}>
              {pages.length} page{pages.length === 1 ? '' : 's'}
            </AppText>
            {!expanded ? (
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                Tap to show links — pick a year page, then Preview scrape.
              </AppText>
            ) : null}
          </View>
          {collapsible ? (
            <Icon name={expanded ? 'expand-less' : 'expand-more'} size={24} color={colors.subtle} />
          ) : null}
        </View>
      </PressClay>

      {expanded ? (
        <>
          {pages.slice(0, 40).map((page, idx) => (
            <TouchableOpacity key={`${page.url}-${idx}`} onPress={() => onSelect(page)} activeOpacity={0.85}>
              <ClayView
                depth={1}
                color={colors.background}
                style={{
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <AppText
                  variant="caption"
                  weight="bold"
                  style={{
                    color: kindColor(page.kind, colors.primary, colors.subtle, highlightKinds, secondaryKinds),
                    marginBottom: 4,
                  }}
                >
                  {kindLabel(page.kind)}
                </AppText>
                <AppText variant="caption" style={{ color: colors.text }} numberOfLines={2}>
                  {page.url}
                </AppText>
                <AppText variant="caption" style={{ color: colors.primary, marginTop: 6 }}>
                  Tap to use this URL
                </AppText>
              </ClayView>
            </TouchableOpacity>
          ))}
          {pages.length > 40 ? (
            <AppText variant="caption" style={{ color: colors.subtle }}>
              Showing first 40 of {pages.length} discovered pages.
            </AppText>
          ) : null}
        </>
      ) : null}
    </ClayView>
  );
}

export function scheduleKindLabel(kind?: SpiderPageKind): string {
  switch (kind) {
    case SpiderPageKind.Schedule:
      return 'Schedule table';
    case SpiderPageKind.Menu:
      return 'Menu / hub';
    default:
      return 'Unknown';
  }
}

export function newsKindLabel(kind?: NewsPageKind): string {
  switch (kind) {
    case NewsPageKind.Article:
      return 'Article';
    case NewsPageKind.Archive:
      return 'Archive / listing';
    default:
      return 'Unknown';
  }
}
