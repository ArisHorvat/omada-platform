"""
Floorplan pipeline: dual Roboflow models (rooms + optional elements) → fused GeoJSON FeatureCollection.
"""

from __future__ import annotations

import logging
import os
import uuid
from typing import Any, TypedDict

import cv2
import numpy as np
from inference_sdk import InferenceHTTPClient
from numpy.typing import NDArray

logger = logging.getLogger(__name__)

_MAX_IMAGE_SIDE = 2000

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_MODEL_ID = os.getenv("ROBOFLOW_MODEL_ID", "nirwana/1")
ROBOFLOW_ELEMENTS_MODEL_ID = os.getenv("ROBOFLOW_ELEMENTS_MODEL_ID")

rf_client: InferenceHTTPClient | None = (
    InferenceHTTPClient(
        api_url="https://detect.roboflow.com",
        api_key=ROBOFLOW_API_KEY,
    )
    if ROBOFLOW_API_KEY
    else None
)


class FloorplanFeatureResult(TypedDict):
    """One polygon feature: normalized ring + model metadata."""

    ring: list[list[float]]
    confidence: float
    class_name: str


# ---------------------------------------------------------------------------
# Image I/O
# ---------------------------------------------------------------------------


def decode_image_to_bgr(image_bytes: bytes) -> NDArray[np.uint8] | None:
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


