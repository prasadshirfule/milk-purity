import React, { useState, useEffect } from 'react';
import { useDemoData } from '../context/DemoDataContext';
import { useAuth } from '../context/AuthContext';
import { DeviceCard } from '../components/devices/DeviceCard';
import { LiveSensorPanel } from '../components/devices/LiveSensorPanel';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Cpu, Wifi, Radio, Code2, Plus, Key, Copy, CheckCircle2, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Device, SensorReading } from '../types';

export const Devices: React.FC = () => {
  const { devices, triggerDeviceAction, isDemoMode, refreshData } = useDemoData();
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('ESP32-DEMO-001');
  const [liveReading, setLiveReading] = useState<SensorReading | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [provisionedKeyInfo, setProvisionedKeyInfo] = useState<{ deviceId: string; key: string } | null>(null);
  const [hasCopiedKey, setHasCopiedKey] = useState(false);

  // New Device Form State
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceLocation, setNewDeviceLocation] = useState('Intake Bay 1');
  const [newDeviceType, setNewDeviceType] = useState('ESP32_MILK_ANALYZER');
  const [newConnectionMode, setNewConnectionMode] = useState('REST_POLLING');

  // Load telemetry for selected device
  const fetchTelemetry = async (devId: string) => {
    try {
      if (isDemoMode) {
        const res = await api.simulateSensorTick(devId);
        if (res.success && res.data) {
          setLiveReading(res.data);
        }
      } else {
        const res = await api.getLatestTelemetry(devId);
        if (res.success && res.data) {
          setLiveReading(res.data);
        }
      }
    } catch (err) {
      // Ignore polling hiccups
    }
  };

  useEffect(() => {
    fetchTelemetry(selectedDeviceId);
    const interval = setInterval(() => {
      fetchTelemetry(selectedDeviceId);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedDeviceId, isDemoMode]);

  const handleSimulateTick = async () => {
    try {
      const res = await api.simulateSensorTick(selectedDeviceId);
      if (res.success && res.data) {
        setLiveReading(res.data);
        showToast('Simulated micro-fluctuation generated', 'info');
      }
    } catch (e) {
      showToast('Simulation trigger failed', 'error');
    }
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceId.trim() || !newDeviceName.trim()) {
      showToast('Device ID and Device Name are required', 'error');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await api.registerDevice({
        deviceId: newDeviceId.trim().toUpperCase(),
        name: newDeviceName.trim(),
        location: newDeviceLocation.trim(),
        deviceType: newDeviceType as any,
        connectionMode: newConnectionMode as any,
        status: 'UNKNOWN'
      });

      if (res.success) {
        const provKey = (res.data as any)?.provisioningKey;
        setIsRegisterModalOpen(false);
        setNewDeviceId('');
        setNewDeviceName('');
        refreshData();

        if (provKey) {
          setProvisionedKeyInfo({
            deviceId: (res.data as any)?.deviceId || newDeviceId,
            key: provKey
          });
          setHasCopiedKey(false);
        } else {
          showToast(`Device registered successfully!`, 'success');
        }
      } else {
        showToast(res.error || 'Failed to register device', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopiedKey(true);
    showToast('X-Device-Key copied to clipboard!', 'success');
  };

  const activeCount = devices.filter((d) => d.status === 'ONLINE' || d.status === 'CONNECTED').length;
  const selectedDevice = devices.find((d) => d.deviceId === selectedDeviceId) || devices[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            ESP32 Sensor Hardware & Analyzer Nodes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry, device provisioning, and status of dock testing multi-probe hardware
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCodeModalOpen(true)}
            icon={<Code2 className="w-4 h-4" />}
          >
            ESP32 API Contract
          </Button>
          {hasRole('ADMIN') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRegisterModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Register ESP32 Node
            </Button>
          )}
        </div>
      </div>

      {/* Simulation vs Hardware Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-950 leading-relaxed">
          <strong className="font-semibold text-amber-950">Secure ESP32 Integration Foundation:</strong> Physical microcontrollers stream authenticated telemetry via header <code className="px-1.5 py-0.5 rounded bg-amber-200/60 font-mono text-[11px] font-bold">X-Device-Key</code> to <code className="px-1.5 py-0.5 rounded bg-amber-200/60 font-mono text-[11px] font-bold">POST /api/devices/:deviceId/telemetry</code>. In the absence of physical microcontrollers, simulated telemetry is available via <code className="px-1.5 py-0.5 rounded bg-amber-200/60 font-mono text-[11px] font-bold">npm run simulate:esp32</code> and explicitly labeled <strong>DEMO SENSOR DATA</strong>.
        </div>
      </div>

      {/* Selected Node Live Telemetry Panel */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Selected Analyzer Live Sensor Stream
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Select Node:</span>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-dairy-500"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.name} ({d.deviceId}) — {d.status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <LiveSensorPanel
          reading={liveReading}
          deviceId={selectedDevice?.deviceId || selectedDeviceId}
          deviceName={selectedDevice?.name || 'Selected Device'}
          deviceStatus={selectedDevice?.status || 'ONLINE'}
          calibrationStatus={selectedDevice?.calibrationStatus || 'CALIBRATED'}
          isDemo={isDemoMode || selectedDevice?.deviceId === 'ESP32-DEMO-001'}
          onSimulateTick={handleSimulateTick}
        />
      </div>

      {/* Network Overview Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block">Active Online Nodes</span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {activeCount} / {devices.length}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-dairy-50 text-dairy-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block">Telemetry Security</span>
            <span className="text-xl font-bold text-slate-900 font-mono">X-Device-Key Auth</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block">Sensor Probes</span>
            <span className="text-xl font-bold text-slate-900 font-mono">6 Multi-Parameter</span>
          </div>
        </div>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <DeviceCard
            key={device.deviceId}
            device={device}
            onAction={triggerDeviceAction}
          />
        ))}
      </div>

      {/* Register Device Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register New ESP32 Analyzer Node"
        description="Provision a new ESP32 hardware dock for milk intake testing"
        maxWidth="md"
      >
        <form onSubmit={handleRegisterDevice} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Device Identifier (e.g. ESP32-MILK-004) *
            </label>
            <Input
              value={newDeviceId}
              onChange={(e) => setNewDeviceId(e.target.value)}
              placeholder="ESP32-MILK-004"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Device Display Name *
            </label>
            <Input
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              placeholder="North Dock Rapid Analyzer"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Physical Location / Bay
            </label>
            <Input
              value={newDeviceLocation}
              onChange={(e) => setNewDeviceLocation(e.target.value)}
              placeholder="Collection Dock Bay-3"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Device Architecture
              </label>
              <select
                value={newDeviceType}
                onChange={(e) => setNewDeviceType(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
              >
                <option value="ESP32_MILK_ANALYZER">ESP32 Milk Analyzer</option>
                <option value="ESP32_INTAKE_DOCK">ESP32 Intake Dock</option>
                <option value="LAB_BENCHMARK_PROBE">Lab Benchmark Probe</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Connection Mode
              </label>
              <select
                value={newConnectionMode}
                onChange={(e) => setNewConnectionMode(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
              >
                <option value="REST_POLLING">REST HTTP Telemetry</option>
                <option value="WEBSOCKET_READY">WebSocket Ready</option>
                <option value="MQTT_READY">MQTT Ready</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRegisterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isRegistering}
            >
              {isRegistering ? 'Registering...' : 'Register Device'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* One-Time Device Provisioning Key Modal */}
      <Modal
        isOpen={Boolean(provisionedKeyInfo)}
        onClose={() => setProvisionedKeyInfo(null)}
        title="⚠️ Save ESP32 Authentication Key"
        description="This device secret will be shown ONCE. Store it in your microcontroller firmware."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-950 space-y-2">
            <p className="font-bold">
              Device: {provisionedKeyInfo?.deviceId}
            </p>
            <p>
              Your physical ESP32 must send this key in the <code className="font-mono font-bold bg-amber-200/60 px-1 py-0.5 rounded">X-Device-Key</code> HTTP header with every telemetry dispatch.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-emerald-400 select-all break-all">
              {provisionedKeyInfo?.key}
            </span>
            <button
              onClick={() => provisionedKeyInfo && copyToClipboard(provisionedKeyInfo.key)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0"
              title="Copy to clipboard"
            >
              {hasCopiedKey ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" onClick={() => setProvisionedKeyInfo(null)}>
              I Have Saved This Key
            </Button>
          </div>
        </div>
      </Modal>

      {/* ESP32 JSON Schema Modal */}
      <Modal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        title="ESP32 Ingestion Payload Specification"
        description="Physical nodes dispatch HTTP POST /api/devices/:deviceId/telemetry with this JSON contract"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
            <pre>{`POST /api/devices/ESP32-MILK-001/telemetry HTTP/1.1
Host: milkguard-server:5000
Content-Type: application/json
X-Device-Key: dev_key_esp32_milk_001_live

{
  "deviceId": "ESP32-MILK-001",
  "timestamp": "${new Date().toISOString()}",
  "temperature": 24.2,
  "ph": 6.64,
  "fat": 4.5,
  "density": 1.0295,
  "conductivity": 5.1,
  "milkLevel": 25.0,
  "firmwareVersion": "v2.1.0",
  "sequenceNumber": 1042,
  "batteryLevel": 98
}`}</pre>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            The backend validates each sensor reading within physical bounds (-10 to 100°C, pH 0-14, fat 0-20%, density 0.5-2.0 g/mL, conductivity 0-50 mS/cm, milkLevel ≥ 0), ensures monotonic sequence numbers, and updates the latest reading snapshot.
          </p>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" onClick={() => setIsCodeModalOpen(false)}>
              Got It
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
