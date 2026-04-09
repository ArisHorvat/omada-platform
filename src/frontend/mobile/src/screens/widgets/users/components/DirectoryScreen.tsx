import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';

import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { ScreenTransition } from '@/src/components/animations';
import { PressClay } from '@/src/components/animations/PressClay';
import {
  AppText,
  ClayView,
  Icon,
  ProgressiveImage,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { OptionPickerSheet, type PickerOption } from '@/src/components/filters';
import { useThemeColors } from '@/src/hooks';
import type { UserDirectoryItemDto } from '@/src/api/generatedClient';
import { useDirectoryLogic } from '../hooks/useDirectoryLogic';

export default function DirectoryScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const {
    search,
    setSearch,
    departmentId,
    selectDepartment,
    departments,
    items,
    isLoading,
    isFetchingNextPage,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useDirectoryLogic();

  const [departmentPickerOpen, setDepartmentPickerOpen] = useState(false);

  const departmentOptions: PickerOption<string>[] = useMemo(
    () => departments.map((d) => ({ value: d.id, label: d.name, icon: 'domain' })),
    [departments],
  );

  const departmentSummary = useMemo(() => {
    if (!departmentId) return 'All departments';
    const d = departments.find((x) => x.id === departmentId);
    return d?.name ?? 'Department';
  }, [departmentId, departments]);

  const onDepartmentSelect = useCallback(
    (id: string | null) => {
      selectDepartment(id);
    },
    [selectDepartment],
  );

  const renderItem = ({ item }: { item: UserDirectoryItemDto }) => (
    <PressClay
      onPress={() =>
        router.push({
          pathname: '/user-profile',
          params: { id: item.id },
        } as any)
      }
    >
      <ClayView depth={8} puffy={12} style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            {item.avatarUrl ? (
              <ProgressiveImage source={{ uri: item.avatarUrl }} style={styles.avatarImg} resizeMode="cover" />
            ) : (
              <AppText variant="h3" weight="bold" style={{ color: colors.onPrimary }}>
                {(item.firstName?.[0] ?? '?').toUpperCase()}
              </AppText>
            )}
          </View>
          <View style={styles.textCol}>
            <AppText variant="body" weight="bold" numberOfLines={1} style={{ color: colors.text }}>
              {item.firstName} {item.lastName}
            </AppText>
            {item.title ? (
              <AppText variant="caption" numberOfLines={1} style={{ color: colors.subtle }}>
                {item.title}
              </AppText>
            ) : (
              <AppText variant="caption" numberOfLines={1} style={{ color: colors.subtle }}>
                {item.roleName}
              </AppText>
            )}
          </View>
          <Icon name="chevron-right" size={22} color={colors.subtle} />
        </View>
      </ClayView>
    </PressClay>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <ScreenTransition style={{ flex: 1 }}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <ClayBackButton />
            <AppText variant="h2" weight="bold" style={[styles.headerTitle, { color: colors.text }]}>
              Directory
            </AppText>
          </View>

          <AppText variant="caption" style={[styles.helper, { color: colors.subtle }]}>
            Search by name or email, then optionally narrow the list to one department.
          </AppText>

          <ClayView depth={12} puffy={0} color={colors.card} style={styles.searchScopeCard}>
            <View style={styles.searchRow}>
              <Icon name="search" size={24} color={colors.subtle} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Name, email, or title"
                placeholderTextColor={colors.subtle}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.scopeDivider, { backgroundColor: colors.border }]} />

            <PressClay onPress={() => setDepartmentPickerOpen(true)}>
              <View style={styles.scopeRow}>
                <View
                  style={[
                    styles.scopeBadge,
                    { borderColor: colors.primary, backgroundColor: colors.primaryContainer },
                  ]}
                >
                  <Icon name="filter-alt" size={18} color={colors.primary} />
                </View>
                <View style={styles.scopeText}>
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    Department scope
                  </AppText>
                  <AppText weight="bold" numberOfLines={2} style={{ color: colors.text, marginTop: 2 }}>
                    {departmentSummary}
                  </AppText>
                </View>
                <Icon name="expand-more" size={26} color={colors.primary} />
              </View>
            </PressClay>
          </ClayView>

          {isLoading ? (
            <View style={styles.skeletonWrap}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} height={72} borderRadius={16} style={{ marginBottom: 10 }} />
              ))}
            </View>
          ) : isError ? (
            <View style={styles.centered}>
              <WidgetErrorState message="Could not load directory." onRetry={() => void refetch()} />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.centered}>
              <WidgetEmptyState title="No users found" description="Try another search or department." icon="person" />
            </View>
          ) : (
            <FlashList
              data={items}
              keyExtractor={(i) => i.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
              }}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View style={{ paddingVertical: 16 }}>
                    <Skeleton height={72} borderRadius={16} />
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </ScreenTransition>

      <OptionPickerSheet
        isVisible={departmentPickerOpen}
        onClose={() => setDepartmentPickerOpen(false)}
        title="Department scope"
        options={departmentOptions}
        selected={departmentId}
        onSelect={onDepartmentSelect}
        height={520}
        allLabel="All departments"
        zIndexBase={220}
      />
    </SafeAreaView>
  );
}

const makeStyles = (_colors: any) =>
  StyleSheet.create({
    root: { flex: 1 },
    inner: { flex: 1, paddingHorizontal: 16 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 8,
      gap: 4,
    },
    headerTitle: {
      marginLeft: 10,
      flex: 1,
    },
    helper: {
      marginBottom: 14,
      lineHeight: 18,
      paddingRight: 4,
    },
    searchScopeCard: {
      borderRadius: 22,
      overflow: 'hidden',
      marginBottom: 16,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 56,
    },
    searchIcon: { marginRight: 4 },
    searchInput: {
      flex: 1,
      fontSize: 17,
      lineHeight: 22,
      paddingVertical: 10,
      minHeight: 44,
    },
    scopeDivider: {
      height: StyleSheet.hairlineWidth,
      marginHorizontal: 16,
    },
    scopeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 12,
    },
    scopeBadge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scopeText: {
      flex: 1,
      minWidth: 0,
    },
    listContent: { paddingBottom: 24, paddingTop: 4 },
    card: { borderRadius: 18, marginBottom: 10 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImg: { width: '100%', height: '100%' },
    textCol: { flex: 1, minWidth: 0 },
    skeletonWrap: { marginTop: 8 },
    centered: { flex: 1, justifyContent: 'center', paddingVertical: 24 },
  });
