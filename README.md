# MILKGUARD — Smart Milk Quality & Dairy Management

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-teal.svg)](https://fastapi.tiangolo.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

> ### ⚠️ Scientific & Engineering Notice
> **Demo/engineering assessment only. Not a certified laboratory assay.**
> MILKGUARD evaluates multi-parameter sensor readings (pH, fat, density, conductivity, temperature) against user-configured reference ranges. Heuristic quality scores and demonstration ML predictions are provided for proof-of-concept and operational monitoring. They do not substitute official certified dairy laboratory chromatography or regulatory food safety assays.

---

## 📌 Project Overview

**MILKGUARD** is an end-to-end IoT dairy quality assurance and collection ledger platform built for rural milk collection centers, co-operatives, and dairy processing units. It captures multi-sensor telemetry from ESP32 hardware or simulation presets, calculates transparent farmer procurement payouts in Indian Rupees (₹), tracks supplier accounts, detects parameter anomalies, and provides interfaces for Python machine learning inference.

---

## 📸 Screenshots & UI Preview

| Dashboard Overview | Live Milk Quality Testing Dock |
| :---: | :---: |
| *(Add Dashboard Screenshot Here)* | *(Add Testing Screen Screenshot Here)* |

| Parameter Diagnostic Matrix | IoT Device Telemetry & Probes |
| :---: | :---: |
| *(Add Matrix Screenshot Here)* | *(Add IoT Hardware Screen Screenshot Here)* |

---

## 🌟 Key Features

1. **🥛 Multi-Sensor IoT Telemetry & Simulation**:
   - Continuous real-time ingestion of 6 parameters: Temperature (°C), pH, Fat (%), Density (g/mL), Electrical Conductivity (mS/cm), and Volume (L).
   - High-fidelity simulation mode with Brownian jitter and 5 distinct presets (Pure Cow, High-Fat Buffalo, Dilution Anomaly, Sour Milk, High Conductivity).
   - Direct HTTP POST and MQTT streaming endpoints for physical ESP32 nodes.

2. **🧪 Configurable Quality & Anomaly Engine**:
   - Multi-parameter compliance engine evaluating against customizable dairy reference ranges.
   - Quality classifications: `EXCELLENT`, `GOOD`, `SUSPICIOUS`, `REJECT`.
   - Clear flags for parameter deviations with advisory notes recommending secondary laboratory verification.

3. **💰 Transparent Farmer Ledger & Indian Rupee (₹) Pricing**:
   - Automated rate computation based on base rate + fat-tier premium bonus:
     $$\text{Rate (₹/L)} = (\text{BaseRate} + (\text{Fat} - \text{FatMin}) \times \text{PremiumFactor}) \times \text{QualityFactor}$$
   - Immutable collection logs and automated payment status tracking.

4. **👨‍🌾 Farmer Registry & Herd Profiles**:
   - Detailed supplier profiles (Cow, Buffalo, Mixed), village geolocation, lifetime supply metrics, and average quality scores.

5. **📊 Advanced Analytics & Audit Reports**:
   - Daily intake volume trends, rejection audits, parameter correlation charts, and printable/CSV report export.

6. **📡 IoT Device Health & Probes Monitoring**:
   - Multi-bay ESP32 hardware status monitoring, probe electrode health tracking, heartbeat monitoring, and automated alerts.

7. **⚡ Zero-Hardware Demo Mode**:
   - Fully standalone operation with in-memory persistence and mock seeds. Zero external dependencies required to test all features.

---

## 🏛️ System Architecture

```
Farmer
  ↓ (Delivers batch to dock)
Milk Sample
  ↓ (Inserted into sensor testing vessel)
ESP32 / Sensor Simulator  [Simulated in Demo Mode]
  ↓ (Pushes JSON telemetry to /api/sensors/stream)
Backend API (Node.js & Express)
  ↓ (Validates payload bounds & coordinates pipelines)
Quality Engine (Configurable Reference Range Matrix & Pricing in ₹)
  ↓ (Computes parameter anomalies, penalties, demo score, and advice)
ML Service (FastAPI / Demo Heuristic Predictor) [Simulated in Demo Mode]
  ↓ (Returns DEMO_NORMAL / DEMO_ANOMALY with confidence: null in demo mode)
Database (MongoDB / In-Memory Mock Store)
  ↓ (Persists test logs, ledger records, farmer totals, and alerts)
Dashboard (React + Vite + TypeScript)
    (Visualizes telemetry, operator decisions, and dairy ledger)
```

For full details, see [docs/architecture.md](docs/architecture.md).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Lucide Icons, Recharts, React Router v6 |
| **Backend** | Node.js, Express, TypeScript, Mongoose, In-Memory Mock Fallback |
| **Machine Learning** | Python 3.10+, FastAPI, Uvicorn, Scikit-Learn (inference ready) |
| **IoT Hardware** | ESP32-WROOM-32, DS18B20 Temp, BNC pH Electrode, EC Probe, HX711 Load Cell |
| **Testing** | Node.js Test Runner, `tsx`, automated QualityService test suites |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Python 3.10+ *(optional, for ML microservice)*

---

### 2. Single-Command Root Development

Run both the frontend and backend together from the workspace root:

```bash
# 1. Install root dependencies
npm install

# 2. Start full development stack (Frontend :5173 + Backend :5000)
npm run dev
```

- **Frontend Dashboard**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:5000`

---

### 3. Individual Component Commands

#### Running Frontend Only
```bash
cd frontend
npm install
npm run dev
```

#### Running Backend Only
```bash
cd backend
npm install
npm run dev
# Run automated backend test suite
npm test
```

#### Running Python ML Service (Optional)
```bash
cd ml-service
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --port 8000 --reload
```

---

## 🔑 Operator Demo Login

- **URL**: `http://localhost:5173/login`
- **Operator Email**: `operator@amritdairy.com`
- **Password**: `dairy2026`
- *(Or click **"1-Click Demo Operator Login"** on the login screen)*

---

## 📡 REST API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend health & uptime check |
| `GET` | `/api/summary` | Dashboard metrics & collection summaries |
| `POST` | `/api/sensors/stream` | Ingest live JSON telemetry from ESP32 |
| `GET` | `/api/sensors/latest` | Retrieve latest sensor reading |
| `POST` | `/api/tests` | Log a milk quality test & calculate pricing |
| `GET` | `/api/tests` | Query historical milk tests with pagination |
| `GET` | `/api/farmers` | List registered farmers |
| `POST` | `/api/farmers` | Register a new farmer |
| `GET` | `/api/collections` | Fetch milk collection ledger |
| `GET` | `/api/devices` | Monitor IoT devices and probe health |
| `GET` | `/api/settings` | Read configured dairy reference thresholds |
| `PUT` | `/api/settings` | Update thresholds and pricing parameters |
| `POST` | `/api/ml/predict` | Proxy milk quality prediction to ML service |

---

## 🧪 Automated Testing

Automated unit tests validate parameter anomaly boundaries, quality scoring penalties, pricing formulas, and payload validation:

```bash
# Run tests from root
npm test

# Run tests directly in backend
cd backend
npm test
```

---

## 🔬 Scientific Limitations & Roadmap

1. **Scientific Boundaries**: Sensor-based screening flags deviations in conductivity, density, pH, and optical turbidity. Definitive determination of complex synthetic adulterants (e.g. melamine, detergent) requires laboratory spectrometry.
2. **TinyML Edge Inference**: Future integration will port quantized ONNX/TensorFlow Lite models directly to ESP32-S3 boards.
3. **Automated Thermal Printing**: Direct ESC/POS dock receipt printing for instant farmer delivery slips.
4. **SMS Gateway Ledger**: Automated delivery receipts dispatched via SMS to farmers upon collection.

---

## 📄 License

This project is licensed under the ISC License. Developed by **MILKGUARD Systems**.
