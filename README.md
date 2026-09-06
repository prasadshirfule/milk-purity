# Milk Purity Detection & Dairy Management System

An end-to-end, full-stack IoT Milk Quality Monitoring, Purity Detection, and Dairy Management System. Built for milk collection centers, co-operatives, and dairy processors to monitor real-time sensor readings (temperature, pH, fat %, density, and conductivity), execute automated purity tests, calculate farmer payouts, track historical collections, and integrate with ESP32 IoT hardware and Machine Learning models.

---

## 🌟 Key Features

1. **🥛 Real-Time Sensor Telemetry & Simulation Engine**:
   - Live stream of 6 core sensor parameters: Temperature (°C), pH, Fat (%), Density (g/mL), Conductivity (mS/cm), and Milk Level (L).
   - High-fidelity realistic simulation mode with Brownian jitter around pure milk baselines.
   - Ready for physical ESP32 HTTP POST / MQTT ingestion.

2. **🧪 Quality Scoring & Adulteration Detection**:
   - Automated quality classification (`EXCELLENT`, `GOOD`, `SUSPICIOUS`, `REJECT`).
   - Dynamic parameter compliance indicators against customizable dairy standards.
   - Ready integration with Python FastAPI ML inference service for adulteration prediction.

3. **👨‍🌾 Comprehensive Farmer Registry**:
   - Farmer profiles with cow/buffalo/mixed herd categorization, village tracking, lifetime supply volume, and average purity scores.
   - Fast inline search and filter capabilities.

4. **💰 Milk Collection Ledger & Payout Computation**:
   - Automatic rate-per-liter calculation based on fat content and quality slabs.
   - Collection ledger generation with real-time financial tracking.

5. **📊 Deep Analytics & Audit Reporting**:
   - Multi-day volume trend charts, parameter correlation breakdowns, rejection log analysis, and one-click CSV / printable report export.

6. **📡 IoT Device & Alert Management**:
   - Multi-bay ESP32 hardware status monitoring with individual sensor probe health checks.
   - Real-time notification system for abnormal pH, high conductivity, low fat, or device offline states.

7. **⚡ Zero-Config Demo Mode (`DEMO_MODE=true`)**:
   - Works immediately with pre-seeded realistic farmers, historical tests, and alerts without requiring MongoDB or physical hardware.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, React Router
- **Backend**: Node.js, Express, TypeScript, REST API, Mongoose, In-Memory Repository Fallback
- **ML Microservice**: Python, FastAPI, Pydantic, Scikit-Learn (inference ready)
- **IoT Hardware**: ESP32 Microcontroller, DS18B20, Analog pH BNC Probe, EC Sensor, HX711 Load Cell

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Python 3.10+ (optional, for ML service)
- MongoDB (optional, in-memory demo persistence activates automatically if absent)

---

### 2. Frontend Setup & Run
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

### 3. Backend Setup & Run (Optional in Demo Mode)
```bash
cd backend
npm install
npm run dev
```
Backend API will be live on **`http://localhost:5000`**.

---

### 4. ML Microservice (Optional)
```bash
cd ml-service
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --port 8000 --reload
```

---

## 🔑 Demo Login Credentials
- **Role**: Dairy Operator / Admin
- **Email**: `operator@amritdairy.com`
- **Password**: `dairy2026`
*(Or click the "1-Click Demo Login" button on the login screen)*

---

## 📖 Documentation
- [System Architecture](docs/architecture.md)
- [REST API Specifications](docs/api.md)
- [ESP32 Hardware & Wiring Guide](docs/sensor-integration.md)
- [Machine Learning Training & Integration](docs/ml-integration.md)
