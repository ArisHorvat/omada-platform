import apiClient from '@/src/api/apiClient';

interface ServiceEnvelope<T> {
  isSuccess?: boolean;
  data?: T;
  error?: { message?: string };
}

/** Default uploads go to avatars; `news` uses server `/wwwroot/news/images` or `/news/documents`. */
export type FileUploadScope = 'avatars' | 'news';

/**
 * Multipart upload matching POST /api/Files/upload.
 * Pass `scope: 'news'` for article images and document attachments.
 */
export async function uploadPublicFile(
  uri: string,
  mimeType: string,
  fileName: string,
  scope: FileUploadScope = 'avatars',
): Promise<string> {
  const form = new FormData();
  form.append('file', { uri, type: mimeType, name: fileName } as unknown as Blob);
  if (scope === 'news') {
    form.append('scope', 'news');
  }

  const res = await apiClient.post<ServiceEnvelope<{ url: string }>>('Files/upload', form);

  if (res.data && res.data.isSuccess === false) {
    throw new Error(res.data.error?.message || 'Upload failed.');
  }
  const url = res.data?.data?.url;
  if (!url) {
    throw new Error('Upload did not return a file URL.');
  }
  return url;
}
