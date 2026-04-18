"""
Computer-vision pipeline: segment navigable room regions on floorplan images, OCR labels, emit GeoJSON.

Pipeline highlights:
- **Enhance** uploads (CLAHE + bilateral) for clearer walls vs paper/watermarks.
- **Exterior** isolation with a moderately closed wall mask (doors shut for outside flood-fill).
- **Watershed** on distance-transform peaks when door gaps merge everything into one region.
- **Tight wall mask** (doors left open) for splitting + distance peaks.
- **Morphological closing** of each room mask toward walls; **raster clip** to building interior
  to reduce polygons bleeding past the outer contour.
"""

from __future__ import annotations

import logging
import os
import re
import shutil
import uuid
from typing import Any

import cv2
import numpy as np
import pytesseract

logger = logging.getLogger(__name__)

_MAX_IMAGE_SIDE = 2000
_MAX_ROOMS = 48
_EXTERIOR_PAD = 8
_WALL_CLOSE_KERNEL = 9
_WALL_CLOSE_ITERS = 2
_WALL_DILATE_ITERS = 2
_DOOR_CLOSE_KERNEL = 15
_DOOR_CLOSE_ITERS = 1
# “Tight” walls for watershed / DT (do not seal door gaps — splits rooms via peaks).
_TIGHT_CLOSE_KERNEL = 5
_TIGHT_CLOSE_ITERS = 1
_TIGHT_DILATE_ITERS = 1


def _configure_tesseract() -> None:
    if shutil.which("tesseract"):
        return
    for candidate in (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    ):
        if os.path.isfile(candidate):
            pytesseract.pytesseract.tesseract_cmd = candidate
            logger.info("Using Tesseract at %s", candidate)


def decode_image_to_bgr(image_bytes: bytes) -> np.ndarray | None:
    """Decode raw upload bytes to BGR ndarray; handles PNG alpha by compositing on white."""
    if not image_bytes:
        return None
    buf = np.frombuffer(image_bytes, dtype=np.uint8)
    bgra = cv2.imdecode(buf, cv2.IMREAD_UNCHANGED)
    if bgra is None:
        return None
    if bgra.ndim == 2:
        return cv2.cvtColor(bgra, cv2.COLOR_GRAY2BGR)
    if bgra.shape[2] == 4:
        alpha = bgra[:, :, 3:4].astype(np.float32) / 255.0
        rgb = bgra[:, :, :3].astype(np.float32)
        bg = np.full_like(rgb, 255.0)
        blended = (rgb * alpha + bg * (1.0 - alpha)).astype(np.uint8)
        return cv2.cvtColor(blended, cv2.COLOR_RGB2BGR)
    return bgra[:, :, :3]


def _maybe_resize(bgr: np.ndarray) -> np.ndarray:
    h, w = bgr.shape[:2]
    m = max(h, w)
    if m <= _MAX_IMAGE_SIDE:
        return bgr
    scale = _MAX_IMAGE_SIDE / m
    return cv2.resize(bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


def enhance_bgr_for_floorplan(bgr: np.ndarray) -> np.ndarray:
    """
    Contrast + denoise to help Otsu/Canny: soft watermarks and faint walls become more stable.
    """
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    l, a, bch = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.8, tileGridSize=(8, 8))
    l2 = clahe.apply(l)
    lab2 = cv2.merge((l2, a, bch))
    out = cv2.cvtColor(lab2, cv2.COLOR_LAB2BGR)
    out = cv2.bilateralFilter(out, d=7, sigmaColor=60, sigmaSpace=60)
    return out


def _normalize_gray_for_walls(gray: np.ndarray) -> np.ndarray:
    g = gray.copy()
    if np.median(g) < 90:
        g = 255 - g
    return g


