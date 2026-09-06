# ESP32 IoT Sensor Integration Guide

> **Notice & Scientific Disclaimer:**
> **Demo/engineering assessment only. Not a certified laboratory assay.**
> Sensor conversion formulas shown in this prototype are illustrative calibration placeholders. Production deployment requires sensor-specific calibration against certified laboratory reference measurements (e.g. Gerber fat test, certified conductivity meters).
> **Communication Protocol:** HTTP REST telemetry is currently implemented. MQTT broker integration is planned for future hardware deployment.

---

## 1. Hardware Pinout & Wiring Diagram

| Sensor / Module | Recommended Model | Interface | ESP32 Pin | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Temperature** | DS18B20 (Waterproof Stainless) | OneWire Digital | GPIO 4 (with 4.7kΩ pull-up) | Intake thermal monitoring |
| **pH Sensor** | Analog pH Sensor (BNC Probe 4502C) | Analog (ADC) | GPIO 34 (ADC1_CH6) | Souring / acidity detection |
| **Conductivity** | Analog EC/TDS Sensor | Analog (ADC) | GPIO 35 (ADC1_CH7) | Mineral salt & dilution screening |
| **Optical / Turbidity** | NIR Optical / Turbidity Sensor | Analog (ADC) | GPIO 32 (ADC1_CH4) | Fat content optical proxy |
| **Milk Quantity** | HX711 + Load Cells (4x50kg) | 2-Wire Digital | DT: GPIO 18, SCK: GPIO 19 | Weight / Volume measurement |
| **Status Display** | 16x2 I2C LCD / 0.96" OLED | I2C | SDA: GPIO 21, SCL: GPIO 22 | Local operator readout |
| **Buzzer** | Active Piezo Buzzer | Digital Output | GPIO 23 | Anomaly audio alert |

---

## 2. ESP32 Arduino C++ Firmware Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>

const char* ssid = "YOUR_DAIRY_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverEndpoint = "http://192.168.1.100:5000/api/sensors/readings";

#define ONE_WIRE_BUS 4
#define PH_PIN 34
#define EC_PIN 35
#define TURBIDITY_PIN 32

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensors(&oneWire);

void setup() {
  Serial.begin(115200);
  tempSensors.begin();

  WiFi.begin(ssid, password);
  Serial.print("Connecting to Dairy Wi-Fi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! Local IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // 1. Read Digital Temperature (°C)
    tempSensors.requestTemperatures();
    float temperature = tempSensors.getTempCByIndex(0);

    // 2. Read pH Probe (Illustrative linear calibration: pH = 7.0 + (2.5 - V) * 3.5)
    int phRaw = analogRead(PH_PIN);
    float phVoltage = (phRaw / 4095.0) * 3.3;
    float phValue = 7.0 + ((2.5 - phVoltage) * 3.5);

    // 3. Read Electrical Conductivity (mS/cm proxy)
    int ecRaw = analogRead(EC_PIN);
    float ecVoltage = (ecRaw / 4095.0) * 3.3;
    float conductivity = ecVoltage * 2.8;

    // 4. Optical Turbidity / Fat Proxy (Requires laboratory calibration curve)
    int turbRaw = analogRead(TURBIDITY_PIN);
    float fatPercent = 3.5 + (turbRaw / 4095.0) * 3.0;

    // 5. Density estimation (Specific gravity baseline: 1.029 g/mL)
    float density = 1.0290;

    // 6. Milk Volume (Litres from calibrated load cells)
    float milkLevel = 30.0;

    // 7. Assemble JSON Payload
    StaticJsonDocument<256> doc;
    doc["deviceId"] = "ESP32-MILK-001";
    doc["temperature"] = temperature;
    doc["ph"] = phValue;
    doc["fat"] = fatPercent;
    doc["density"] = density;
    doc["conductivity"] = conductivity;
    doc["milkLevel"] = milkLevel;
    doc["timestamp"] = "2026-09-07T06:30:00.000Z";

    String jsonString;
    serializeJson(doc, jsonString);

    // 8. HTTP POST to MILKGUARD Backend API
    HTTPClient http;
    http.begin(serverEndpoint);
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.POST(jsonString);
    if (httpResponseCode > 0) {
      Serial.printf("Telemetry dispatched. HTTP Status: %d\n", httpResponseCode);
    } else {
      Serial.printf("Error dispatching telemetry: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  }

  delay(2000); // 2-second sampling interval
}
```

---

## 3. Communication Protocol Roadmap

- **Phase 1 (Current):** HTTP REST JSON ingestion via `POST /api/sensors/readings` (and `/stream`).
- **Phase 2 (Hardware Scaling):** MQTT Broker integration with topics `dairy/dock/ESP32-001/telemetry` and QoS 1 delivery for high-volume collection centers with unstable rural connectivity.
