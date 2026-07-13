import apiClient from '@/src/api/apiClient';
import { appendFileParameterForReactNative } from '@/src/api/rnMultipart';
import { getApiErrorMessage, unwrap } from '@/src/api';
import { API_BASE_URL } from '@/src/config/config';
import {
  DocumentsClient,
  OrganizationDocumentDto,
  DocumentCategoryDto,
  PagedResponseOfOrganizationDocumentDto,
  UpdateOrganizationDocumentRequest,
} from '@/src/api/generatedClient';

export const DOCUMENTS_MAX_BYTES = 25 * 1024 * 1024;

export type { OrganizationDocumentDto, DocumentCategoryDto };

export type PagedDocumentsResponse = PagedResponseOfOrganizationDocumentDto;

const client = new DocumentsClient(API_BASE_URL, apiClient);

/** Upload/download use manual multipart/blob — NSwag IFormFile binding is not RN-safe. */
export const documentsApi = {
  async list(params: {
    page?: number;
    pageSize?: number;
    q?: string;
    category?: string | null;
  }): Promise<PagedDocumentsResponse> {
    return unwrap(
      await client.list(params.q, params.category, params.page ?? 1, params.pageSize ?? 20),
    );
  },

  async getCategories(): Promise<DocumentCategoryDto[]> {
    return unwrap(await client.getCategories());
  },

  async upload(params: {
    uri: string;
    mimeType: string;
    fileName: string;
    title?: string;
    category?: string;
    description?: string;
  }): Promise<OrganizationDocumentDto> {
    const form = new FormData();
    await appendFileParameterForReactNative(form, 'file', {
      data: { uri: params.uri, type: params.mimeType, name: params.fileName },
      fileName: params.fileName,
    });
    if (params.title?.trim()) form.append('title', params.title.trim());
    if (params.category?.trim()) form.append('category', params.category.trim());
    if (params.description?.trim()) form.append('description', params.description.trim());

    const res = await apiClient.post<{ isSuccess?: boolean; data?: OrganizationDocumentDto; error?: { message?: string } }>(
      'Documents',
      form,
    );

    if (res.data && res.data.isSuccess === false) {
      throw new Error(res.data.error?.message || 'Upload failed.');
    }
    const data = res.data?.data;
    if (!data) {
      throw new Error('Upload did not return a document.');
    }
    return data;
  },

  async update(
    id: string,
    body: { title: string; category: string; description?: string | null },
  ): Promise<OrganizationDocumentDto> {
    const request = new UpdateOrganizationDocumentRequest({
      title: body.title,
      category: body.category,
      description: body.description ?? undefined,
    });
    return unwrap(await client.update(id, request));
  },

  async delete(id: string): Promise<boolean> {
    return unwrap(await client.delete(id));
  },

  async downloadBlob(id: string): Promise<Blob> {
    const res = await apiClient.get(`Documents/${id}/download`, { responseType: 'blob' });
    return res.data as Blob;
  },
};

export function formatDocumentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isDocumentTooLargeMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('25 mb') || lower.includes('too large');
}

export function getDocumentUploadError(error: unknown): string {
  const message = getApiErrorMessage(error);
  if (isDocumentTooLargeMessage(message)) {
    return 'This file is too large. Please choose a file under 25 MB.';
  }
  return message;
}