def _base_wall_strokes(gray: np.ndarray) -> np.ndarray:
    """Shared dark-stroke mask before loose vs tight morphology."""
    g = cv2.GaussianBlur(gray, (5, 5), 0)
    _, otsu = cv2.threshold(g, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    edges = cv2.Canny(g, 40, 120)
    k3 = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    walls = cv2.bitwise_or(otsu, cv2.dilate(edges, k3, iterations=2))
    return walls


def wall_mask_loose_for_exterior(gray: np.ndarray) -> np.ndarray:
    """Thick walls + close door gaps so exterior flood-fill does not enter the building."""
    walls = _base_wall_strokes(gray)
    k9 = cv2.getStructuringElement(cv2.MORPH_RECT, (_WALL_CLOSE_KERNEL, _WALL_CLOSE_KERNEL))
    k5 = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    k15 = cv2.getStructuringElement(cv2.MORPH_RECT, (_DOOR_CLOSE_KERNEL, _DOOR_CLOSE_KERNEL))
    walls = cv2.morphologyEx(walls, cv2.MORPH_CLOSE, k9, iterations=_WALL_CLOSE_ITERS)
    walls = cv2.dilate(walls, k5, iterations=_WALL_DILATE_ITERS)
    walls = cv2.morphologyEx(walls, cv2.MORPH_CLOSE, k15, iterations=_DOOR_CLOSE_ITERS)
    return walls


def wall_mask_tight_for_split(gray: np.ndarray) -> np.ndarray:
    """Thinner walls; doorways often stay open → multiple DT peaks / watershed regions."""
    walls = _base_wall_strokes(gray)
    kt = cv2.getStructuringElement(cv2.MORPH_RECT, (_TIGHT_CLOSE_KERNEL, _TIGHT_CLOSE_KERNEL))
    k5 = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    walls = cv2.morphologyEx(walls, cv2.MORPH_CLOSE, kt, iterations=_TIGHT_CLOSE_ITERS)
    walls = cv2.dilate(walls, k5, iterations=_TIGHT_DILATE_ITERS)
    return walls


def _interior_mask_after_flood(wall_loose: np.ndarray) -> tuple[np.ndarray, int, int, int, int]:
    """Interior navigable pixels (255) after exterior removal; returns padded coords + pad."""
    h, w = wall_loose.shape[:2]
    free = cv2.bitwise_not(wall_loose)
    pad = _EXTERIOR_PAD
    padded = cv2.copyMakeBorder(free, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=255)
    h2, w2 = padded.shape
    ff = padded.copy()
    flood_mask = np.zeros((h2 + 2, w2 + 2), np.uint8)
    cv2.floodFill(ff, flood_mask, (0, 0), 200)
    interior_padded = (ff == 255).astype(np.uint8) * 255
    interior = interior_padded[pad : pad + h, pad : pad + w]
    return interior, h, w, pad, h2, w2


def _nms_peaks(coords: list[tuple[int, int]], values: list[float], min_dist: float) -> list[tuple[int, int]]:
    """Greedy non-max suppression by descending peak strength."""
    order = sorted(range(len(coords)), key=lambda i: -values[i])
    kept: list[tuple[int, int]] = []
    for i in order:
        y, x = coords[i]
        ok = True
        for (yy, xx) in kept:
            if (y - yy) ** 2 + (x - xx) ** 2 < min_dist * min_dist:
                ok = False
                break
        if ok:
            kept.append((y, x))
    return kept


def _peaks_from_distance(dist: np.ndarray, interior: np.ndarray, h: int, w: int) -> list[tuple[int, int]]:
    """Local maxima of distance transform (room centers), with NMS."""
    dist2 = dist.copy()
    dist2[interior == 0] = 0
    dmax = float(dist2.max()) if dist2.size else 0.0
    if dmax < 1e-6:
        return []
    ksz = max(11, min(h, w) // 35)
    kernel = np.ones((ksz, ksz), np.uint8)
    dil = cv2.dilate(dist2, kernel)
    local_max = (dist2 == dil) & (dist2 > max(6.0, 0.14 * dmax))
    ys, xs = np.where(local_max)
    coords = [(int(ys[i]), int(xs[i])) for i in range(len(xs))]
    values = [float(dist2[y, x]) for y, x in coords]
    min_sep = float(max(ksz, min(h, w) // 28))
    return _nms_peaks(coords, values, min_sep)


def _expand_mask_to_free_space(room: np.ndarray, interior: np.ndarray, wall_loose: np.ndarray) -> np.ndarray:
    """Grow room mask toward walls (fill interior of room) without crossing loose walls."""
    free_cap = cv2.bitwise_and(interior, cv2.bitwise_not(wall_loose))
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    out = room.copy()
    for _ in range(12):
        dil = cv2.dilate(out, k, iterations=1)
        nxt = cv2.bitwise_and(dil, free_cap)
        if cv2.countNonZero(nxt) == cv2.countNonZero(out):
            break
        out = nxt
    k_big = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
    out = cv2.morphologyEx(out, cv2.MORPH_CLOSE, k_big, iterations=1)
    out = cv2.bitwise_and(out, free_cap)
    return out


def _mask_to_ring(
    mask_uint8: np.ndarray,
    interior: np.ndarray,
    w: int,
    h: int,
) -> np.ndarray | None:
    """Contour from mask, clip raster to interior, re-extract contour; normalized closed ring."""
    m = cv2.bitwise_and(mask_uint8, interior)
    if cv2.countNonZero(m) < 80:
        return None
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        return None
    cnt = max(cnts, key=cv2.contourArea)
    peri = cv2.arcLength(cnt, True)
    if peri < 1e-3:
        return None
    approx = cv2.approxPolyDP(cnt, 0.0035 * peri, True)
    if len(approx) < 3:
        return None
    pts = approx.reshape(-1, 2).astype(np.float64)
    pts[:, 0] = np.clip(pts[:, 0], 0.0, float(w - 1))
    pts[:, 1] = np.clip(pts[:, 1], 0.0, float(h - 1))
    pts[:, 0] /= float(w)
    pts[:, 1] /= float(h)
    if not np.allclose(pts[0], pts[-1]):
        pts = np.vstack([pts, pts[0:1]])
    return pts


def _rooms_from_interior_cc(
    interior: np.ndarray,
    wall_loose: np.ndarray,
    h: int,
    w: int,
) -> list[np.ndarray]:
    """Connected components on interior (multiple disjoint rooms when doors are closed in loose mask)."""
    n, labels, stats, _ = cv2.connectedComponentsWithStats(interior, connectivity=8)
    area_img = float(h * w)
    area_min = max(area_img * 0.0012, 400.0)
    area_max = area_img * 0.93
    rings: list[np.ndarray] = []
    for lab in range(1, n):
        area = int(stats[lab, cv2.CC_STAT_AREA])
        if area < area_min or area > area_max:
            continue
        mask = (labels == lab).astype(np.uint8) * 255
        mask = _expand_mask_to_free_space(mask, interior, wall_loose)
        ring = _mask_to_ring(mask, interior, w, h)
        if ring is not None:
            rings.append(ring)
    rings.sort(key=lambda r: -float(np.ptp(r[:, 0]) * np.ptp(r[:, 1])))
    return rings[:_MAX_ROOMS]


def _segment_rooms(
    wall_loose: np.ndarray,
    wall_tight: np.ndarray,
    gray: np.ndarray,
    h: int,
    w: int,
) -> list[np.ndarray]:
    interior, _, _, _pad, _, _ = _interior_mask_after_flood(wall_loose)
    gray3 = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

    n_lab, labels, stats, _ = cv2.connectedComponentsWithStats(interior, connectivity=8)
    large_regions = 0
    largest_area = 0
    for lab in range(1, n_lab):
        a = int(stats[lab, cv2.CC_STAT_AREA])
        largest_area = max(largest_area, a)
        if a > max(h * w * 0.04, 5000):
            large_regions += 1

    use_watershed = large_regions <= 1 and largest_area > h * w * 0.12

    rings: list[np.ndarray] = []

    if use_watershed:
        ws_masks = _watershed_room_masks(gray3, wall_tight, wall_loose, interior, h, w)
        if len(ws_masks) >= 2:
            for m in ws_masks:
                m2 = _expand_mask_to_free_space(m, interior, wall_loose)
                ring = _mask_to_ring(m2, interior, w, h)
                if ring is not None:
                    rings.append(ring)
            rings.sort(key=lambda r: -float(np.ptp(r[:, 0]) * np.ptp(r[:, 1])))
            if rings:
                return rings[:_MAX_ROOMS]
        logger.info("Watershed did not yield enough regions; falling back to CC.")

    rings = _rooms_from_interior_cc(interior, wall_loose, h, w)
    return rings


def _watershed_room_masks(
    gray3: np.ndarray,
    wall_tight: np.ndarray,
    wall_loose: np.ndarray,
    interior: np.ndarray,
    h: int,
    w: int,
) -> list[np.ndarray]:
    free = ((wall_tight == 0) & (interior > 0)).astype(np.uint8) * 255
    if cv2.countNonZero(free) < 100:
        return []
    dist = cv2.distanceTransform(free, cv2.DIST_L2, 5)
    peaks = _peaks_from_distance(dist, interior, h, w)
    if len(peaks) < 2:
        return []

    markers = np.zeros((h, w), dtype=np.int32)
    markers[wall_tight > 127] = 1
    for i, (y, x) in enumerate(peaks[:_MAX_ROOMS], start=2):
        if 0 <= y < h and 0 <= x < w:
            markers[y, x] = i

    img_ws = gray3.copy()
    cv2.watershed(img_ws, markers)

    masks: list[np.ndarray] = []
    max_lbl = int(markers.max())
    for lbl in range(2, max_lbl + 1):
        m = (markers == lbl).astype(np.uint8) * 255
        m = cv2.bitwise_and(m, interior)
        area = cv2.countNonZero(m)
        if area < max(h * w * 0.0008, 250.0):
            continue
        masks.append(m)

    k_fill = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))
    filled: list[np.ndarray] = []
    for m in masks:
        m2 = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k_fill, iterations=2)
        m2 = cv2.bitwise_and(m2, interior)
        m2 = cv2.bitwise_and(m2, cv2.bitwise_not(wall_loose))
        filled.append(m2)
    return filled


def _bboxes_from_rings_pixel(
    rings: list[np.ndarray], w: int, h: int
) -> list[tuple[int, int, int, int]]:
    bboxes: list[tuple[int, int, int, int]] = []
    for ring in rings:
        xs = (ring[:, 0] * w).clip(0, w - 1)
        ys = (ring[:, 1] * h).clip(0, h - 1)
        x0, x1 = int(xs.min()), int(xs.max())
        y0, y1 = int(ys.min()), int(ys.max())
        pad = max(2, int(0.02 * max(x1 - x0, y1 - y0, 1)))
        x0 = max(0, x0 - pad)
        y0 = max(0, y0 - pad)
        x1 = min(w, x1 + pad)
        y1 = min(h, y1 + pad)
        bboxes.append((x0, y0, x1 - x0, y1 - y0))
    return bboxes


def detect_room_contours(bgr: np.ndarray) -> tuple[list[np.ndarray], list[tuple[int, int, int, int]]]:
    bgr = _maybe_resize(bgr)
    bgr = enhance_bgr_for_floorplan(bgr)
    h, w = bgr.shape[:2]
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    gray = _normalize_gray_for_walls(gray)
    wall_loose = wall_mask_loose_for_exterior(gray)
    wall_tight = wall_mask_tight_for_split(gray)
    rings = _segment_rooms(wall_loose, wall_tight, gray, h, w)
    if not rings:
        logger.info("Primary segmentation found no rooms; trying legacy edge contours.")
        rings, bboxes = _legacy_edge_contours(bgr, gray, w, h)
        return rings, bboxes
    bboxes = _bboxes_from_rings_pixel(rings, w, h)
    return rings, bboxes


def _legacy_edge_contours(
    bgr: np.ndarray, gray: np.ndarray, w: int, h: int
) -> tuple[list[np.ndarray], list[tuple[int, int, int, int]]]:
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    th = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        15,
        3,
    )
    kernel = np.ones((3, 3), np.uint8)
    th = cv2.morphologyEx(th, cv2.MORPH_CLOSE, kernel, iterations=2)
    contours, _ = cv2.findContours(th, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    area_img = float(h * w)
    area_min = max(area_img * 0.003, 200.0)
    area_max = area_img * 0.42
    rings: list[np.ndarray] = []
    bboxes: list[tuple[int, int, int, int]] = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < area_min or area > area_max:
            continue
        peri = cv2.arcLength(cnt, True)
        if peri < 1e-6:
            continue
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) < 3:
            continue
        x, y, bw, bh = cv2.boundingRect(approx)
        pad = max(2, int(0.01 * max(bw, bh)))
        x0 = max(0, x - pad)
        y0 = max(0, y - pad)
        x1 = min(w, x + bw + pad)
        y1 = min(h, y + bh + pad)
        pts = approx.reshape(-1, 2).astype(np.float64)
        pts[:, 0] /= float(w)
        pts[:, 1] /= float(h)
        if not np.allclose(pts[0], pts[-1]):
            pts = np.vstack([pts, pts[0:1]])
        rings.append(pts)
        bboxes.append((x0, y0, x1 - x0, y1 - y0))
        if len(rings) >= _MAX_ROOMS:
            break
    return rings, bboxes


