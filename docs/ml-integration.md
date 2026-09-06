# Machine Learning Integration Architecture

## 1. Machine Learning Life-Cycle

```
┌───────────────────────────────────────────────┐
│ 1. Laboratory Sensor Data Collection          │
│    - Certified pure cow/buffalo milk          │
│    - Controlled adulterant samples:           │
│      * Water dilution (5% - 40%)              │
│      * Urea / Ammonium sulphate               │
│      * Detergent / Soap neutralizer           │
│      * Starch / Maltodextrin                  │
│      * Sodium hydroxide / Carbonates          │
└───────────────────────┬───────────────────────┘
                        ▼
┌───────────────────────────────────────────────┐
│ 2. Feature Engineering & Training             │
│    - Features: [temp, ph, fat, density, ec]   │
│    - Model: XGBoost / Random Forest Classifier│
│    - Output: [Class, Probabilities, Severity] │
└───────────────────────┬───────────────────────┘
                        ▼
┌───────────────────────────────────────────────┐
│ 3. Microservice Inference (FastAPI)           │
│    - /predict endpoint                        │
│    - Sub-millisecond latency                  │
│    - Output contract consumed by Node.js API  │
└───────────────────────────────────────────────┘
```

---

## 2. API Data Contract

### Request Payload:
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

### ML Service Response:
```json
{
  "prediction": "PURE",
  "confidence": 0.98,
  "score": 96.4,
  "warnings": [],
  "is_mock": false,
  "model_version": "xgb-adulteration-v2.1"
}
```

---

## 3. Training Script Template

```python
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib

# Load collected dairy telemetry dataset
df = pd.read_csv('dairy_sensor_dataset.csv')
X = df[['temperature', 'ph', 'fat', 'density', 'conductivity']]
y = df['quality_label'] # 0: PURE, 1: WATER_ADULTERATED, 2: NEUTRALIZER, 3: LOW_FAT

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=150, max_depth=8, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))

joblib.dump(model, 'ml-service/model/milk_purity_model.joblib')
print("Model saved to ml-service/model/milk_purity_model.joblib")
```
