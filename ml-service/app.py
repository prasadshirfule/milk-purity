"""
Milk Purity Machine Learning Microservice
FastAPI inference service for milk quality, purity score, and adulteration prediction.

NOTE: This service implements a structured demonstration predictor.
Replace the `mock_predict()` routine with your trained scikit-learn / XGBoost / PyTorch
pipeline once calibrated against physical laboratory spectrometer and chemical assays.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import uvicorn

app = FastAPI(
    title="Milk Purity ML Prediction Service",
    description="Inference API for sensor-based milk purity and adulteration assessment",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
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
    confidence: float
    score: float
    warnings: List[str]
    is_mock: bool = True
    model_version: str = "demo-heuristic-v1.0"

@app.get("/")
def health_check():
    return {
        "service": "Milk Purity ML Microservice",
        "status": "ready",
        "model_loaded": False,
        "mode": "DEMO_PREDICTION_MODE"
    }

@app.post("/predict", response_model=PredictionResponse)
def predict_milk_purity(payload: SensorPayload):
    """
    Evaluates sensor parameters using heuristic & trained decision boundaries.
    """
    warnings = []
    anomaly_detected = False

    # Standard Dairy Parameter Validation Checks
    if payload.ph < 6.4 or payload.ph > 6.9:
        warnings.append(f"pH {payload.ph} outside normal physiological limits (6.5 - 6.8)")
        anomaly_detected = True

    if payload.conductivity > 6.2:
        warnings.append(f"Conductivity {payload.conductivity} mS/cm indicates high ionic dissolved solids")
        anomaly_detected = True

    if payload.density < 1.026:
        warnings.append(f"Density {payload.density} g/mL is below milk standard (suspected water addition)")
        anomaly_detected = True

    if payload.fat < 3.2:
        warnings.append(f"Fat content {payload.fat}% below minimum statutory quality cutoff")

    if anomaly_detected:
        return PredictionResponse(
            prediction="ADULTERATION_SUSPECTED",
            confidence=0.91,
            score=54.5,
            warnings=warnings,
            is_mock=True,
            model_version="demo-heuristic-v1.0"
        )

    return PredictionResponse(
        prediction="PURE",
        confidence=0.97,
        score=94.8,
        warnings=warnings,
        is_mock=True,
        model_version="demo-heuristic-v1.0"
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
