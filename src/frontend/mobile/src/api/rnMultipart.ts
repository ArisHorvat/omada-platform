import { Platform } from 'react-native';
import type { FileParameter } from '@/src/api/generatedClient';

/**
 * URIs that must be read into a real Blob/File before appending — browser FormData ignores RN’s `{ uri, type, name }`.
 * Expo Web image picks use `blob:http://localhost:8081/...`.
 */
function uriMustBeFetchedAsBlob(uri: string): boolean {
  if (uri.startsWith('blob:') || uri.startsWith('data:')) return true;
  if (Platform.OS === 'web' && /^https?:\/\//i.test(uri)) return true;
  return false;
}

/**
 * Multipart file append for **native** (RN `{ uri, type, name }`) and **web** (Blob / File from blob: URLs).
 * NSwag’s browser-style `append(name, blob, filename)` is wrong for native; RN’s uri-object is wrong for web.
 */
export async function appendFileParameterForReactNative(
  form: FormData,
  fieldName: string,
  file: FileParameter | null | undefined,
): Promise<void> {
  if (file == null) return;
  const d = file.data;
  const name = file.fileName?.trim() || 'upload';

  if (d != null && typeof d === 'object' && 'uri' in d && typeof (d as { uri: unknown }).uri === 'string') {
    const u = d as { uri: string; type?: string; name?: string };
    const uri = u.uri;
    const mime = u.type?.trim() || 'application/octet-stream';
    const partName = u.name?.trim() || name;

    if (uriMustBeFetchedAsBlob(uri)) {
      const response = await fetch(uri);
      const blob = await response.blob();
      const body = blob.type ? blob : new Blob([blob], { type: mime });
      if (typeof File !== 'undefined') {
        form.append(fieldName, new File([body], partName, { type: body.type || mime }));
      } else {
        form.append(fieldName, body, partName);
      }
      return;
    }

    form.append(fieldName, {
      uri,
      type: mime,
      name: partName,
    } as unknown as Blob);
    return;
  }

  if (typeof Blob !== 'undefined' && d instanceof Blob) {
    form.append(fieldName, d, name);
    return;
  }

  form.append(fieldName, d as never, name);
}

/** Builds an NSwag-compatible `FileParameter` whose `data` is a React Native / Expo Web image descriptor. */
export function fileParameterFromPickedImage(asset: {
  uri: string;
  mimeType: string;
  fileName: string;
}): FileParameter {
  return {
    data: { uri: asset.uri, type: asset.mimeType, name: asset.fileName },
    fileName: asset.fileName,
  };
}