def _clean_ocr_line(text: str) -> str:
    line = text.strip().split("\n")[0] if text else ""
    line = re.sub(r"\s+", " ", line)
    return line[:120] if line else ""


def extract_room_labels_from_image(bgr: np.ndarray, bboxes: list[tuple[int, int, int, int]]) -> list[str]:
    _configure_tesseract()
    labels: list[str] = []
    for (x, y, bw, bh) in bboxes:
        if bw < 2 or bh < 2:
            labels.append("")
            continue
        roi = bgr[y : y + bh, x : x + bw]
        if roi.size == 0:
            labels.append("")
            continue
        try:
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
            _, bin_img = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            text = pytesseract.image_to_string(bin_img, config="--psm 6 -l eng")
            labels.append(_clean_ocr_line(text))
        except Exception as ex:  # noqa: BLE001
            logger.debug("OCR skipped for ROI: %s", ex)
            labels.append("")
    return labels


def _rings_to_feature_collection(
    rings: list[np.ndarray],
    labels: list[str],
) -> dict[str, Any]:
    features: list[dict[str, Any]] = []
    for i, ring in enumerate(rings):
        name = labels[i].strip() if i < len(labels) and labels[i].strip() else f"Room {i + 1}"
        rid = str(uuid.uuid4())
        coords = ring.astype(float).tolist()
        features.append(
            {
                "type": "Feature",
                "id": f"room-{rid}",
                "properties": {
                    "roomName": name,
                    "roomId": rid,
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coords],
                },
            }
        )
    return {"type": "FeatureCollection", "features": features}


