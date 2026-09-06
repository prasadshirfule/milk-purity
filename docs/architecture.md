# System Architecture: Smart Milk Purity & Dairy Management

## 1. High-Level Overview

```
 [ Smart Testing Container ]
    ├── ESP32 Microcontroller
    ├── Temperature Probe (DS18B20)
    ├── Analog pH Sensor (BNC Probe)
    ├── Optical/NIR Fat Sensor or Turbidity
    ├── Load Cell / HX711 (Volume/Weight)
    └── Electrical Conductivity (EC Probe)
             │
             │ Wi-Fi (HTTP REST / MQTT)
             ▼
 [ Backend Node.js / Express API ] ◄────► [ Python ML Microservice (FastAPI) ]
             │                                (Random Forest / XGBoost Model)
             ├── Mongoose ORM / In-Memory Demo Store
             ├── Rule-Based Quality & Price Engine
             └── Telemetry & Alerts Dispatcher
             │
             ▼
 [ Frontend React Dashboard ] (Vite + TypeScript + Tailwind)
    ├── Real-Time Sensor Telemetry & Simulation Engine
    ├── Dairy Collection & Farmer Accounting Ledger
    ├── Interactive Purity & Statistical Charts
    └── IoT Device Management & Alert Notifications
```

---

## 2. Component Breakdown

### Frontend (`frontend/`)
- Single Page Application built on React 18, Vite, TypeScript, and Tailwind CSS.
- Multi-tier state architecture with `DemoDataContext`, `ToastContext`, and `SettingsContext`.
- Operates standalone in **`DEMO_MODE=true`** out-of-the-box or seamlessly communicates with the backend REST API.

### Backend (`backend/`)
- Express.js REST API with modular controllers, validation layer, and Mongoose models.
- Graceful database degradation: if MongoDB is running, persistence is stored in MongoDB; if not, in-memory repository keeps all transactions during the session.

### Machine Learning Service (`ml-service/`)
- Isolated FastAPI service for high-performance Python inference.
- Provides fallback heuristic analysis when offline.

### IoT Sensor Ingestion (`docs/sensor-integration.md`)
- Direct HTTP POST endpoint `/api/sensors/readings` receiving JSON telemetry from ESP32 nodes with millisecond timestamps and multi-parameter sensor arrays.
