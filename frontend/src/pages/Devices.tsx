import React, { useState } from 'react';
import { useDemoData } from '../context/DemoDataContext';
import { DeviceCard } from '../components/devices/DeviceCard';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Cpu, Wifi, Radio, Code2, Plus } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Devices: React.FC = () => {
  const { devices, triggerDeviceAction } = useDemoData();
  const { showToast } = useToast();
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  const connectedCount = devices.filter((d) => d.status === 'CONNECTED').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            IoT Sensor Hardware & Analyzer Nodes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status of connected ESP32 testing docks and probe sensors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCodeModalOpen(true)}
            icon={<Code2 className="w-4 h-4" />}
          >
            ESP32 API Schema
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => showToast('Pairing scanner initialized. Listening for ESP32 broadcast...', 'info')}
            icon={<Plus className="w-4 h-4" />}
          >
            Pair New Node
          </Button>
        </div>
      </div>

      {/* Simulation / Hardware Readiness Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0 animate-pulse" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold text-amber-950">Hardware Integration Architecture:</span> The dashboard currently runs with simulated ESP32 node telemetry for software validation. Physical ESP32 microcontrollers can stream live sensor readings directly via the REST endpoint <code className="px-1.5 py-0.5 rounded bg-amber-200/50 font-mono text-[11px] text-amber-950">POST /api/sensors/readings</code> or MQTT telemetry broker.
        </div>
      </div>

      {/* Network Health Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block">Active IoT Nodes</span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {connectedCount} / {devices.length}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-dairy-50 text-dairy-600 flex items-center justify-center">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block">Sampling Frequency</span>
            <span className="text-2xl font-black text-slate-900 font-mono">1.2 sec</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block">Protocol</span>
            <span className="text-xl font-bold text-slate-900 font-mono">REST JSON / MQTT Ready</span>
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

      {/* ESP32 JSON Schema Modal */}
      <Modal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        title="ESP32 Ingestion Payload Specification"
        description="Physical nodes dispatch HTTP POST /api/sensors/readings with this JSON contract"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
            <pre>{`POST /api/sensors/readings HTTP/1.1
Host: 192.168.1.100:5000
Content-Type: application/json

{
  "deviceId": "ESP32-MILK-001",
  "timestamp": "${new Date().toISOString()}",
  "temperature": 24.2,
  "ph": 6.64,
  "fat": 4.5,
  "density": 1.0295,
  "conductivity": 5.1,
  "milkLevel": 25.0
}`}</pre>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            The backend validates each sensor parameter within physical bounds and immediately streams the latest values to connected testing stations.
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
