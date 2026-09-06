# MILKGUARD REST API Specifications

Base URL: `http://localhost:5000/api`

> **Notice & Scientific Disclaimer:**
> **Demo/engineering assessment only. Not a certified laboratory assay.**
> All quality scoring, parameter assessments, and ML prediction endpoints provide operational screening against configured reference thresholds.

---

## 1. System Health & Summary

### `GET /health`
Returns system status, operating mode, and timestamp.
```json
{
  "status": "healthy",
  "system": "MILKGUARD — Smart Milk Quality & Dairy Management API",
  "timestamp": "2026-09-07T06:00:00.000Z",
  "demoMode": true,
  "version": "1.0.0"
}
```

### `GET /dashboard/summary` (or `GET /summary`)
Fetch high-level daily collection KPIs and device status.

---

## 2. Farmers Endpoints

### `GET /farmers`
Fetch all registered farmers with optional query filters (`search`, `animalType`, `status`).

### `GET /farmers/:id`
Fetch single farmer profile with testing history.

### `POST /farmers`
Register a new farmer.
```json
{
  "name": "Anil Patil",
  "mobile": "+91 98221 00123",
  "village": "Saswad Rural",
  "animalType": "COW",
  "address": "Plot 18",
  "notes": "Gir cow specialist"
}
```

### `PUT /farmers/:id`
Update farmer details.

### `DELETE /farmers/:id`
Remove a farmer record.

---

## 3. Milk Testing Endpoints

### `GET /tests`
Fetch historical milk test records with filters (`farmerId`, `result`, `date`, `search`).

### `GET /tests/:id`
Get detailed breakdown of a single test by ID.

### `POST /tests`
Process a new milk intake batch.
```json
{
  "farmerId": "FMR-1001",
  "farmerName": "Rajesh Patil",
  "deviceId": "ESP32-MILK-001",
  "quantity": 35.0,
  "temperature": 24.2,
  "ph": 6.65,
  "fat": 5.4,
  "density": 1.030,
  "conductivity": 4.9,
  "milkLevel": 35.0,
  "operatorDecision": "ACCEPT",
  "overrideReason": "",
  "notes": "Morning milk batch"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "testId": "TEST-20260907-842",
    "farmerId": "FMR-1001",
    "result": "ACCEPTED",
    "recommendedResult": "ACCEPTED",
    "operatorDecision": "ACCEPT",
    "qualityScore": 96.4,
    "classification": "EXCELLENT",
    "ratePerLiter": 44.65,
    "totalAmount": 1562.75
  },
  "collection": {
    "collectionId": "COL-20260907-842",
    "totalAmount": 1562.75,
    "paymentStatus": "PAID"
  }
}
```

---

## 4. IoT Sensor Telemetry Endpoints

### `POST /sensors/readings` (or `POST /sensors/stream`)
Ingest real-time multi-sensor readings from an ESP32 node.
```json
{
  "deviceId": "ESP32-MILK-001",
  "timestamp": "2026-09-07T06:30:00.000Z",
  "temperature": 24.5,
  "ph": 6.64,
  "fat": 4.5,
  "density": 1.0295,
  "conductivity": 5.1,
  "milkLevel": 20.0
}
```

### `GET /sensors/latest`
Fetch current latest readings for a device (`?deviceId=ESP32-MILK-001`).

### `GET /sensors/simulate`
Generates a small micro-fluctuated simulated reading for UI demo testing.

---

## 5. Milk Collection Ledger Endpoints

### `GET /collections`
Fetch collection transactions with summary statistics (`totalVolume`, `totalAmount`, `averageFat`).

---

## 6. IoT Devices & Alerts

### `GET /devices`
List registered IoT nodes and probe health states.

### `GET /devices/:id`
Fetch single device details and probe health.

### `POST /devices/:id/action`
Send command to device (`{ "action": "RESTART" | "CALIBRATE" | "CONNECT" | "DISCONNECT" }`).

### `GET /alerts`
List all active, resolved, or dismissed alerts.

### `PUT /alerts/:id` (or `PATCH /alerts/:id`)
Update alert status (`{ "status": "ACTIVE" | "RESOLVED" | "DISMISSED" }`).

---

## 7. Dairy Configuration & Standards

### `GET /settings`
Read configured reference thresholds and pricing parameters.

### `PUT /settings`
Update reference ranges (pH, fat, density, conductivity, temperature) and pricing rates (base rate, fat premium factor).

---

## 8. Machine Learning Proxy

### `POST /ml/predict`
Proxy sensor parameters to the FastAPI ML service for heuristic prediction.
