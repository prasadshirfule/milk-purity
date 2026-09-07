# MILKGUARD ESP32 Hardware Integration Firmware Skeleton

> ⚠️ **Hardware Status Notice:**
> **Physical ESP32 microcontrollers and physical sensors have NOT yet been connected or tested in production.**
> This directory provides an **ESP32 hardware integration firmware skeleton** and **hardware-ready firmware foundation**. Physical sensor validation and calibration remain pending actual hardware deployment.

---

## 📌 Planned Physical Sensor Mapping & Signal Conditioning

The table below outlines the planned physical sensor mapping, electrical interfaces, calibration requirements, and expected operational ranges:

| Parameter | Planned Sensor Hardware | Expected Unit | Nominal Range | Interface Type | Pin Mapping | Signal Conditioning & Calibration Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Temperature** | Dallas DS18B20 (Waterproof Stainless Probe) | °C | -10°C to 100°C (Dairy: 15–30°C) | Digital 1-Wire | `GPIO 4` | Requires 4.7 kΩ pull-up resistor between VCC (3.3V) and DATA. Factory calibrated digital readout with 9–12 bit selectable resolution. |
| **pH (Acidity)** | Glass Electrode + pH-4502C Carrier Module | pH (0–14) | 6.50 – 6.80 (Fresh Milk) | Analog Voltage (0–3.3V) | `GPIO 34` (ADC1 Ch6) | High-impedance analog signal conditioning onboard pH-4502C. Requires 2-point buffer calibration (pH 4.01 and pH 7.00/9.18) with temperature compensation. |
| **Conductivity (EC)** | Industrial Platinum/Titanium EC Probe ($K=1.0$) | mS/cm | 4.0 – 6.0 mS/cm | Analog AC/DC Conditioning | `GPIO 35` (ADC1 Ch7) | Requires AC excitation signal conditioning circuit to prevent probe electrode polarization. Calibrate using 1413 µS/cm standard solution. |
| **Density (Specific Gravity)** | Load Cell ($5\,\text{kg}$) + HX711 ADC / Hydrometer | g/mL | 1.0260 – 1.0340 g/mL | 24-bit 2-Wire Serial (HX711) | `GPIO 16` (PD_SCK), `GPIO 17` (DOUT) | Fixed-volume vessel tare and weight differential ($m/V$). Requires zero-tare offset calibration and slope calibration using standard water ($1.000\,\text{g/mL}$). |
| **Estimated Fat Content** | NIR Optical Turbidity Sensor (850nm LED + Photodiode) | % Fat | 3.0% – 8.0% | Analog Voltage (0–3.3V) | `GPIO 32` (ADC1 Ch4) | Turbidity attenuation based on milk fat globule light scattering. Multi-point calibration curve against reference Gerber/Mojonnier chemical tests. |
| **Milk Level / Volume** | Non-Contact Ultrasonic Level (JSN-SR04T) / Tank Load Cell | Litres (L) | 0.0 – 100.0 L | Digital Pulse (Trig/Echo) | `GPIO 18` (Trig), `GPIO 19` (Echo) | Waterproof ultrasonic transducer mounted at tank intake funnel. Calibrate tank geometry height-to-volume curve. |
| **Battery Monitoring** | 2-Resistor Voltage Divider ($100\,\text{k}\Omega / 100\,\text{k}\Omega$) | % Level | 0 – 100% (3.0V – 4.2V LiPo) | Analog Voltage (0–3.3V) | `GPIO 33` (ADC1 Ch5) | Linear scaling from 3.3V cutoff to 4.2V full charge on 1S Li-Ion / LiPo cells. |

---

## 🔐 Telemetry Authentication & Canonical Payload

The microcontroller authenticates every HTTP POST request using the provisioned `X-Device-Key` header:

```http
POST /api/devices/ESP32-MILK-001/telemetry HTTP/1.1
Host: 192.168.1.100:5000
Content-Type: application/json
X-Device-Key: dev_sec_esp32_milk_001_live

{
  "deviceId": "ESP32-MILK-001",
  "timestamp": "2026-09-07T10:30:00.000Z",
  "temperature": 24.2,
  "ph": 6.65,
  "fat": 4.5,
  "density": 1.029,
  "conductivity": 4.8,
  "milkLevel": 25.5,
  "firmwareVersion": "v2.1.0-firmware",
  "sequenceNumber": 1042,
  "batteryLevel": 98
}
```

---

## 🛠️ Firmware Compilation & Flashing Guide

1. Open `esp32/milkguard_esp32_firmware.ino` in Arduino IDE or VSCode with PlatformIO.
2. Select Board: **ESP32 Dev Module** or **ESP32-WROOM-32**.
3. Install required libraries:
   - **ArduinoJson** (v6.21+ or v7.x)
   - **OneWire** & **DallasTemperature** (when connecting physical DS18B20)
4. Configure your Wi-Fi SSID, Password, Server URL, and `DEVICE_KEY` in the top configuration block.
5. Flash via USB-C / Micro-USB at `115200` baud rate.

