# ESP32 IoT Sensor Integration Guide

This guide describes how to connect physical hardware sensors to an ESP32 microcontroller and transmit telemetry to the Milk Purity Backend API.

---

## 1. Hardware Pinout & Wiring Diagram

| Sensor | Recommended Model | Interface | ESP32 Pin |
|---|---|---|---|
| **Temperature** | DS18B20 (Waterproof Stainless) | OneWire Digital | GPIO 4 (with 4.7kΩ pull-up) |
| **pH Sensor** | Analog pH Sensor (BNC Probe) | Analog (ADC) | GPIO 34 (ADC1_CH6) |
| **Conductivity** | Analog EC/TDS Sensor | Analog (ADC) | GPIO 35 (ADC1_CH7) |
| **Fat / Optical Turbidity** | NIR Optical / Turbidity Sensor | Analog / UART | GPIO 32 (ADC1_CH4) |
| **Milk Quantity / Load Cell** | HX711 + Load Cells (4x50kg) | 2-Wire Digital | DT: GPIO 18, SCK: GPIO 19 |
| **Status Display** | 16x2 I2C LCD / 0.96" OLED | I2C | SDA: GPIO 21, SCL: GPIO 22 |
| **Buzzer** | Active Piezo Buzzer | Digital Output | GPIO 23 |

---

## 2. ESP32 Arduino C++ Code Example

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
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // 1. Read Temperature
    tempSensors.requestTemperatures();
    float temperature = tempSensors.getTempCByIndex(0);

    // 2. Read pH (Calibration formula: pH = 7.0 + ((2.5 - V) / 0.18))
    int phRaw = analogRead(PH_PIN);
    float phVoltage = (phRaw / 4095.0) * 3.3;
    float phValue = 7.0 + ((2.5 - phVoltage) * 3.5);

    // 3. Read Conductivity (mS/cm)
    int ecRaw = analogRead(EC_PIN);
    float ecVoltage = (ecRaw / 4095.0) * 3.3;
    float conductivity = ecVoltage * 2.8;

    // 4. Estimate Fat (derived from optical turbidity + calibration curve)
    int turbRaw = analogRead(TURBIDITY_PIN);
    float fatPercent = 3.5 + (turbRaw / 4095.0) * 3.0;

    // 5. Density estimation (hydrometer / ultrasonic time of flight)
    float density = 1.0290;

    // 6. Milk Volume
    float milkLevel = 15.0; // Litres from calibrated HX711

    // 7. Assemble JSON Payload
    StaticJsonDocument<256> doc;
    doc["deviceId"] = "ESP32-MILK-001";
    doc["temperature"] = temperature;
    doc["ph"] = phValue;
    doc["fat"] = fatPercent;
    doc["density"] = density;
    doc["conductivity"] = conductivity;
    doc["milkLevel"] = milkLevel;

    String jsonString;
    serializeJson(doc, jsonString);

    // 8. HTTP POST to Dairy Backend
    HTTPClient http;
    http.begin(serverEndpoint);
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.POST(jsonString);
    if (httpResponseCode > 0) {
      Serial.printf("Telemetry dispatched. HTTP Code: %d\n", httpResponseCode);
    } else {
      Serial.printf("Error dispatching telemetry: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  }

  delay(2000); // Sample telemetry every 2 seconds
}
```
