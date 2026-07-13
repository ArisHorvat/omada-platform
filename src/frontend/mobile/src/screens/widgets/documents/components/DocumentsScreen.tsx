import React from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { WidgetPageShell } from '@/src/components/layout';
import {
  AppButton,
  AppText,
  ClayView,
  Icon,
  IconName,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { SearchBar } from '@/src/screens/widgets/dashboard/components/SearchBar';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { formatDocumentSize } from '@/src/api/documentsApi';
import { useDocumentsScreenLogic } from '../hooks/useDocumentsScreenLogic';
import { categoryLabel } from '../utils/documentLabels';
import { createDocumentsStyles } from '../styles/documents.styles';
import { DocumentFormSheet } from './DocumentFormSheet';
import { DocumentDetailSheet } from './DocumentDetailSheet';

function fileIconName(contentType: string): IconName {
  const mime = contentType.toLowerCase();
  if (mime.includes('pdf')) return 'picture-as-pdf';
  if (mime.startsWith('image/')) return 'image';
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('presentation') ||
    mime.includes('text')
  ) {
    return 'description';
  }
  return 'insert-drive-file';
}

export default function DocumentsScreen() {
  const colors = useThemeColors();
  const styles = createDocumentsStyles(colors);
  const logic = useDocumentsScreenLogic();

  const {
    isCorporate,
    canView,
    canUpload,
    canEdit,
    canManage,
    permissionsLoading,
    searchInput,
    setSearchInput,
    categoryFilter,
    setCategoryFilter,
    categories,
    documents,
    totalCount,
    isLoading,
    isError,
    refetch,
    isMutating,
    startUpload,
    cancelUpload,
    uploadSheetOpen,
    uploadDraft,
    submitUpload,
    isUploading,
    detailSheetOpen,
    selectedDocument,
    openDocumentDetail,
    closeDetailSheet,
    openDocumentFile,
    downloadDocumentFile,
    editSheetOpen,
    setEditSheetOpen,
    editDraft,
    startEditDocument,
    submitEdit,
    deleteDocument,
  } = logic;

  if (!permissionsLoading && !canView) {
    return (
      <WidgetPageShell>
        <ScreenHeader title="Documents" />
        <View style={{ padding: 16 }}>
          <WidgetEmptyState
            title="No access"
            description="You do not have permission to view organization documents."
            icon="lock"
          />
        </View>
      </WidgetPageShell>
    );
  }

  if (!permissionsLoading && !isCorporate) {
    return (
      <WidgetPageShell>
        <ScreenHeader title="Documents" />
        <View style={{ padding: 16 }}>
          <WidgetEmptyState
            title="Corporate organizations only"
            description="The document library is for corporate orgs — policies, HR packs, templates, and project files."
            icon="business"
          />
        </View>
      </WidgetPageShell>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <WidgetPageShell>
          <ScreenHeader
            title="Documents"
            subtitle="Organization file library"
            right={
              canUpload ? (
                <AppButton
                  title="Upload"
                  onPress={startUpload}
                  disabled={isMutating}
                  size="sm"
                  style={{ minWidth: 88 }}
                />
              ) : undefined
            }
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
            keyboardShouldPersistTaps="handled"
          >
            <ClayView color={colors.card} style={styles.filterCard}>
              <SearchBar
                autoFocus={false}
                placeholder="Search documents…"
                value={searchInput}
                onChangeText={setSearchInput}
              />
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 12 }}>
                Folder
              </AppText>
              <View style={styles.filterRow}>
                <PressClay onPress={() => setCategoryFilter(null)}>
                  <View
                    style={[
                      styles.chip,
                      {
                        borderColor: categoryFilter == null ? colors.primary : colors.border,
                        backgroundColor: categoryFilter == null ? `${colors.primary}22` : colors.background,
                      },
                    ]}
                  >
                    <AppText style={[styles.chipText, { color: colors.text }]}>All</AppText>
                  </View>
                </PressClay>
                {categories.map((cat) => {
                  const active = categoryFilter === cat.key;
                  return (
                    <PressClay key={cat.key} onPress={() => setCategoryFilter(cat.key)}>
                      <View
                        style={[
                          styles.chip,
                          {
                            borderColor: active ? colors.primary : colors.border,
                            backgroundColor: active ? `${colors.primary}22` : colors.background,
                          },
                        ]}
                      >
                        <AppText style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
                          {cat.label}
                        </AppText>
                      </View>
                    </PressClay>
                  );
                })}
              </View>
            </ClayView>

            {isLoading && documents.length === 0 ? (
              <Skeleton height={88} style={{ marginBottom: 10, borderRadius: 16 }} />
            ) : null}

            {isError ? (
              <WidgetErrorState message="Could not load documents." onRetry={refetch} />
            ) : null}

            {!isLoading && !isError && documents.length === 0 ? (
              <View style={styles.emptyWrap}>
                <WidgetEmptyState
                  title="No documents yet"
                  description={
                    canUpload
                      ? 'Upload policies, onboarding packs, templates, or project files for your team.'
                      : 'Files shared with your organization will appear here.'
                  }
                  icon="folder-shared"
                />
              </View>
            ) : null}

            {documents.map((doc) => (
              <ClayView key={doc.id} color={colors.card} style={styles.listCard}>
                <PressClay onPress={() => openDocumentDetail(doc)}>
                  <View style={styles.rowTop}>
                    <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}18` }]}>
                      <Icon name={fileIconName(doc.contentType)} size={24} color={colors.primary} />
                    </View>
                    <View style={styles.rowBody}>
                      <AppText weight="bold" style={{ color: colors.text }} numberOfLines={2}>
                        {doc.title}
                      </AppText>
                      <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }} numberOfLines={1}>
                        {doc.originalFileName}
                      </AppText>
                      <View style={styles.metaRow}>
                        <AppText variant="caption" style={{ color: colors.subtle }}>
                          {categoryLabel(doc.category)}
                        </AppText>
                        <AppText variant="caption" style={{ color: colors.subtle }}>
                          {formatDocumentSize(doc.byteSize)}
                        </AppText>
                        <AppText variant="caption" style={{ color: colors.subtle }}>
                          {doc.uploadedByName}
                        </AppText>
                      </View>
                    </View>
                    <Icon name="chevron-right" size={22} color={colors.subtle} />
                  </View>
                </PressClay>
              </ClayView>
            ))}

            {totalCount > documents.length ? (
              <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center', marginTop: 8 }}>
                Showing {documents.length} of {totalCount}
              </AppText>
            ) : null}
          </ScrollView>
        </WidgetPageShell>
      </SafeAreaView>

      <DocumentFormSheet
        visible={uploadSheetOpen}
        mode="upload"
        categories={categories}
        uploadDraft={uploadDraft}
        defaultCategory={categoryFilter}
        saving={isUploading}
        onClose={cancelUpload}
        onSubmit={submitUpload}
      />

      <DocumentFormSheet
        visible={editSheetOpen}
        mode="edit"
        categories={categories}
        editDraft={editDraft}
        saving={isMutating}
        onClose={() => {
          if (!isMutating) setEditSheetOpen(false);
        }}
        onSubmit={submitEdit}
      />

      <DocumentDetailSheet
        visible={detailSheetOpen}
        document={selectedDocument}
        canEdit={canEdit}
        canDelete={canManage}
        busy={isMutating}
        onClose={closeDetailSheet}
        onOpen={() => selectedDocument && openDocumentFile(selectedDocument)}
        onDownload={() => selectedDocument && downloadDocumentFile(selectedDocument)}
        onEdit={() => selectedDocument && startEditDocument(selectedDocument)}
        onDelete={() => selectedDocument && deleteDocument(selectedDocument)}
      />
    </View>
  );
}
