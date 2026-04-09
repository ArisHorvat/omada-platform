"""
Computer-vision pipeline: detect closed regions on floorplan images, OCR labels, emit GeoJSON.

Falls back to :func:`mock_geojson` when no usable contours are found or decode fails.
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


def _configure_tesseract() -> None:
    """Point pytesseract at the binary when it is not on PATH (common on Windows)."""
    if shutil.which("tesseract"):
        return
    for candidate in (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    ):
        if os.path.isfile(candidate):
            pytesseract.pytesseract.tesseract_cmd = candidate
            logger.info("Using Tesseract at %s", candidate)
            return


def decode_image_to_bgr(image_bytes: bytes) -> np.ndarray | None:
    """Decode raw upload bytes to a BGR ndarray; returns None if decode fails."""
    if not image_bytes:
        return None
    buf = np.frombuffer(image_bytes, dtype=np.uint8)
    bgr = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    return bgr


def _maybe_resize(bgr: np.ndarray) -> np.ndarray:
    h, w = bgr.shape[:2]
    m = max(h, w)
    if m <= _MAX_IMAGE_SIDE:
        return bgr
    scale = _MAX_IMAGE_SIDE / m
    return cv2.resize(bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


def detect_room_contours(bgr: np.ndarray) -> tuple[list[np.ndarray], list[tuple[int, int, int, int]]]:
    """
    Find closed regions (candidate rooms) via adaptive threshold + contours.

    Returns:
        rings: each Nx2 float array of normalized [0..1] x,y, closed (first == last).
        bboxes: pixel-space (x, y, w, h) ROIs for OCR, aligned with rings.
    """
    bgr = _maybe_resize(bgr)
    h, w = bgr.shape[:2]
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
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

    contours, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
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
    """
    Run Tesseract on each bounding ROI. Returns one label string per box (may be empty).
    """
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
    """Decode → contours → OCR → GeoJSON; uses mock data when CV yields nothing useful."""
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


def mock_geojson() -> dict[str, Any]:
    """
    Valid GeoJSON FeatureCollection (two room polygons) for tests / empty CV results.

    Coordinates are normalized [0..1] in image space for Omada floorplan overlay.
    """
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
