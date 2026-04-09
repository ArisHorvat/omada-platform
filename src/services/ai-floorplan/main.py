"""
Omada AI floorplan microservice (FastAPI).

Run locally:
  cd src/services/ai-floorplan
  python -m venv .venv
  .venv\\Scripts\\activate   # Windows
  pip install -r requirements.txt
  uvicorn main:app --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import uvicorn
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

from app.processing import build_feature_collection_from_cv

app = FastAPI(
    title="Omada AI Floorplan",
    description="Processes uploaded floorplan images and returns GeoJSON FeatureCollections.",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/process-floorplan")
async def process_floorplan(file: UploadFile = File(...)) -> JSONResponse:
    """
    Accepts a raster floorplan image (multipart field name: ``file``).
    Returns a GeoJSON FeatureCollection (mock data until CV/OCR is implemented).
    """
    data = await file.read()
    payload = build_feature_collection_from_cv(data)
    return JSONResponse(content=payload)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
