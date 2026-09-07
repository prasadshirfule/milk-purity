import React from 'react';
import { Card } from '../components/common/Card';
import {
  ShieldAlert,
  Cpu,
  Brain,
  Database,
  FlaskConical,
  Coins,
  Sparkles,
  Radio,
  Workflow,
  CheckCircle2,
  AlertTriangle,
  Info,
  Code
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-dairy-950 p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dairy-500/10 border border-dairy-500/30 text-dairy-400 text-xs font-bold uppercase tracking-wider">
            <Info className="w-3.5 h-3.5" /> System Architecture & Technical Specifications
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            About MILKGUARD
          </h1>
          <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
            MILKGUARD is an IoT-enabled smart milk quality assessment and dairy collection management platform designed for rural and commercial collection docks. It combines multi-sensor telemetry, configurable reference range engines, transparent Indian Rupee (₹) pricing, and Python ML model inference interfaces.
          </p>
        </div>
      </div>

      {/* Scientific Limitation & Engineering Disclaimer Banner */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
        <div className="flex items-start gap-3.5">
          <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
              Scientific Assessment & Engineering Limitation Notice
            </h3>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              <strong>Demo/engineering assessment only. Not a certified laboratory assay.</strong> This system demonstrates an integrated IoT-to-cloud telemetry and quality classification architecture. Heuristic quality scoring and mock ML predictions detect physical parameter deviations against user-configured reference ranges. They do not constitute a legal or certified food safety/purity assay, which requires standardized chromatography, Gerber fat extraction, and accredited laboratory microbiological testing.
            </p>
          </div>
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Multi-Sensor IoT System */}
        <Card className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Multi-Sensor IoT Array</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Measures six physical parameters simultaneously at the dock:
          </p>
          <ul className="text-xs text-slate-700 space-y-1.5 pt-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              <strong>pH Electrode (BNC):</strong> Acidification & souring
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <strong>Optical Turbidity / Fat:</strong> Fat content estimation
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <strong>Specific Gravity Hydrometer:</strong> Dilution detection
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <strong>Conductivity (EC Probe):</strong> Added salts / neutralizers
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <strong>DS18B20 Digital Temp:</strong> Thermal monitoring
            </li>
          </ul>
        </Card>

        {/* 2. ESP32 Hardware Integration */}
        <Card className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">ESP32 Telemetry Engine</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Embedded microcontroller code continuously samples probe arrays and pushes structured JSON payloads via HTTP POST to <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">/api/sensors/readings</code> (MQTT planned for future hardware deployment).
          </p>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-mono text-slate-600">
            {'{ "deviceId": "ESP32-001", "ph": 6.64, "fat": 4.5, "density": 1.029, ... }'}
          </div>
          <p className="text-[11px] text-slate-500">
            Includes heartbeat detection, node reconnects, and sensor health telemetry.
          </p>
        </Card>

        {/* 3. Demo Mode Simulation */}
        <Card className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Zero-Hardware Demo Mode</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Operates fully standalone without requiring physical ESP32 boards, MongoDB clusters, or active cloud connections.
          </p>
          <ul className="text-xs text-slate-700 space-y-1.5 pt-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>5 realistic milk simulation presets</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full CRUD in-memory state management</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant fallback to mock seeds on API disconnect</span>
            </li>
          </ul>
        </Card>

        {/* 4. Modular Quality Engine */}
        <Card className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-dairy-50 text-dairy-600 flex items-center justify-center">
            <FlaskConical className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Configurable Quality Engine</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Evaluates raw multi-parameter readings against configurable dairy standards. Computes demo quality scores (0–100%), flags parameter anomalies, and generates advisory reports.
          </p>
          <div className="text-xs text-slate-600 space-y-1">
            <p>• <strong>Optimal / Excellent:</strong> Score ≥ 90%</p>
            <p>• <strong>Standard / Good:</strong> Score ≥ 75%</p>
            <p>• <strong>Borderline Warning:</strong> Score ≥ 60%</p>
            <p>• <strong>Anomaly / Reject:</strong> Score &lt; 60%</p>
          </div>
        </Card>

        {/* 5. ML Prediction Service */}
        <Card className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Python ML Microservice</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Built on FastAPI with strict CORS origin controls. Uses <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">demo-heuristic-v1.0</code> returning neutral classifications (<code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">DEMO_NORMAL</code> / <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">DEMO_ANOMALY</code>) with <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">confidence: null</code> in demo mode.
          </p>
          <p className="text-[11px] text-slate-500">
            Ready to load scikit-learn or ONNX trained models when experimental training data is supplied.
          </p>
        </Card>

        {/* 6. Pricing & Ledger Engine */}
        <Card className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Farmer Ledger & Pricing (₹)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Automates rate calculations in Indian Rupees using transparent fat-premium incentive formulas:
          </p>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-mono text-slate-700">
            Rate = (BaseRate + (Fat - FatMin) × PremiumFactor) × QualityFactor
          </div>
          <p className="text-[11px] text-slate-500">
            Calculations are demo illustrations and fully customizable under Settings.
          </p>
        </Card>
      </div>

      {/* Data Flow Architecture Section */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Workflow className="w-5 h-5 text-dairy-600" />
          End-to-End Telemetry & Decision Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 text-center text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block">1. Farmer</span>
            <span className="text-[11px] text-slate-500">Milk Delivery</span>
          </div>
          <div className="flex items-center justify-center font-bold text-slate-400">→</div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block">2. ESP32 Node</span>
            <span className="text-[11px] text-slate-500">Sensor Telemetry</span>
          </div>
          <div className="flex items-center justify-center font-bold text-slate-400">→</div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block">3. Backend API</span>
            <span className="text-[11px] text-slate-500">Express & Mongo</span>
          </div>
          <div className="flex items-center justify-center font-bold text-slate-400">→</div>
          <div className="p-3 rounded-xl bg-dairy-50 border border-dairy-200 text-dairy-900 font-bold">
            <span className="block">4. Dashboard</span>
            <span className="text-[11px] font-normal text-dairy-700">Accept / Reject & Ledger</span>
          </div>
        </div>
      </Card>

      {/* Future Scope */}
      <Card className="p-6 bg-slate-900 text-white border-slate-800">
        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <Code className="w-5 h-5 text-teal-400" />
          Future Roadmap & Hardware Expansion
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 mt-3">
          <div>
            <h4 className="font-bold text-slate-100 mb-1">Hardware & Edge ML:</h4>
            <p className="text-slate-400 leading-relaxed">
              Porting trained quantized ML models to TensorFlow Lite for Microcontrollers (TinyML) directly on ESP32-S3 modules for sub-millisecond edge classification.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-100 mb-1">Thermal Receipt & SMS Integration:</h4>
            <p className="text-slate-400 leading-relaxed">
              Direct ESC/POS thermal printer slip generation at dock and automated SMS ledger delivery to farmers via Twilio or Fast2SMS.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
