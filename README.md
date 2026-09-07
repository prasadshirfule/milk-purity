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

## 🌟 Key Functional Modules & Architecture

1. **📊 Main Operational Dashboard (`/dashboard`)**:
   - 8 live KPI summary cards: Total Farmers, Today's Intake (L), Accepted Milk (L), Rejected Milk (L), Revenue (₹), Average Estimated Fat %, Quality Score, and Active Alerts.
   - Quality screening distribution overview (`ACCEPTED`, `WARNING`, `REJECTED`).
   - Dynamic intake volume area chart computed directly from recorded collection logs.
   - Dual-column operational tables for Recent Quality Tests & Recent Collection ledger entries with detailed modal inspect.

2. **👨‍🌾 Farmers Registry & Supplier Profiles (`/farmers`, `/farmers/:id`)**:
   - Complete supplier registry with search, animal type filter, and instant registration modal.
   - Comprehensive Farmer Details page showing contact details, lifetime milk volume delivered, lifetime procurement payout in ₹, tests breakdown, complete delivery test history, and procurement ledger statement.

3. **🥛 Milk Testing Station (`/milk-testing`)**:
   - Multi-parameter live testing station supporting Temperature (°C), Estimated Fat (%), pH, Density (g/mL), Electrical Conductivity (mS/cm), and Volume (L).
   - Real-time parameter anomaly evaluation with reference range deviation indicators.
   - Configurable operator decision workflow (`ACCEPT` / `REJECT` / `MANUAL OVERRIDE`) with mandatory audit reason capture.

4. **📜 Test History & Audit Trail (`/history`)**:
   - Comprehensive test history with multi-filter search (date range, farmer, result status).
   - Parameter drilldown modal and one-click CSV export for compliance reporting.

5. **📦 Milk Collections (`/collection`)**:
   - Centralized dairy procurement ledger linking accepted tests to collection records.
   - Prevents duplicate collection records and calculates accurate rate/payouts in ₹.

6. **💳 Payments & Farmer Ledger (`/ledger`)**:
   - Transparent supplier accounts showing Opening Balance, Milk Amount, Payouts, and Balance.
   - Individual farmer ledger statements, payment status tracking (`PAID`, `PENDING`), and CSV export.
   - Clearly labeled as internal procurement accounting (no fake bank gateway claims).

7. **📈 Dedicated Analytics Engine (`/analytics`)**:
   - Time-horizon filtering (Today, 7 Days, 30 Days, All-Time).
   - Intake Volume & Procurement Cost trends, Average Quality Score & Estimated Fat % trends.
   - Quality classification breakdown pie charts, top contributing farmers bar chart, and sensor benchmark compliance metrics.

8. **📡 IoT Devices & Sensor Telemetry (`/devices`, `/devices/:id`)**:
   - Real-time probe and dock status for ESP32 testing stations.
   - Clearly labeled simulated node telemetry with REST schema documentation (`POST /api/sensors/readings`).
   - Architecture ready for physical hardware deployment.

9. **📑 Comprehensive Reports (`/reports`)**:
   - Tabulated daily, monthly, farmer-wise, sensor audit, and quality rejection reports.
   - Instant CSV export and print-ready summary tables.

10. **⚙️ Quality & Pricing Settings (`/settings`)**:
    - Configurable reference ranges for all 5 physical parameters.
    - Transparent pricing tier rules (base rate, fat premium multiplier, penalty deductions).
    - System mode toggle between Demo Mode and Connected Mode.

11. **ℹ️ System Specifications & Architecture (`/about`)**:
    - In-depth technical documentation covering sensor methodology, scoring formulas, scientific limitations, and roadmap.

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
| `GET` | `/api/dashboard/summary` | Dashboard metrics & collection summaries (alias: `/api/summary`) |
| `POST` | `/api/sensors/readings` | Ingest live JSON telemetry from ESP32 |
| `GET` | `/api/sensors/latest` | Retrieve latest sensor reading |
| `POST` | `/api/tests` | Log a milk quality test & calculate pricing (supports operator decision & override) |
| `GET` | `/api/tests` | Query historical milk tests with pagination |
| `GET` | `/api/farmers` | List registered farmers |
| `POST` | `/api/farmers` | Register a new farmer |
| `GET` | `/api/collections` | Fetch milk collection ledger |
| `GET` | `/api/devices` | Monitor IoT devices and probe health |
| `GET` | `/api/alerts` | Query active and historical system alerts |
| `GET` | `/api/settings` | Read configured dairy reference thresholds |
| `PUT` | `/api/settings` | Update thresholds and pricing parameters |
| `POST` | `/api/ml/predict` | Proxy milk quality prediction to ML service |

> **Telemetry Protocol Note:** HTTP telemetry (`POST /api/sensors/readings`) is currently implemented. MQTT integration is planned for future hardware deployment.

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
