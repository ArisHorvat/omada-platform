import apiClient from '@/src/api/apiClient';
import { appendFileParameterForReactNative } from '@/src/api/rnMultipart';
import { getApiErrorMessage } from '@/src/api';

const COURSEWORK_MAX_BYTES = 15 * 1024 * 1024;

function formatUploadError(error: unknown): string {
  const message = getApiErrorMessage(error);
  const lower = message.toLowerCase();
  if (
    lower.includes('15 mb') ||
    lower.includes('too large') ||
    lower.includes('request body') ||
    lower.includes('multipart body')
  ) {
    return 'This file is too large. Please choose a file under 15 MB.';
  }
  return message;
}

export { COURSEWORK_MAX_BYTES };

interface ServiceEnvelope<T> {
  isSuccess?: boolean;
  data?: T;
  error?: { message?: string };
}

/** Default uploads go to avatars; `news` uses server `/wwwroot/news/...`; `coursework` for assignment files. */
export type FileUploadScope = 'avatars' | 'news' | 'coursework';

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
  await appendFileParameterForReactNative(form, 'file', {
    data: { uri, type: mimeType, name: fileName },
    fileName,
  });
  if (scope === 'news' || scope === 'coursework') {
    form.append('scope', scope);
  }

  try {
    const res = await apiClient.post<ServiceEnvelope<{ url: string }>>('Files/upload', form);

    if (res.data && res.data.isSuccess === false) {
      const msg = res.data.error?.message || 'Upload failed.';
      if (msg.toLowerCase().includes('15 mb')) {
        throw new Error('This file is too large. Please choose a file under 15 MB.');
      }
      throw new Error(msg);
    }
    const url = res.data?.data?.url;
    if (!url) {
      throw new Error('Upload did not return a file URL.');
    }
    return url;
  } catch (error) {
    throw new Error(formatUploadError(error));
  }
}
