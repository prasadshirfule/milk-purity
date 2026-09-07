/**
 * MILKGUARD Development ESP32 Simulator
 *
 * Simulates physical ESP32 microcontroller telemetry dispatching HTTP POST
 * requests to /api/devices/:deviceId/telemetry with realistic parameters,
 * sequenceNumber incrementation, and scenario emulation.
 *
 * Usage:
 *   npx tsx src/scripts/simulateEsp32.ts [--device <id>] [--scenario <name>] [--interval <ms>] [--key <key>]
 *
 * Scenarios:
 *   NORMAL             - Standard pure milk reference readings with micro-jitter
 *   SENSOR_WARNING     - Slight pH or conductivity deviation
 *   INVALID_SENSOR     - Out-of-bounds sensor values (tested for rejection)
 *   DUPLICATE_PACKET   - Sends duplicate sequence packets
 *   OUT_OF_ORDER       - Decrements sequence numbers to test 409 rejection
 *   STALE_DEVICE       - Sends 1 packet and pauses to test timeout transition
 *   LOW_BATTERY        - Sends packets with low battery level (<15%)
 */

export interface SimulatorOptions {
  apiUrl?: string;
  deviceId?: string;
  apiKey?: string;
  scenario?: 'NORMAL' | 'SENSOR_WARNING' | 'INVALID_SENSOR' | 'DUPLICATE_PACKET' | 'OUT_OF_ORDER' | 'STALE_DEVICE' | 'LOW_BATTERY';
  intervalMs?: number;
  maxIterations?: number;
  firmwareVersion?: string;
}

export async function runEsp32Simulation(options: SimulatorOptions = {}): Promise<void> {
  const apiUrl = options.apiUrl || process.env.API_URL || 'http://localhost:5000/api';
  const deviceId = options.deviceId || 'ESP32-MILK-001';
  const apiKey = options.apiKey || 'dev_key_esp32_milk_001_live';
  const scenario = options.scenario || 'NORMAL';
  const intervalMs = options.intervalMs || 3000;
  const maxIterations = options.maxIterations || Infinity;
  const firmwareVersion = options.firmwareVersion || 'v2.1.0-sim';

  console.log('====================================================');
  console.log('  🥛 MILKGUARD ESP32 HARDWARE SIMULATOR (DEV TOOL)   ');
  console.log('====================================================');
  console.log(`📡 Target Endpoint : ${apiUrl}/devices/${deviceId}/telemetry`);
  console.log(`🏷️  Device ID       : ${deviceId}`);
  console.log(`🔐 Device Key (X)  : ${apiKey.substring(0, 10)}...`);
  console.log(`🧪 Active Scenario : ${scenario}`);
  console.log(`⏱️  Interval        : ${intervalMs} ms`);
  console.log('----------------------------------------------------\n');

  let seq = 1000;
  let iteration = 0;
  let running = true;

  // Base parameters
  let temp = 24.2;
  let ph = 6.64;
  let fat = 4.5;
  let density = 1.0295;
  let conductivity = 4.9;
  let milkLevel = 30.0;
  let battery = scenario === 'LOW_BATTERY' ? 12 : 95;

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  while (running && iteration < maxIterations) {
    iteration++;

    // Apply scenario alterations
    let payloadSeq = seq;
    if (scenario === 'NORMAL') {
      temp = Number(clamp(temp + (Math.random() - 0.5) * 0.1, 23.0, 25.5).toFixed(2));
      ph = Number(clamp(ph + (Math.random() - 0.5) * 0.02, 6.60, 6.70).toFixed(2));
      fat = Number(clamp(fat + (Math.random() - 0.5) * 0.04, 4.2, 4.8).toFixed(2));
      density = Number(clamp(density + (Math.random() - 0.5) * 0.0003, 1.0285, 1.0310).toFixed(4));
      conductivity = Number(clamp(conductivity + (Math.random() - 0.5) * 0.05, 4.7, 5.2).toFixed(2));
      battery = Math.max(5, battery - 0.05);
      seq++;
    } else if (scenario === 'SENSOR_WARNING') {
      ph = 6.42; // Low pH warning
      conductivity = 6.2; // High EC warning
      seq++;
    } else if (scenario === 'INVALID_SENSOR') {
      ph = 18.5; // Invalid pH
      temp = 150.0; // Invalid temperature
      seq++;
    } else if (scenario === 'DUPLICATE_PACKET') {
      // Keep payloadSeq identical to trigger duplicate detection
      payloadSeq = 1000;
    } else if (scenario === 'OUT_OF_ORDER') {
      // Decrement sequence
      seq = Math.max(1, seq - 1);
      payloadSeq = seq;
    } else if (scenario === 'LOW_BATTERY') {
      battery = Math.max(2, battery - 0.5);
      seq++;
    }

    const payload = {
      deviceId,
      timestamp: new Date().toISOString(),
      temperature: temp,
      ph,
      fat,
      density,
      conductivity,
      milkLevel,
      firmwareVersion,
      sequenceNumber: payloadSeq,
      batteryLevel: Math.round(battery),
      isDemo: false
    };

    try {
      const response = await fetch(`${apiUrl}/devices/${deviceId}/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Key': apiKey
        },
        body: JSON.stringify(payload)
      });

      const body: any = await response.json();

      const timeStr = new Date().toLocaleTimeString();
      if (response.ok) {
        if (body.isDuplicate) {
          console.log(`[${timeStr}] 🔁 SEQ #${payloadSeq} | Status: 200 OK (DUPLICATE ACKNOWLEDGED) | pH: ${ph}, Fat: ${fat}%`);
        } else {
          console.log(`[${timeStr}] ✅ SEQ #${payloadSeq} | Status: 200 OK (INGESTED) | Temp: ${temp}°C, pH: ${ph}, Fat: ${fat}%, EC: ${conductivity} mS/cm, Batt: ${Math.round(battery)}%`);
        }
      } else {
        console.log(`[${timeStr}] ⚠️ SEQ #${payloadSeq} | Status: ${response.status} ${response.statusText} | Error: ${body.error || 'Request rejected'}`);
      }
    } catch (err: any) {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ Network error connecting to ${apiUrl}:`, err.message);
    }

    if (scenario === 'STALE_DEVICE') {
      console.log('⏸️  [STALE_DEVICE Scenario] Pausing telemetry transmission for 65s to simulate offline transition...');
      await new Promise((r) => setTimeout(r, 65000));
    } else {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
}

// CLI Execution Support
if (require.main === module || (typeof process !== 'undefined' && process.argv[1]?.includes('simulateEsp32'))) {
  const args = process.argv.slice(2);
  const getArg = (flag: string, fallback?: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
  };

  const options: SimulatorOptions = {
    deviceId: getArg('--device', 'ESP32-MILK-001'),
    apiKey: getArg('--key', 'dev_key_esp32_milk_001_live'),
    scenario: (getArg('--scenario', 'NORMAL') as any),
    intervalMs: Number(getArg('--interval', '3000')),
    maxIterations: getArg('--iterations') ? Number(getArg('--iterations')) : undefined
  };

  runEsp32Simulation(options).catch((err) => {
    console.error('Simulator fatal error:', err);
    process.exit(1);
  });
}
