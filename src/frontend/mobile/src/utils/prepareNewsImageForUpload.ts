import * as ImageManipulator from 'expo-image-manipulator';

export type PreparedNewsImage = { uri: string; mimeType: string; fileName: string };

function stripExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

function extensionLower(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : '';
}

/**
 * Ensures news uploads are JPEG or PNG. HEIC/HEIF from iOS is converted to JPEG.
 * Other raster types are re-encoded to JPEG so the API stores a predictable format.
 */
export async function prepareNewsImageForUpload(
  uri: string,
  mimeType: string | undefined,
  fileName: string,
): Promise<PreparedNewsImage> {
  const ext = extensionLower(fileName);
  const mime = (mimeType || '').toLowerCase();
  const isHeic = mime === 'image/heic' || mime === 'image/heif' || ext === 'heic' || ext === 'heif';
  const isPng = mime === 'image/png' || ext === 'png';
  const isJpeg = mime === 'image/jpeg' || mime === 'image/jpg' || ext === 'jpg' || ext === 'jpeg';

  if (isPng && !isHeic) {
    const name = ext === 'png' ? fileName : `${stripExtension(fileName) || 'image'}.png`;
    return { uri, mimeType: mimeType || 'image/png', fileName: name };
  }

  if (isJpeg && !isHeic) {
    const name = ext === 'jpg' || ext === 'jpeg' ? fileName : `${stripExtension(fileName) || 'image'}.jpg`;
    return { uri, mimeType: 'image/jpeg', fileName: name };
  }

  const base = stripExtension(fileName) || 'image';
  const out = await ImageManipulator.manipulateAsync(uri, [], {
    compress: isHeic ? 0.88 : 0.9,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return { uri: out.uri, mimeType: 'image/jpeg', fileName: `${base}.jpg` };
}