def build_feature_collection_from_cv(image_bytes: bytes) -> dict[str, Any]:
    try:
        bgr = decode_image_to_bgr(image_bytes)
        if bgr is None:
            logger.warning("Could not decode image; returning mock GeoJSON.")
            return mock_geojson()

        rings, bboxes = detect_room_contours(bgr)
        if not rings:
            logger.info("No room contours detected; returning mock GeoJSON.")
            return mock_geojson()

        labels = extract_room_labels_from_image(bgr, bboxes)
        return _rings_to_feature_collection(rings, labels)
    except Exception:
        logger.exception("Floorplan CV pipeline failed; returning mock GeoJSON fallback.")
        return mock_geojson()


def mock_geojson() -> dict[str, Any]:
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": "mock-room-1",
                "properties": {
                    "roomName": "Conference A",
                    "roomId": "a1111111-1111-4111-8111-111111111111",
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [0.05, 0.05],
                            [0.45, 0.05],
                            [0.45, 0.45],
                            [0.05, 0.45],
                            [0.05, 0.05],
                        ]
                    ],
                },
            },
            {
                "type": "Feature",
                "id": "mock-room-2",
                "properties": {
                    "roomName": "Lab B",
                    "roomId": "b2222222-2222-4222-8222-222222222222",
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [0.55, 0.55],
                            [0.95, 0.55],
                            [0.95, 0.95],
                            [0.55, 0.95],
                            [0.55, 0.55],
                        ]
                    ],
                },
            },
        ],
    }
