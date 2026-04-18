/**
 * Pixel rect of an image drawn with object-fit: contain / Skia fit="contain"
 * inside [0, containerW] x [0, containerH].
 */
export function computeContainRect(
  containerW: number,
  containerH: number,
  imageW: number,
  imageH: number,
): { offsetX: number; offsetY: number; contentW: number; contentH: number } {
  if (containerW <= 0 || containerH <= 0 || imageW <= 0 || imageH <= 0) {
    return { offsetX: 0, offsetY: 0, contentW: containerW, contentH: containerH };
  }
  const scale = Math.min(containerW / imageW, containerH / imageH);
  const contentW = imageW * scale;
  const contentH = imageH * scale;
  const offsetX = (containerW - contentW) / 2;
  const offsetY = (containerH - contentH) / 2;
  return { offsetX, offsetY, contentW, contentH };
}
