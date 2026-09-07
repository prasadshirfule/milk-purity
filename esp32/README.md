# MILKGUARD ESP32 Firmware Integration & Pinout Guide

This directory contains the production-ready ESP32 microcontroller firmware skeleton for MILKGUARD Smart Dairy Analyzers.

> **Status Notice:** Physical ESP32 microcontrollers are pending physical hardware deployment. The firmware skeleton provided here adheres to the canonical backend REST telemetry contract.

---

## 📌 Hardware Pinout & Wiring Specification

| Sensor / Module | Measurement | Protocol / Interface | Recommended ESP32 GPIO |
| :--- | :--- | :--- | :--- |
| **DS18B20** | Milk Temperature (°C) | OneWire Digital Bus | `GPIO 4` (with 4.7kΩ pullup) |
| **pH-4502C** | pH Acidity / Alkalinity | Analog Voltage (0–3.3V) | `GPIO 34` (ADC1 Channel 6) |
| **EC Probe K=1.0** | Electrical Conductivity | Analog Voltage (0–3.3V) | `GPIO 35` (ADC1 Channel 7) |
| **NIR Optical Turbidity** | Turbidity / Fat Estimate | Analog Optical Receiver | `GPIO 32` (ADC1 Channel 4) |
| **Ultrasonic / Load Cell** | Milk Volume / Level (L) | Trigger / Echo or HX711 | `GPIO 18` (Trig) / `GPIO 19` (Echo) |
| **Voltage Divider** | Battery Level Monitoring | Analog Voltage (0–3.3V) | `GPIO 33` (ADC1 Channel 5) |
| **Status LED** | Sampling / Tx Activity | Digital Output | `GPIO 2` (On-board LED) |

---

## 🔐 Telemetry Authentication

The microcontroller authenticates every HTTP POST request using the provisioned device secret header:

```http
POST /api/devices/ESP32-MILK-001/telemetry HTTP/1.1
Host: milkguard-server:5000
Content-Type: application/json
X-Device-Key: dev_key_esp32_milk_001_live
```

---

## 🛠️ Compilation & Flashing Instructions (Arduino IDE / PlatformIO)

1. Open `esp32/milkguard_esp32_firmware.ino` in Arduino IDE or VSCode with PlatformIO.
2. Select Board: **ESP32 Dev Module** or **ESP32-WROOM-32D**.
3. Install required library:
   - **ArduinoJson** (v6.21+ or v7.x)
4. Configure your Wi-Fi SSID, Password, and MILKGUARD Server IP in the header configuration block.
5. Flash via USB-C / Micro-USB at `115200` baud rate.
