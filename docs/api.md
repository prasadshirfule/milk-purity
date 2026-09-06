# API Specification: Milk Purity System

Base URL: `http://localhost:5000/api`

---

## 1. Farmers Endpoints

### `GET /farmers`
Fetch all registered farmers with optional search and filtering.
- Query params: `search`, `animalType` (`COW|BUFFALO|MIXED|GOAT`), `status` (`ACTIVE|INACTIVE`)

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
Deactivate or remove a farmer record.

---

## 2. Milk Testing Endpoints

### `GET /tests`
Fetch historical milk test records with filters (`farmerId`, `result`, `date`, `search`).

### `GET /tests/:id`
Get detailed breakdown of a single test by ID.

### `POST /tests`
Execute a new milk test analysis. Automatically logs collection ledger entry and triggers alerts if anomalies are found.
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
  "notes": "Morning milk batch"
}
```

---

## 3. IoT Sensor Telemetry Endpoints

### `POST /sensors/readings`
Ingest real-time multi-sensor readings from ESP32.
```json
{
  "deviceId": "ESP32-MILK-001",
  "timestamp": "2026-09-07T06:30:00Z",
  "temperature": 24.5,
  "ph": 6.64,
  "fat": 4.5,
  "density": 1.0295,
  "conductivity": 5.1,
  "milkLevel": 20.0
}
```

### `GET /sensors/latest`
Fetch current latest readings for a device.

### `GET /sensors/simulate`
Generates a small Brownian micro-fluctuated reading for smooth UI simulation.

---

## 4. Milk Collection Ledger Endpoints

### `GET /collections`
Fetch collection transactions with summary statistics (`totalVolume`, `totalAmount`, `averageFat`).

### `POST /collections`
Manual record creation for collection ledger.

---

## 5. IoT Devices & Alerts

### `GET /devices`
List all registered IoT analyzer nodes and individual sensor health.

### `POST /devices/:id/heartbeat`
Acknowledge node heartbeat.

### `GET /alerts`
List all active, resolved, or dismissed alerts.

### `PUT /alerts/:id`
Update alert status (`ACTIVE` | `RESOLVED` | `DISMISSED`).

---

## 6. Dashboard & Analytics

### `GET /dashboard/summary`
Get high-level summary KPIs (today volume, tests count, accepted count, avg purity score, active farmers, device status).

### `GET /dashboard/collection`
Daily volume trend data for charts (`days=7` or `days=30`).

### `GET /dashboard/quality`
Average sensor parameters and quality classification distribution.
