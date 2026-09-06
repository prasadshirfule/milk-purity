# Machine Learning Integration Architecture

> **Notice & Scientific Disclaimer:**
> **Demo/engineering assessment only. Not a certified laboratory assay.**
> The current ML microservice provides baseline heuristic classifications (`demo-heuristic-v1.0`) with `confidence: null` in demonstration mode. Physical multi-sensor anomaly detection provides screening indicators against configured reference ranges, but cannot replace certified dairy analytical chromatography or microbiological testing.

---

## 1. Current Implementation vs Future Scope

| Dimension | Current Implementation (Demo) | Future Production Scope |
| :--- | :--- | :--- |
| **Engine** | Heuristic parameter evaluation rules (`demo-heuristic-v1.0`) | Scikit-Learn / XGBoost / ONNX trained classifier |
| **Prediction Label** | `DEMO_NORMAL` / `DEMO_ANOMALY` | Multi-class anomaly classification (`NORMAL`, `DILUTION_SUSPECTED`, etc.) |
| **Confidence Score** | `null` (Demo mode avoids misleading scientific certainty) | Calculated softmax probability / confidence $(0.00 - 1.00)$ |
| **Service Status** | `is_mock: true` | `is_mock: false` with loaded `.joblib` model |
| **CORS Policy** | Configurable via `CORS_ORIGINS` environment variable | Restrictive origin whitelist for frontend domain |

---

## 2. API Data Contract

### Prediction Request Payload (`POST /predict`):
```json
{
  "deviceId": "ESP32-MILK-001",
  "temperature": 24.2,
  "ph": 6.64,
  "fat": 4.5,
  "density": 1.029,
  "conductivity": 5.1,
  "milkLevel": 20.0
}
```

### Current Demo ML Service Response:
```json
{
  "prediction": "DEMO_NORMAL",
  "confidence": null,
  "score": 100.0,
  "warnings": [],
  "is_mock": true,
  "model_version": "demo-heuristic-v1.0",
  "disclaimer": "Demo/engineering assessment only. Not a certified laboratory assay."
}
```

### Anomaly Case Response:
```json
{
  "prediction": "DEMO_ANOMALY",
  "confidence": null,
  "score": 45.0,
  "warnings": [
    "Density anomaly detected (1.021 g/mL). Reference range is 1.026 - 1.034 g/mL.",
    "Conductivity outside configured reference range (7.2 mS/cm). Secondary laboratory testing advised."
  ],
  "is_mock": true,
  "model_version": "demo-heuristic-v1.0",
  "disclaimer": "Demo/engineering assessment only. Not a certified laboratory assay."
}
```

---

## 3. Future Model Training Pipeline

When laboratory-validated reference datasets are collected, a real scikit-learn model can be trained using this pipeline:

```python
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib

# 1. Load laboratory-validated dairy sensor readings
# Features: Temperature (°C), pH, Fat (%), Density (g/mL), Electrical Conductivity (mS/cm)
df = pd.read_csv('laboratory_validated_dairy_dataset.csv')
X = df[['temperature', 'ph', 'fat', 'density', 'conductivity']]
y = df['quality_label'] # 0: NORMAL, 1: DILUTION_ANOMALY, 2: HIGH_CONDUCTIVITY_ANOMALY, 3: SOUR_ANOMALY

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 2. Train classifier
model = RandomForestClassifier(n_estimators=150, max_depth=8, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))

# 3. Export model binary for microservice loading
joblib.dump(model, 'ml-service/model/milk_quality_model.joblib')
print("Model saved to ml-service/model/milk_quality_model.joblib")
```

---

## 4. Microservice Model Loading (Production Hook)

In `ml-service/app.py`, connecting a trained model simply replaces the heuristic branch:

```python
import os
import joblib

MODEL_PATH = "model/milk_quality_model.joblib"
trained_model = None

if os.path.exists(MODEL_PATH):
    try:
        trained_model = joblib.load(MODEL_PATH)
        print(f"Loaded trained model from {MODEL_PATH}")
    except Exception as e:
        print(f"Failed to load model: {e}")
```
