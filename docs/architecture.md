# MILKGUARD System Architecture

> **Notice & Scientific Disclaimer:**
> **Demo/engineering assessment only. Not a certified laboratory assay.**
> MILKGUARD evaluates multi-parameter sensor readings against user-configured reference ranges. Heuristic scoring and demonstration ML predictions detect physical parameter deviations for operational monitoring, but do not replace certified chromatography, Gerber fat tests, or laboratory safety assays.

---

## 1. End-to-End Data Pipeline

```
Farmer
  ↓ (Brings milk batch to collection station)
Milk Sample
  ↓ (Inserted into testing vessel / dock probe chamber)
ESP32 / Sensor Simulator  [Hardware-ready / Simulated in Demo Mode]
  ↓ (JSON telemetry via HTTP POST to /api/sensors/readings; MQTT planned for future)
Backend API (Express & Node.js)
  ↓ (Validates payload bounds & coordinates pipelines)
Quality Engine (Configurable Reference Range Matrix & Pricing Engine in ₹)
  ↓ (Computes parameter anomalies, penalties, demo score, and recommendations)
ML Service (FastAPI / Demo Heuristic Predictor) [Simulated in Demo Mode]
  ↓ (Asynchronously returns neutral prediction & confidence: null in demo mode)
Database (MongoDB Mongoose ORM / In-Memory Fallback Store)
  ↓ (Persists immutable test logs, ledger records, farmer totals, and alerts)
Dashboard (React + Vite + TypeScript)
    (Visualizes live telemetry, allows operator decisions, and displays ledger)
```

---

## 2. Component Breakdown & Simulation Matrix

| Layer | Technology | Operational Mode | Simulation Status in Demo Mode |
| :--- | :--- | :--- | :--- |
| **Farmer Intake** | Physical collection dock | Live Intake | Real workflows & farmer profiles |
| **IoT Node** | ESP32-WROOM-32 / ESP32-S3 | HTTP Telemetry (MQTT planned) | **Simulated** via Brownian-jitter generator with 5 presets |
| **Sensor Probes** | DS18B20, pH BNC, Optical, EC | Analog/Digital ADC | **Simulated** via realistic mathematical ranges |
| **Backend API** | Node.js, Express, TypeScript | RESTful API | **Live engine** with in-memory / MongoDB dual mode |
| **Quality Engine** | TypeScript Rule Engine | Configurable Matrices | **Live computational engine** (configurable ranges) |
| **ML Predictor** | Python 3.10+, FastAPI | REST `/predict` | **Demo Heuristic (`demo-heuristic-v1.0`)** with `confidence: null` |
| **Database** | MongoDB 6.0+ / Mongoose | Relational-like doc store | **Live MongoDB** or automatic in-memory mock store |
| **Frontend UI** | React 18, Vite, TypeScript | Single Page Application | **Live interactive UI** with full demo toggle |

---

## 3. Detailed Component Specifications

### 3.1 Sensor Array & ESP32 Telemetry
- **DS18B20:** 1-Wire digital temperature probe for intake thermal monitoring (15°C – 30°C optimal reference range).
- **pH Electrode (BNC / 4502C):** Measures hydrogen ion activity (configured standard: 6.5 – 6.8 pH).
- **Optical Turbidity / Fat Sensor:** Measures light attenuation at 940nm NIR wavelengths for fat percentage estimation (configured standard: 3.5% – 6.5%).
- **Specific Gravity Hydrometer:** Density measurement (configured standard: 1.026 – 1.034 g/mL).
- **Conductivity (EC) Sensor:** Measures electrical conductance to detect added mineral salts, water dilution, or neutralizers (configured standard: 4.0 – 6.0 mS/cm).
- **Load Cell (HX711):** Volume / weight intake measurement in Litres.

**ESP32 Payload Format:**
```json
{
  "deviceId": "ESP32-MILK-001",
  "temperature": 24.3,
  "ph": 6.64,
  "fat": 4.5,
  "density": 1.029,
  "conductivity": 5.1,
  "milkLevel": 25.0,
  "timestamp": "2026-09-07T06:15:00.000Z"
}
```

### 3.2 Backend Service Architecture (`backend/`)
- Built on Node.js / Express with TypeScript.
- **`sensorService.ts`**: Ingests, validates, and buffers hardware probe telemetry.
- **`qualityService.ts`**: Implements the modular quality engine. Computes parameter assessments, quality classification (`EXCELLENT`, `GOOD`, `SUSPICIOUS`, `REJECT`), warning annotations, and transparent Indian Rupee (₹) procurement pricing.
- **`mlService.ts`**: Handles integration with the Python ML microservice with failover to local rules.
- **Storage Layer**: Dual-mode data access using Mongoose models when MongoDB is connected, and structured in-memory caches when running without a database.

### 3.3 Python ML Microservice (`ml-service/`)
- FastAPI application exposing `POST /predict` and `GET /health`.
- Configurable CORS origins via `CORS_ORIGINS` environment variable.
- In demo mode, evaluates inputs using `demo-heuristic-v1.0`, returning `prediction: "DEMO_NORMAL"` or `"DEMO_ANOMALY"` with `confidence: null` to avoid misleading scientific claims.
- Designed as an extensible contract ready to load scikit-learn (`joblib`) or ONNX models trained on laboratory-validated dairy datasets.

### 3.4 Frontend React Dashboard (`frontend/`)
- Built with React 18, Vite, TypeScript, and Vanilla CSS/Tailwind utility architecture.
- Full offline standalone capability with `DemoDataContext` storing test history, collections, alerts, and farmer registries.
- Real-time sensor simulation with continuous sampling ticks, preset profiles, parameter diagnostic tables, and transparent pricing cards.
