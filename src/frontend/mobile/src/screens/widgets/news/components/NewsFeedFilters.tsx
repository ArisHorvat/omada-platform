import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PressClay } from '@/src/components/animations';
import { AppText, ClayView } from '@/src/components/ui';
import { NewsCategory, NewsType } from '@/src/api/generatedClient';
import { NEWS_CATEGORY_ORDER, NEWS_CATEGORY_SHORT, NEWS_TYPE_LABELS } from '../utils/newsLabels';

const TYPE_OPTIONS: (NewsType | null)[] = [null, NewsType.Announcement, NewsType.Alert, NewsType.Event, NewsType.Info];

const CATEGORY_OPTIONS: (NewsCategory | null)[] = [null, ...NEWS_CATEGORY_ORDER];

interface Props {
  colors: {
    text: string;
    subtle: string;
    primary: string;
    card: string;
    border: string;
  };
  selectedType: NewsType | null;
  selectedCategory: NewsCategory | null;
  onTypeChange: (t: NewsType | null) => void;
  onCategoryChange: (c: NewsCategory | null) => void;
}

export function NewsFeedFilters({
  colors,
  selectedType,
  selectedCategory,
  onTypeChange,
  onCategoryChange,
}: Props) {
  const chip = (active: boolean) => ({
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: active ? colors.primary : colors.border,
    backgroundColor: active ? colors.primary + '18' : colors.card,
  });

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" weight="bold" style={[styles.sectionLabel, { color: colors.subtle }]}>
        Type
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {TYPE_OPTIONS.map((t) => {
          const active = selectedType === t;
          const label = t === null ? 'All' : NEWS_TYPE_LABELS[t];
          return (
            <PressClay key={label} onPress={() => onTypeChange(t)}>
              <ClayView depth={4} puffy={0} color={colors.card} style={chip(active)}>
                <AppText weight="bold" style={{ color: active ? colors.primary : colors.text, fontSize: 13 }}>
                  {label}
                </AppText>
              </ClayView>
            </PressClay>
          );
        })}
      </ScrollView>

      <AppText variant="caption" weight="bold" style={[styles.sectionLabel, { color: colors.subtle, marginTop: 12 }]}>
        Topic
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {CATEGORY_OPTIONS.map((c) => {
          const active = selectedCategory === c;
          const label = c === null ? 'All' : NEWS_CATEGORY_SHORT[c];
          return (
            <PressClay key={String(c ?? 'all')} onPress={() => onCategoryChange(c)}>
              <ClayView depth={4} puffy={0} color={colors.card} style={chip(active)}>
                <AppText weight="bold" style={{ color: active ? colors.primary : colors.text, fontSize: 13 }}>
                  {label}
                </AppText>
              </ClayView>
            </PressClay>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  sectionLabel: {
    marginBottom: 8,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
});
