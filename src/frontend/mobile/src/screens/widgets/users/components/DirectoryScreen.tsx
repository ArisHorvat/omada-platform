import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { ScreenTransition } from '@/src/components/animations';
import { PressClay } from '@/src/components/animations/PressClay';
import type { PickerOption } from '@/src/components/filters';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { SplitPane } from '@/src/components/layout/SplitPane';
import { SPLIT_PANE_LIST_WIDTH } from '@/src/constants/layout';
import { SearchBar } from '@/src/screens/widgets/dashboard/components/SearchBar';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { DirectoryGroupPickerSheet } from './DirectoryGroupPickerSheet';
import {
  AppText,
  ClayView,
  Icon,
  ProgressiveImage,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { filterPanelCardStyles, filterPickerRowStyles } from '@/src/styles/filterPickerRow';
import { useThemeColors, useBreakpoint } from '@/src/hooks';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import type { UserDirectoryItemDto } from '@/src/api/usersDirectoryApi';
import { getDirectoryCopy } from '../utils/directoryCopy';
import { useDirectoryLogic } from '../hooks/useDirectoryLogic';
import { UserProfilePanel } from './UserProfilePanel';

export default function DirectoryScreen() {
  const colors = useThemeColors();
  const { isWideShell } = useBreakpoint();
  const router = useRouter();
  const { organization } = useCurrentOrganization();
  const { groupId: initialGroupId } = useLocalSearchParams<{ groupId?: string }>();
  const copy = useMemo(() => getDirectoryCopy(organization?.organizationType), [organization?.organizationType]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  const {
    search,
    setSearch,
    groupId,
    selectGroup,
    groupOptions,
    isLoadingGroups,
    isErrorGroups,
    roleName,
    selectRole,
    roleOptions,
    isLoadingRoles,
    isErrorRoles,
    items,
    totalCount,
    isLoading,
    isFetchingNextPage,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    clearFilters,
    hasActiveFilters,
  } = useDirectoryLogic();

  useEffect(() => {
    if (initialGroupId && typeof initialGroupId === 'string') {
      selectGroup(initialGroupId);
    }
  }, [initialGroupId, selectGroup]);

  const rolePickerOptions: PickerOption<string>[] = useMemo(
    () => roleOptions.map((name) => ({ value: name, label: name, icon: 'badge' })),
    [roleOptions],
  );

  const groupSummary = useMemo(() => {
    if (isLoadingGroups) return 'Loading…';
    if (isErrorGroups) return 'Could not load groups';
    if (!groupId) return copy.groupFilterAll;
    const match = groupOptions.find((g) => g.id === groupId);
    return match?.name ?? copy.groupFilterLabel;
  }, [copy.groupFilterAll, copy.groupFilterLabel, groupId, groupOptions, isErrorGroups, isLoadingGroups]);

  const roleSummary = useMemo(() => {
    if (isLoadingRoles) return 'Loading…';
    if (isErrorRoles) return 'Could not load roles';
    return roleName ?? copy.roleFilterAll;
  }, [copy.roleFilterAll, isErrorRoles, isLoadingRoles, roleName]);

  useEffect(() => {
    if (!isWideShell || items.length === 0) return;
    setSelectedUserId((prev) => {
      if (prev && items.some((x) => x.id === prev)) return prev;
      return items[0]?.id ?? null;
    });
  }, [isWideShell, items]);

  const openUser = useCallback(
    (id: string) => {
      if (isWideShell) {
        setSelectedUserId(id);
        return;
      }
      router.push({ pathname: '/user-profile', params: { id } } as never);
    },
    [isWideShell, router],
  );

  const renderItem = useCallback(
    ({ item }: { item: UserDirectoryItemDto }) => {
      const selected = isWideShell && selectedUserId === item.id;
      return (
        <PressClay onPress={() => openUser(item.id!)}>
          <ClayView
            depth={selected ? 4 : 8}
            puffy={12}
            style={[styles.card, selected && { borderWidth: 2, borderColor: colors.primary }]}
          >
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                {item.avatarUrl ? (
                  <ProgressiveImage
                    source={{ uri: item.avatarUrl }}
                    style={styles.avatarImg}
                    resizeMode="cover"
                  />
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
                {item.roleName ? (
                  <View style={[styles.rolePill, { backgroundColor: `${colors.primary}14` }]}>
                    <AppText variant="caption" weight="bold" style={{ color: colors.primary }} numberOfLines={1}>
                      {item.roleName}
                    </AppText>
                  </View>
                ) : null}
              </View>
              <Icon name="chevron-right" size={22} color={colors.subtle} />
            </View>
          </ClayView>
        </PressClay>
      );
    },
    [colors, isWideShell, openUser, selectedUserId, styles],
  );

  const directoryList = (
    <View style={[styles.inner, isWideShell && { paddingHorizontal: 12 }]}>
      <ScreenHeader title="Directory" />
      <AppText variant="body" style={[styles.subtitle, { color: colors.subtle }]}>
        {copy.subtitle}
      </AppText>

      <ClayView depth={10} color={colors.card} style={filterPanelCardStyles.card}>
        <View style={filterPanelCardStyles.searchWrap}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={copy.searchPlaceholder}
            compact
          />
        </View>

        <DirectoryFilterRow
          icon="groups"
          label={copy.groupFilterLabel}
          value={groupSummary}
          onPress={() => setGroupPickerOpen(true)}
          colors={colors}
        />

        <DirectoryFilterRow
          icon="badge"
          label={copy.roleFilterLabel}
          value={roleSummary}
          onPress={() => setRolePickerOpen(true)}
          colors={colors}
        />

        {hasActiveFilters ? (
          <Pressable onPress={clearFilters} accessibilityRole="button">
            <AppText variant="caption" weight="bold" style={{ color: colors.primary, textAlign: 'center' }}>
              Clear filters
            </AppText>
          </Pressable>
        ) : null}
      </ClayView>

      {!isLoading && items.length > 0 ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
          {totalCount} {totalCount === 1 ? 'person' : 'people'}
        </AppText>
      ) : null}

      {isLoading ? (
        <View style={styles.skeletonWrap}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height={80} borderRadius={16} style={{ marginBottom: 10 }} />
          ))}
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <WidgetErrorState message="Could not load directory." onRetry={() => void refetch()} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <WidgetEmptyState
            title="No people found"
            description={copy.emptyDescription}
            icon="person"
          />
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(i) => i.id!}
          renderItem={renderItem}
          estimatedItemSize={88}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 16 }}>
                <Skeleton height={80} borderRadius={16} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <ScreenTransition style={{ flex: 1 }}>
        <PageContainer>
          {isWideShell ? (
            <SplitPane sidebar={directoryList} sidebarWidth={SPLIT_PANE_LIST_WIDTH}>
              <UserProfilePanel
                userId={selectedUserId ?? undefined}
                onOpenUser={(id) => setSelectedUserId(id)}
                onFilterByGroup={selectGroup}
              />
            </SplitPane>
          ) : (
            directoryList
          )}
        </PageContainer>
      </ScreenTransition>

      <DirectoryGroupPickerSheet
        isVisible={groupPickerOpen}
        onClose={() => setGroupPickerOpen(false)}
        title={copy.groupFilterTitle}
        groups={groupOptions}
        orgType={organization?.organizationType}
        selected={groupId}
        onSelect={selectGroup}
        height={600}
        allLabel={copy.groupFilterAll}
        typeFilterAllLabel={copy.groupTypeFilterAll}
        typeFilterLabel={copy.groupTypeFilterLabel}
        typeFilterPickerTitle={copy.groupTypeFilterPickerTitle}
        searchPlaceholder={copy.groupSearchPlaceholder}
        zIndexBase={220}
      />

      <SearchableOptionPickerSheet
        isVisible={rolePickerOpen}
        onClose={() => setRolePickerOpen(false)}
        title={copy.roleFilterTitle}
        options={rolePickerOptions}
        selected={roleName}
        onSelect={selectRole}
        height={480}
        allLabel={copy.roleFilterAll}
        searchPlaceholder={copy.roleSearchPlaceholder}
        zIndexBase={220}
      />
    </SafeAreaView>
  );
}

