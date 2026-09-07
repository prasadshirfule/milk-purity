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
    purity_score: float
    ai_recommendation: str  # ACCEPT | REVIEW | REJECT
    classification: str     # EXCELLENT | GOOD | WARNING | POOR
    score_explanation: List[str]
    warnings: List[str]
    is_mock: bool = True
    model_version: str = "screening-baseline-v1"
    disclaimer: str = "Milk Purity Score is an automated quality-screening estimate based on measured parameters. It is not a substitute for laboratory adulteration testing."

@app.get("/")
def health_check():
    return {
        "service": "MilkGuard ML Microservice",
        "status": "ready",
        "model_loaded": False,
        "mode": "DEMO_SCREENING_MODE",
        "model_version": "screening-baseline-v1",
        "disclaimer": "Milk Purity Score is an automated quality-screening estimate based on measured parameters. It is not a substitute for laboratory adulteration testing."
    }

@app.post("/predict", response_model=PredictionResponse)
def predict_milk_purity(payload: SensorPayload):
    """
    Evaluates sensor parameters using normalized baseline screening boundaries.
    Returns Purity Score (0-100), AI Recommendation (ACCEPT/REVIEW/REJECT), and parameter observations.
    """
    warnings = []
    observations = []
    penalty = 0

    # pH check
    if 6.5 <= payload.ph <= 6.8:
        observations.append(f"✓ pH within configured reference range ({payload.ph})")
    elif 6.4 <= payload.ph <= 6.9:
        penalty += 15
        warnings.append(f"pH ({payload.ph}) slightly outside configured reference range (6.5 - 6.8).")
        observations.append(f"⚠ pH ({payload.ph}) borderline")
    else:
        penalty += 35
        warnings.append(f"pH ({payload.ph}) significantly outside configured reference range (6.5 - 6.8). Requires laboratory verification.")
        observations.append(f"⚠ Extreme pH ({payload.ph}) deviation detected")

    # Conductivity check
    if payload.conductivity <= 5.5:
        observations.append(f"✓ Electrical Conductivity within reference baseline ({payload.conductivity} mS/cm)")
    elif payload.conductivity <= 6.2:
        penalty += 12
        warnings.append(f"Conductivity ({payload.conductivity} mS/cm) slightly elevated above reference baseline.")
        observations.append(f"⚠ Conductivity ({payload.conductivity} mS/cm) elevated")
    else:
        penalty += 35
        warnings.append(f"Conductivity ({payload.conductivity} mS/cm) elevated above baseline. Secondary laboratory verification advised.")
        observations.append(f"⚠ High Conductivity ({payload.conductivity} mS/cm) detected")

    # Density check
    if 1.026 <= payload.density <= 1.034:
        observations.append(f"✓ Density within configured reference range ({payload.density} g/mL)")
    elif 1.023 <= payload.density <= 1.036:
        penalty += 18
        warnings.append(f"Density ({payload.density} g/mL) deviates from reference range (1.026 - 1.034 g/mL).")
        observations.append(f"⚠ Density deviation ({payload.density} g/mL)")
    else:
        penalty += 40
        warnings.append(f"Density ({payload.density} g/mL) severely outside configured reference range. Parameter anomaly detected.")
        observations.append(f"⚠ Severe density anomaly ({payload.density} g/mL)")

    # Fat check
    if payload.fat >= 3.5:
        observations.append(f"✓ Estimated Fat within configured reference range ({payload.fat}%)")
    elif payload.fat >= 3.0:
        penalty += 10
        warnings.append(f"Estimated Fat ({payload.fat}%) below configured minimum baseline (3.5%).")
        observations.append(f"⚠ Low Estimated Fat ({payload.fat}%)")
    else:
        penalty += 25
        warnings.append(f"Estimated Fat ({payload.fat}%) severely below configured baseline.")
        observations.append(f"⚠ Severely low Estimated Fat ({payload.fat}%)")

    # Temperature check
    if 15.0 <= payload.temperature <= 30.0:
        observations.append(f"✓ Temperature within configured chilling range ({payload.temperature} °C)")
    else:
        observations.append(f"⚠ Intake temperature ({payload.temperature} °C) outside optimal chilling range")

    score = max(0.0, min(100.0, round(100.0 - penalty, 1)))

    if score >= 90.0:
        classification = "EXCELLENT"
        ai_recommendation = "ACCEPT"
    elif score >= 75.0:
        classification = "GOOD"
        ai_recommendation = "ACCEPT"
    elif score >= 60.0:
        classification = "WARNING"
        ai_recommendation = "REVIEW"
    else:
        classification = "POOR"
        ai_recommendation = "REJECT"

    prediction_tag = "DEMO_NORMAL" if ai_recommendation == "ACCEPT" else "DEMO_ANOMALY"

    return PredictionResponse(
        prediction=prediction_tag,
        confidence=None,  # Neutral demo state (no fake confidence)
        score=score,
        purity_score=score,
        ai_recommendation=ai_recommendation,
        classification=classification,
        score_explanation=observations,
        warnings=warnings,
        is_mock=True,
        model_version="screening-baseline-v1",
        disclaimer="Milk Purity Score is an automated quality-screening estimate based on measured parameters. It is not a substitute for laboratory adulteration testing."
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
