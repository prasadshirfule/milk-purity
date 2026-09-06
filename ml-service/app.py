"""
MilkGuard Machine Learning Microservice
FastAPI inference service for milk quality and parameter anomaly prediction.

NOTE: This service implements a structured demonstration predictor.
It returns neutral demonstration classifications (DEMO_NORMAL / DEMO_ANOMALY)
with `confidence: null` until calibrated against certified physical laboratory assays.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import uvicorn

app = FastAPI(
    title="MilkGuard ML Prediction Service",
    description="Demonstration API for sensor-based parameter assessment (Demo/Engineering only)",
    version="1.0.0"
)

# Configurable CORS Origins
cors_origins_env = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:5000,http://127.0.0.1:5173,http://127.0.0.1:5000")
allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

class SensorPayload(BaseModel):
    deviceId: Optional[str] = "ESP32-MILK-001"
    temperature: float = Field(..., description="Temperature in °C")
    ph: float = Field(..., description="Milk pH value")
    fat: float = Field(..., description="Fat percentage (%)")
    density: float = Field(..., description="Density in g/mL")
    conductivity: float = Field(..., description="Electrical conductivity in mS/cm")
    milkLevel: Optional[float] = Field(0.0, description="Container volume in Litres")

class PredictionResponse(BaseModel):
    prediction: str
    confidence: Optional[float] = None  # null in demo mode per specification
    score: float
    warnings: List[str]
    is_mock: bool = True
    model_version: str = "demo-heuristic-v1.0"
    disclaimer: str = "Demo/engineering assessment only. Not a certified laboratory assay."

@app.get("/")
def health_check():
    return {
        "service": "MilkGuard ML Microservice",
        "status": "ready",
        "model_loaded": False,
        "mode": "DEMO_PREDICTION_MODE",
        "disclaimer": "Demo/engineering assessment only. Not a certified laboratory assay."
    }

@app.post("/predict", response_model=PredictionResponse)
def predict_milk_purity(payload: SensorPayload):
    """
    Evaluates sensor parameters using heuristic demonstration boundaries.
    Returns neutral classifications: DEMO_NORMAL or DEMO_ANOMALY.
    """
    warnings = []
    anomaly_detected = False

    # Configured reference range checks
    if payload.ph < 6.4 or payload.ph > 6.9:
        warnings.append(f"pH ({payload.ph}) outside configured reference range (6.5 - 6.8). Requires laboratory verification.")
        anomaly_detected = True

    if payload.conductivity > 6.2:
        warnings.append(f"Conductivity ({payload.conductivity} mS/cm) elevated above baseline. Requires secondary laboratory testing.")
        anomaly_detected = True

    if payload.density < 1.026:
        warnings.append(f"Density ({payload.density} g/mL) below configured reference range. Parameter anomaly detected.")
        anomaly_detected = True

    if payload.fat < 3.2:
        warnings.append(f"Fat content ({payload.fat}%) below minimum configured baseline cutoff.")

    if anomaly_detected:
        return PredictionResponse(
            prediction="DEMO_ANOMALY",
            confidence=None,  # Neutral demo state
            score=54.5,
            warnings=warnings,
            is_mock=True,
            model_version="demo-heuristic-v1.0",
            disclaimer="Demo/engineering assessment only. Not a certified laboratory assay."
        )

    return PredictionResponse(
        prediction="DEMO_NORMAL",
        confidence=None,  # Neutral demo state
        score=94.8,
        warnings=warnings,
        is_mock=True,
        model_version="demo-heuristic-v1.0",
        disclaimer="Demo/engineering assessment only. Not a certified laboratory assay."
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