function DirectoryFilterRow({
  icon,
  label,
  value,
  onPress,
  colors,
}: {
  icon: 'groups' | 'badge';
  label: string;
  value: string;
  onPress: () => void;
  colors: { background: string; primary: string; subtle: string; text: string };
}) {
  return (
    <PressClay onPress={onPress}>
      <View style={[filterPickerRowStyles.row, { backgroundColor: colors.background }]}>
        <View style={filterPickerRowStyles.iconColumn}>
          <Icon name={icon} size={20} color={colors.primary} />
        </View>
        <View style={filterPickerRowStyles.labelBlock}>
          <AppText variant="caption" style={{ color: colors.subtle }}>
            {label}
          </AppText>
          <AppText weight="bold" numberOfLines={2} style={{ color: colors.text }}>
            {value}
          </AppText>
        </View>
        <Icon name="expand-more" size={24} color={colors.subtle} />
      </View>
    </PressClay>
  );
}

const makeStyles = (colors: { border?: string }) =>
  StyleSheet.create({
    root: { flex: 1 },
    inner: { flex: 1, paddingHorizontal: 16 },
    subtitle: {
      marginBottom: 12,
      lineHeight: 22,
    },
    listContent: { paddingBottom: 24 },
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
    textCol: { flex: 1, minWidth: 0, gap: 2 },
    rolePill: {
      alignSelf: 'flex-start',
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      maxWidth: '100%',
    },
    skeletonWrap: { marginTop: 4 },
    centered: { flex: 1, justifyContent: 'center', paddingVertical: 24 },
  });