def _maybe_resize(bgr: NDArray[np.uint8]) -> NDArray[np.uint8]:
    h, w = bgr.shape[:2]
    m = max(h, w)
    if m <= _MAX_IMAGE_SIDE:
        return bgr
    scale = _MAX_IMAGE_SIDE / m
    return cv2.resize(bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


def _confidence_from_prediction(pred: dict[str, Any]) -> float:
    for key in ("confidence", "score", "class_confidence", "prediction_score"):
        v = pred.get(key)
        if v is not None:
            try:
                return float(min(1.0, max(0.0, float(v))))
            except (TypeError, ValueError):
                continue
    return 0.0


def _class_name_from_prediction(pred: dict[str, Any]) -> str:
    for key in ("class", "class_name", "label", "name"):
        v = pred.get(key)
        if v is not None and str(v).strip():
            return str(v).strip()
    return "feature"


def _parse_points_array(raw: Any) -> list[dict[str, Any]]:
    """Normalize points to a list of dicts with x, y keys."""
    if raw is None:
        return []
    if isinstance(raw, np.ndarray):
        raw = raw.tolist()
    if not isinstance(raw, list) or len(raw) == 0:
        return []
    out: list[dict[str, Any]] = []
    for p in raw:
        if isinstance(p, dict) and "x" in p and "y" in p:
            out.append(p)
        elif isinstance(p, (list, tuple)) and len(p) >= 2:
            out.append({"x": p[0], "y": p[1]})
    return out


def _points_to_normalized_closed_ring(
    points: list[dict[str, Any]],
    img_w: int,
    img_h: int,
) -> list[list[float]] | None:
    if img_w <= 0 or img_h <= 0:
        return None
    if len(points) < 3:
        return None
    ring: list[list[float]] = []
    for pt in points:
        try:
            px = float(pt["x"])
            py = float(pt["y"])
        except (KeyError, TypeError, ValueError):
            continue
        ring.append([px / float(img_w), py / float(img_h)])
    if len(ring) < 3:
        return None
    ax, ay = ring[0][0], ring[0][1]
    bx, by = ring[-1][0], ring[-1][1]
    if abs(ax - bx) > 1e-9 or abs(ay - by) > 1e-9:
        ring.append([ax, ay])
    return ring


def _pixel_xywh_if_normalized(
    cx: float,
    cy: float,
    bw: float,
    bh: float,
    img_w: int,
    img_h: int,
) -> tuple[float, float, float, float]:
    """If coords look normalized [0..1], scale to pixel space before corner math."""
    max_dim = max(abs(cx), abs(cy), abs(bw), abs(bh))
    if max_dim <= 1.0 + 1e-9 and img_w > 1 and img_h > 1:
        return cx * float(img_w), cy * float(img_h), bw * float(img_w), bh * float(img_h)
    return cx, cy, bw, bh


def _bbox_xywh_to_normalized_rect_ring(
    pred: dict[str, Any],
    img_w: int,
    img_h: int,
) -> list[list[float]] | None:
    """Object detection: center x/y, width/height → closed rectangular ring in normalized coords."""
    raw = [pred.get("x"), pred.get("y"), pred.get("width"), pred.get("height")]
    if None in raw:
        return None
    try:
        cx, cy, bw, bh = (float(raw[0]), float(raw[1]), float(raw[2]), float(raw[3]))
    except (TypeError, ValueError):
        return None
    if bw <= 0 or bh <= 0:
        return None

    pcx, pcy, pbw, pbh = _pixel_xywh_if_normalized(cx, cy, bw, bh, img_w, img_h)
    half_w, half_h = pbw / 2.0, pbh / 2.0
    x1 = pcx - half_w
    y1 = pcy - half_h
    x2 = pcx + half_w
    y2 = pcy + half_h

    def nxp(px: float) -> float:
        return px / float(img_w)

    def nyp(py: float) -> float:
        return py / float(img_h)

    return [
        [nxp(x1), nyp(y1)],
        [nxp(x2), nyp(y1)],
        [nxp(x2), nyp(y2)],
        [nxp(x1), nyp(y2)],
        [nxp(x1), nyp(y1)],
    ]


def _prediction_to_feature(
    pred: dict[str, Any],
    img_w: int,
    img_h: int,
) -> FloorplanFeatureResult | None:
    """Segmentation (`points`) or detection (x, y, width, height) → one feature dict."""
    pts_raw = pred.get("points")
    has_points = pts_raw is not None and (
        (isinstance(pts_raw, list) and len(pts_raw) > 0)
        or (isinstance(pts_raw, np.ndarray) and pts_raw.size > 0)
    )

    if has_points:
        pts = _parse_points_array(pts_raw)
        ring = _points_to_normalized_closed_ring(pts, img_w, img_h)
        if ring is None:
            return None
        return {
            "ring": ring,
            "confidence": _confidence_from_prediction(pred),
            "class_name": _class_name_from_prediction(pred),
        }

    if all(k in pred for k in ("x", "y", "width", "height")):
        ring = _bbox_xywh_to_normalized_rect_ring(pred, img_w, img_h)
        if ring is None:
            return None
        return {
            "ring": ring,
            "confidence": _confidence_from_prediction(pred),
            "class_name": _class_name_from_prediction(pred),
        }

    return None


def _unwrap_infer_result(result: Any) -> dict[str, Any] | None:
    if isinstance(result, list) and len(result) > 0:
        result = result[0]
    if not isinstance(result, dict):
        return None
    return result


def get_all_features_from_roboflow(image: np.ndarray) -> list[dict[str, Any]]:
    """
    Run one or two Roboflow models (rooms + optional elements) and merge all polygon features.

    Each item: ``{"ring": [[nx, ny], ...], "confidence": float, "class_name": str}``.
    Failures for a single model are logged; other models still run.
    """
    if rf_client is None:
        logger.warning("No Roboflow client initialized (set ROBOFLOW_API_KEY).")
        return []

    if image.ndim != 3 or image.shape[2] != 3:
        logger.warning("get_all_features_from_roboflow expected BGR HxWx3 uint8 image.")
        return []

    img_h, img_w = int(image.shape[0]), int(image.shape[1])

    models_to_run = [m for m in [ROBOFLOW_MODEL_ID, ROBOFLOW_ELEMENTS_MODEL_ID] if m]
    all_features: list[dict[str, Any]] = []

    for model_id in models_to_run:
        try:
            result = rf_client.infer(image, model_id=model_id)
        except Exception as exc:  # noqa: BLE001
            logger.error("Roboflow infer failed for model %s: %s", model_id, exc)
            continue

        payload = _unwrap_infer_result(result)
        if payload is None:
            logger.warning("Unexpected Roboflow response type for model %s: %s", model_id, type(result).__name__)
            continue

        predictions = payload.get("predictions", [])
        if not isinstance(predictions, list):
            continue

        for pred in predictions:
            if not isinstance(pred, dict):
                continue
            feat = _prediction_to_feature(pred, img_w, img_h)
            if feat is not None:
                all_features.append(feat)

    return all_features


def _features_to_feature_collection(features: list[dict[str, Any]]) -> dict[str, Any]:
    out_features: list[dict[str, Any]] = []
    for item in features:
        ring = item.get("ring")
        if not ring or not isinstance(ring, list):
            continue
        raw_name = item.get("class_name")
        room_name = (
            str(raw_name).strip()
            if raw_name is not None and str(raw_name).strip()
            else "feature"
        )
        conf = float(item.get("confidence") or 0.0)

        rid = str(uuid.uuid4())
        coords: list[list[float]] = [[float(p[0]), float(p[1])] for p in ring]
        out_features.append(
            {
                "type": "Feature",
                "id": f"floorplan-{rid}",
                "properties": {
                    "roomName": room_name,
                    "roomId": rid,
                    "confidence": round(min(1.0, max(0.0, conf)), 4),
                },
                "geometry": {"type": "Polygon", "coordinates": [coords]},
            }
        )
    return {"type": "FeatureCollection", "features": out_features}


def process_floorplan_hybrid(image_bytes: bytes) -> dict[str, Any]:
    """
    Decode image, run Roboflow room + optional elements models, return GeoJSON FeatureCollection.
    Returns an empty FeatureCollection if nothing was detected.
    """
    bgr = decode_image_to_bgr(image_bytes)
    if bgr is None:
        raise ValueError("Could not decode image bytes.")

    bgr = _maybe_resize(bgr)
    features = get_all_features_from_roboflow(bgr)
    if not features:
        return {"type": "FeatureCollection", "features": []}

    return _features_to_feature_collection(features)
