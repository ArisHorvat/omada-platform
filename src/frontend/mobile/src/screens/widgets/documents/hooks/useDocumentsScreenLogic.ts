import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  documentsApi,
  DOCUMENTS_MAX_BYTES,
  getDocumentUploadError,
  type OrganizationDocumentDto,
} from '@/src/api/documentsApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { usePermission } from '@/src/context/PermissionContext';
import { useDebounce } from '@/src/hooks';
import { confirmAction } from '@/src/utils/confirmAction';
import { API_BASE_URL } from '@/src/config/config';
import { useRemoteFileActions } from '@/src/hooks/useRemoteFileActions';
import type { DocumentEditDraft, DocumentUploadDraft } from '../components/DocumentFormSheet';

function isCorporateOrgType(orgType?: string | null): boolean {
  return (orgType ?? '').toLowerCase() === 'corporate';
}

async function resolvePickedFileSize(asset: DocumentPicker.DocumentPickerAsset): Promise<number | null> {
  if (typeof asset.size === 'number' && asset.size > 0) return asset.size;
  return null;
}

function triggerWebDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function useDocumentsScreenLogic() {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;
  const orgType = organization?.organizationType;
  const { can, loading: permissionsLoading } = usePermission();
  const queryClient = useQueryClient();
  const { downloadAndShare } = useRemoteFileActions();

  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const debouncedQ = useDebounce(searchInput, 300);

  const [uploadDraft, setUploadDraft] = useState<DocumentUploadDraft | null>(null);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<DocumentEditDraft | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<OrganizationDocumentDto | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const isCorporate = isCorporateOrgType(orgType);
  const canView = can('documents.view');
  const canUpload = can('documents.upload');
  const canManage = can('documents.manage');
  const canEdit = canUpload;

  const listQuery = useQuery({
    queryKey: QUERY_KEYS.documents.list(orgId ?? '', debouncedQ, categoryFilter, 1),
    queryFn: () =>
      documentsApi.list({
        page: 1,
        pageSize: 50,
        q: debouncedQ || undefined,
        category: categoryFilter,
      }),
    enabled: !!orgId && isCorporate && canView,
  });

  const categoriesQuery = useQuery({
    queryKey: QUERY_KEYS.documents.categories(orgId ?? ''),
    queryFn: () => documentsApi.getCategories(),
    enabled: !!orgId && isCorporate && canView,
    staleTime: 1000 * 60 * 30,
  });

  const invalidateDocuments = useCallback(() => {
    if (!orgId) return;
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents.all(orgId) });
  }, [orgId, queryClient]);

  const uploadMutation = useMutation({
    mutationFn: documentsApi.upload,
    onSuccess: () => {
      invalidateDocuments();
      setUploadSheetOpen(false);
      setUploadDraft(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { title: string; category: string; description?: string | null } }) =>
      documentsApi.update(id, body),
    onSuccess: (updated) => {
      invalidateDocuments();
      setEditSheetOpen(false);
      setEditDraft(null);
      setSelectedDocument((prev) => (prev?.id === updated.id ? updated : prev));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      invalidateDocuments();
      setDetailSheetOpen(false);
      setSelectedDocument(null);
    },
  });

  const categories = categoriesQuery.data ?? [];
  const documents = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items]);

  const cancelUpload = useCallback(() => {
    if (uploadMutation.isPending) return;
    setUploadSheetOpen(false);
    setUploadDraft(null);
  }, [uploadMutation.isPending]);

  const startUpload = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets[0]?.uri) return;

      const asset = result.assets[0];
      const byteSize = await resolvePickedFileSize(asset);
      if (byteSize != null && byteSize > DOCUMENTS_MAX_BYTES) {
        Alert.alert('File too large', 'Please choose a file under 25 MB.');
        return;
      }

      setUploadDraft({
        uri: asset.uri,
        mimeType: asset.mimeType || 'application/octet-stream',
        fileName: asset.name || 'document',
        byteSize,
      });
      setUploadSheetOpen(true);
    } catch (e) {
      Alert.alert('Could not pick file', e instanceof Error ? e.message : 'Try again.');
    }
  }, []);

  const submitUpload = useCallback(
    async (values: { title: string; category: string; description?: string | null }) => {
      if (!uploadDraft) return;
      try {
        await uploadMutation.mutateAsync({
          uri: uploadDraft.uri,
          mimeType: uploadDraft.mimeType,
          fileName: uploadDraft.fileName,
          title: values.title,
          category: values.category,
          description: values.description ?? undefined,
        });
      } catch (e) {
        Alert.alert('Upload failed', getDocumentUploadError(e));
      }
    },
    [uploadDraft, uploadMutation],
  );

  const openDocumentDetail = useCallback((doc: OrganizationDocumentDto) => {
    setSelectedDocument(doc);
    setDetailSheetOpen(true);
  }, []);

  const closeDetailSheet = useCallback(() => {
    setDetailSheetOpen(false);
    setSelectedDocument(null);
  }, []);

  const openDocumentFile = useCallback(
    async (doc: OrganizationDocumentDto) => {
      try {
        if (Platform.OS === 'web') {
          const blob = await documentsApi.downloadBlob(doc.id);
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank', 'noopener,noreferrer');
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
          return;
        }

        const base = API_BASE_URL.replace(/\/$/, '');
        await downloadAndShare(`${base}/api/Documents/${doc.id}/download`, doc.originalFileName);
      } catch (e) {
        Alert.alert('Open failed', e instanceof Error ? e.message : 'Try again.');
      }
    },
    [downloadAndShare],
  );

  const downloadDocumentFile = useCallback(async (doc: OrganizationDocumentDto) => {
    try {
      if (Platform.OS === 'web') {
        const blob = await documentsApi.downloadBlob(doc.id);
        triggerWebDownload(blob, doc.originalFileName);
        return;
      }

      const base = API_BASE_URL.replace(/\/$/, '');
      await downloadAndShare(`${base}/api/Documents/${doc.id}/download`, doc.originalFileName);
    } catch (e) {
      Alert.alert('Download failed', e instanceof Error ? e.message : 'Try again.');
    }
  }, [downloadAndShare]);

  const startEditDocument = useCallback((doc: OrganizationDocumentDto) => {
    setDetailSheetOpen(false);
    setEditDraft({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      description: doc.description,
      originalFileName: doc.originalFileName,
      byteSize: doc.byteSize,
    });
    setEditSheetOpen(true);
  }, []);

  const submitEdit = useCallback(
    async (values: { title: string; category: string; description?: string | null }) => {
      if (!editDraft) return;
      try {
        await updateMutation.mutateAsync({
          id: editDraft.id,
          body: values,
        });
      } catch (e) {
        Alert.alert('Update failed', e instanceof Error ? e.message : 'Try again.');
      }
    },
    [editDraft, updateMutation],
  );

  const deleteDocument = useCallback(
    (doc: OrganizationDocumentDto) => {
      confirmAction({
        title: 'Delete document',
        message: `Remove “${doc.title}” from the organization library? This cannot be undone.`,
        confirmText: 'Delete',
        destructive: true,
        onConfirm: async () => {
          try {
            await deleteMutation.mutateAsync(doc.id);
          } catch (e) {
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Try again.');
          }
        },
      });
    },
    [deleteMutation],
  );

  const isMutating = uploadMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return {
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
    totalCount: listQuery.data?.totalCount ?? 0,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    isMutating,
    startUpload,
    cancelUpload,
    uploadSheetOpen,
    setUploadSheetOpen,
    uploadDraft,
    submitUpload,
    isUploading: uploadMutation.isPending,
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
  };
}
