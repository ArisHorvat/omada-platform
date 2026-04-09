import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { AppText, ClayView, Icon, ProgressiveImage } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import type { HostDto } from '@/src/api/generatedClient';
import { getApiErrorMessage } from '@/src/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  searchPlaceholder: string;
  /** Shown under each result name (e.g. “Directory”, “Professor profile”). */
  resultSubtitle?: string;
  searchHosts: (query: string) => Promise<HostDto[]>;
  onSelect: (host: HostDto) => void;
  /** Stack above other sheets (e.g. filter + picker). Default matches BottomSheet. */
  zIndexBase?: number;
  contentInsetBottom?: number;
  /** Omit to use ~88% of screen (same idea as tall filter sheets). */
  height?: number;
}

const DEFAULT_SHEET_HEIGHT = Math.round(Dimensions.get('window').height * 0.88);

export function HostPickerSheet({
  visible,
  onClose,
  title,
  searchPlaceholder,
  resultSubtitle = 'Directory',
  searchHosts,
  onSelect,
  zIndexBase = 100,
  contentInsetBottom = 0,
  height = DEFAULT_SHEET_HEIGHT,
}: Props) {
  const colors = useThemeColors();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HostDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setSearchError(null);
    }
  }, [visible]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const r = await searchHosts(q);
        setResults(r || []);
      } catch (e) {
        setResults([]);
        setSearchError(getApiErrorMessage(e));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, searchHosts]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: { marginBottom: 12 },
        inputWrap: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
          backgroundColor: colors.card,
        },
        input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 4 },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border + '99',
        },
        avatar: {
          width: 52,
          height: 52,
          borderRadius: 26,
          marginRight: 14,
          backgroundColor: colors.background,
          overflow: 'hidden',
        },
      }),
    [colors]
  );

  const renderItem = useCallback(
    ({ item }: { item: HostDto }) => (
      <TouchableOpacity
        style={styles.row}
        onPress={() => {
          onSelect(item);
          onClose();
          setQuery('');
        }}
      >
        {item.avatarUrl ? (
          <ProgressiveImage source={{ uri: item.avatarUrl }} style={styles.avatar} resizeMode="cover" />
        ) : (
          <ClayView depth={2} color={colors.background} style={styles.avatar}>
            <Icon name="person" size={24} color={colors.subtle} />
          </ClayView>
        )}
        <View style={{ flex: 1 }}>
          <AppText weight="bold" style={{ color: colors.text }}>
            {item.fullName}
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle }}>
            {resultSubtitle}
          </AppText>
        </View>
        <Icon name="chevron-right" size={22} color={colors.subtle} />
      </TouchableOpacity>
    ),
    [colors, onClose, onSelect, styles]
  );

  return (
    <BottomSheet
      isVisible={visible}
      onClose={onClose}
      height={height}
      zIndexBase={zIndexBase}
      contentInsetBottom={contentInsetBottom}
    >
      <View style={styles.header}>
        <AppText variant="h3" weight="bold" style={{ color: colors.text }}>
          {title}
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
          Type a name, then choose a person from the list.
        </AppText>
      </View>
      <View style={styles.inputWrap}>
        <Icon name="search" size={22} color={colors.subtle} style={{ marginRight: 8 }} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.subtle}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {searching ? (
        <AppText style={{ color: colors.subtle, marginVertical: 12 }}>Searching…</AppText>
      ) : null}
      {searchError ? (
        <AppText style={{ color: colors.error, marginVertical: 10 }}>{searchError}</AppText>
      ) : null}
      <ScrollView
        style={{ flex: 1, minHeight: 280 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {results.map((item) => (
          <View key={item.id}>{renderItem({ item })}</View>
        ))}
        {!searching && !searchError && query.trim().length < 2 ? (
          <AppText style={{ color: colors.subtle, marginTop: 8 }}>Type at least 2 characters.</AppText>
        ) : null}
        {!searching && !searchError && query.trim().length >= 2 && results.length === 0 ? (
          <AppText style={{ color: colors.subtle, marginTop: 16 }}>No people match that search.</AppText>
        ) : null}
      </ScrollView>
    </BottomSheet>
  );
}
