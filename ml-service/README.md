# Milk Purity ML Prediction Microservice

This microservice provides automated quality classification and adulteration prediction based on multi-sensor telemetry (temperature, pH, fat %, density, and conductivity).

## Current Status
Currently running in **Demonstration Mode (`is_mock: true`)**.
Heuristic dairy science rules are used to return realistic inferences until calibrated laboratory training data is integrated.

---

## How to Integrate a Real Machine Learning Model

1. **Collect & Label Training Data**:
   - Collect sensor readings paired with laboratory Gerber/MilkoTester assays and adulteration tests (e.g., water, urea, detergent, neutralizers, starch).
   - Features: `['temperature', 'ph', 'fat', 'density', 'conductivity']`.
   - Targets: `classification` (e.g., `0: Pure`, `1: Diluted`, `2: Neutralized`, `3: Low-Fat`).

2. **Train Model (e.g., Random Forest or XGBoost)**:
   ```python
   import joblib
   from sklearn.ensemble import RandomForestClassifier

   clf = RandomForestClassifier(n_estimators=100, max_depth=6)
   clf.fit(X_train, y_train)
   joblib.dump(clf, "model/milk_purity_model.joblib")
   ```

3. **Load Model in `app.py`**:
   ```python
   import joblib
   model = joblib.load("model/milk_purity_model.joblib")

   @app.post("/predict")
   def predict(payload: SensorPayload):
       features = [[payload.temperature, payload.ph, payload.fat, payload.density, payload.conductivity]]
       pred_class = model.predict(features)[0]
       probs = model.predict_proba(features)[0]
       ...
   ```

---

## Running the Microservice Locally

```bash
cd ml-service
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
