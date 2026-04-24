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

from dotenv import load_dotenv

load_dotenv()

import logging

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.processing import process_floorplan_hybrid

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Omada AI Floorplan",
    description="Processes uploaded floorplan images and returns GeoJSON FeatureCollections.",
    version="0.3.0",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/process-floorplan")
async def process_floorplan(file: UploadFile = File(...)) -> JSONResponse:
    """
    Accepts a raster floorplan image.
    Sends it to Roboflow for segmentation and returns the GeoJSON FeatureCollection.
    """
    try:
        data = await file.read()
        payload = process_floorplan_hybrid(data)
        
        # --- ADD THESE TWO LINES ---
        import json
        print("\n=== AI OUTPUT ===")
        print(json.dumps(payload, indent=2))
        print("=================\n")
        
        return JSONResponse(content=payload)
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
