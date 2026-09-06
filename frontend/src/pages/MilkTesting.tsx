import React, { useState } from 'react';
import { useDemoData } from '../context/DemoDataContext';
import { useRealtimeSensors, SimulationProfile } from '../hooks/useRealtimeSensors';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { FarmerSelector } from '../components/milk-test/FarmerSelector';
import { SensorCard } from '../components/milk-test/SensorCard';
import { QualityScoreCard } from '../components/milk-test/QualityScoreCard';
import { ParameterAnalysisTable } from '../components/milk-test/ParameterAnalysisTable';
import { FarmerModal } from '../components/farmers/FarmerModal';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { QualityCalculator } from '../services/qualityCalculator';
import {
  Thermometer,
  Activity,
  Droplets,
  Scale,
  Zap,
  Layers,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cpu,
  HelpCircle,
  Coins
} from 'lucide-react';

export const MilkTesting: React.FC = () => {
  const { farmers, addFarmer, addMilkTest } = useDemoData();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(farmers[0]?.farmerId || 'FMR-1001');
  const [isFarmerModalOpen, setIsFarmerModalOpen] = useState<boolean>(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>('Secondary laboratory spot-check verified');
  const [testSuccessModal, setTestSuccessModal] = useState<any | null>(null);

  const {
    reading,
    qualityPreview,
    isRunning,
    activeProfile,
    quantity,
    setQuantity,
    deviceId,
    startTest,
    stopTest,
    setProfile,
    resetReadings,
    tickReading
  } = useRealtimeSensors('ESP32-MILK-001');

  const selectedFarmer = farmers.find((f) => f.farmerId === selectedFarmerId);

  // Price calculation
  const currentRate = QualityCalculator.calculateRate(
    reading.fat,
    qualityPreview.score,
    settings.thresholds
  );
  const totalAmount = Number((quantity * currentRate).toFixed(2));

  const executeDecision = (decision: 'ACCEPT' | 'REJECT', reason?: string) => {
    if (!selectedFarmerId) {
      showToast('Please select a delivering farmer first', 'error');
      return;
    }
    if (quantity <= 0) {
      showToast('Please enter a valid milk volume (quantity > 0 Litres)', 'error');
      return;
    }

    stopTest();

    const result = addMilkTest({
      farmerId: selectedFarmerId,
      farmerName: selectedFarmer?.name,
      deviceId,
      quantity,
      sensorReading: reading,
      operatorDecision: decision,
      overrideReason: reason,
      notes: decision === 'REJECT' 
        ? 'Rejected by dock operator.' 
        : reason 
        ? `Accepted under operator override: ${reason}` 
        : 'Accepted into primary bulk storage.'
    });

    setTestSuccessModal({
      decision,
      test: result.test,
      quality: result.quality,
      collection: result.collection
    });
  };

  const handleDecision = (decision: 'ACCEPT' | 'REJECT') => {
    if (decision === 'ACCEPT' && qualityPreview.result === 'REJECTED') {
      // Prompt for override reason
      setOverrideModalOpen(true);
      return;
    }
    executeDecision(decision);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Station Header & IoT Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-dairy-50 text-dairy-600 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Dock Testing Station Bay-A</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                DEMO SENSOR DATA
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulated Node: <strong className="text-slate-700 font-mono">ESP32-MILK-001</strong> • Multi-Probe Telemetry Array
            </p>
          </div>
        </div>

        {/* Live Simulation Controls */}
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <Button
              variant="primary"
              size="md"
              onClick={startTest}
              icon={<Play className="w-4 h-4" />}
            >
              Start Sensor Stream
            </Button>
          ) : (
            <Button
              variant="danger"
              size="md"
              onClick={stopTest}
              icon={<Square className="w-4 h-4" />}
            >
              Stop Stream
            </Button>
          )}
          <Button
            variant="outline"
            size="md"
            onClick={tickReading}
            title="Single sample tick"
          >
            Sample Pulse
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={resetReadings}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Preset Simulation Profiles */}
      <Card className="p-4 bg-slate-900 text-white border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold text-slate-200">DEMO SENSOR PRESETS:</span>
            <span className="text-slate-400 hidden sm:inline">
              Simulate distinct parameter profiles to evaluate quality engine:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'NORMAL_COW', label: 'Normal Cow-Milk Simulation' },
              { id: 'BUFFALO_HIGH_FAT', label: 'Buffalo Milk Simulation (6.4% Fat)' },
              { id: 'WATER_DILUTED', label: 'Dilution Anomaly Simulation' },
              { id: 'SOUR_ACIDIC', label: 'Acidic Milk Simulation' },
              { id: 'HIGH_CONDUCTIVITY', label: 'High Conductivity Simulation' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setProfile(p.id as SimulationProfile)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeProfile === p.id
                    ? 'bg-dairy-500 text-white shadow-md shadow-dairy-500/30 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Grid: Left Intake Form + Right Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Farmer Selection & Batch Volume */}
        <div className="space-y-4">
          <Card className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Batch Intake Details
            </h3>

            {/* Farmer Selector */}
            <FarmerSelector
              farmers={farmers}
              selectedFarmerId={selectedFarmerId}
              onSelectFarmer={setSelectedFarmerId}
              onQuickAddFarmer={() => setIsFarmerModalOpen(true)}
            />

            {/* Milk Quantity (L) */}
            <Input
              label="Intake Volume (Litres) *"
              type="number"
              step="0.5"
              min="1"
              max="500"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0.5, Number(e.target.value)))}
              icon={<Layers className="w-4 h-4" />}
            />

            {/* Dynamic Calculated Financial Preview */}
            <div className="p-4 rounded-2xl bg-dairy-50/70 border border-dairy-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Calculated Payout Rate:</span>
                <span className="font-bold text-sm text-dairy-900 font-mono">₹{currentRate} / L</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-dairy-200/60">
                <span className="text-slate-600 font-bold">Estimated Batch Payout:</span>
                <span className="font-extrabold text-base text-dairy-900 font-mono">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Real-time Multi-sensor telemetry grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Live Sensor Telemetry Array
            </h3>
            {isRunning && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Continuous Sampling Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <SensorCard
              title="pH Level"
              value={reading.ph}
              unit="pH"
              assessment={qualityPreview.parameters.ph}
              icon={<Activity className="w-5 h-5" />}
              iconColor="bg-sky-50 text-sky-600"
              isSimulating={isRunning}
            />

            <SensorCard
              title="Estimated Fat"
              subtitle="Prototype optical estimate"
              value={reading.fat}
              unit="%"
              assessment={qualityPreview.parameters.fat}
              icon={<Droplets className="w-5 h-5" />}
              iconColor="bg-amber-50 text-amber-600"
              isSimulating={isRunning}
            />

            <SensorCard
              title="Specific Density"
              value={reading.density}
              unit="g/mL"
              assessment={qualityPreview.parameters.density}
              icon={<Scale className="w-5 h-5" />}
              iconColor="bg-indigo-50 text-indigo-600"
              isSimulating={isRunning}
            />

            <SensorCard
              title="Conductivity (EC)"
              value={reading.conductivity}
              unit="mS/cm"
              assessment={qualityPreview.parameters.conductivity}
              icon={<Zap className="w-5 h-5" />}
              iconColor="bg-purple-50 text-purple-600"
              isSimulating={isRunning}
            />

            <SensorCard
              title="Temperature"
              value={reading.temperature}
              unit="°C"
              assessment={qualityPreview.parameters.temperature}
              icon={<Thermometer className="w-5 h-5" />}
              iconColor="bg-rose-50 text-rose-600"
              isSimulating={isRunning}
            />

            <SensorCard
              title="Milk Volume"
              value={reading.milkLevel}
              unit="L"
              icon={<Layers className="w-5 h-5" />}
              iconColor="bg-emerald-50 text-emerald-600"
              isSimulating={isRunning}
            />
          </div>

          {/* Quality Engine Result Banner */}
          <QualityScoreCard quality={qualityPreview} isSimulating={isRunning} />
        </div>
      </div>

      {/* Parameter Diagnostic Assessment Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
          Parameter Diagnostic Matrix
        </h3>
        <ParameterAnalysisTable quality={qualityPreview} />
      </div>

      {/* Operator Action Decision Bar */}
      <div className="sticky bottom-4 z-20 p-4 rounded-3xl bg-slate-900/95 backdrop-blur-md text-white shadow-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 block font-medium">Ready for Intake Confirmation</span>
          <span className="text-sm font-bold text-white">
            Farmer: {selectedFarmer?.name || 'Unassigned'} • Batch Volume: {quantity} Litres • Status: {qualityPreview.result}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="danger"
            size="lg"
            onClick={() => handleDecision('REJECT')}
            className="flex-1 sm:flex-initial font-bold"
            icon={<XCircle className="w-5 h-5" />}
          >
            Reject Milk Batch
          </Button>

          <Button
            variant="success"
            size="lg"
            onClick={() => handleDecision('ACCEPT')}
            className="flex-1 sm:flex-initial font-bold shadow-lg shadow-emerald-600/30"
            icon={<CheckCircle2 className="w-5 h-5" />}
          >
            Accept Milk ({quantity} L)
          </Button>
        </div>
      </div>

      {/* Quick Add Farmer Modal */}
      <FarmerModal
        isOpen={isFarmerModalOpen}
        onClose={() => setIsFarmerModalOpen(false)}
        onSubmit={(data) => {
          const created = addFarmer(data);
          setSelectedFarmerId(created.farmerId);
        }}
      />

      {/* Manual Override Confirmation Modal */}
      {overrideModalOpen && (
        <Modal
          isOpen={overrideModalOpen}
          onClose={() => setOverrideModalOpen(false)}
          title="Manual Override — Accept Rejected Milk"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Quality Recommendation is REJECT
              </span>
              <p className="text-amber-800/90 leading-relaxed">
                The quality engine flagged one or more parameter anomalies on this batch. An override reason is required to log acceptance.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Override Justification / Reason *
              </label>
              <select
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-dairy-500 mb-2 font-medium"
              >
                <option value="Secondary laboratory spot-check verified">Secondary laboratory spot-check verified</option>
                <option value="Probe electrode recalibrated & sample re-tested">Probe electrode recalibrated & sample re-tested</option>
                <option value="Managerial special batch acceptance">Managerial special batch acceptance</option>
                <option value="Custom justification recorded below">Other (Specify in notes)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setOverrideModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
                onClick={() => {
                  setOverrideModalOpen(false);
                  executeDecision('ACCEPT', overrideReason);
                }}
              >
                Confirm Override & Accept
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Test Success / Recorded Modal */}
      {testSuccessModal && (
        <Modal
          isOpen={!!testSuccessModal}
          onClose={() => setTestSuccessModal(null)}
          title={testSuccessModal.decision === 'ACCEPT' ? 'Milk Batch Processed & Recorded' : 'Milk Batch Rejected'}
          maxWidth="md"
        >
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-slate-100">
              {testSuccessModal.decision === 'ACCEPT' ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              ) : (
                <XCircle className="w-10 h-10 text-rose-600" />
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Test ID: {testSuccessModal.test.testId}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Farmer: {testSuccessModal.test.farmerName} ({testSuccessModal.test.farmerId})
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Quality Classification:</span>
                <strong className="text-slate-800">{testSuccessModal.quality.classification} ({testSuccessModal.quality.score}%)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Final Decision:</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                  testSuccessModal.decision === 'ACCEPT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {testSuccessModal.decision}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Intake Volume:</span>
                <strong className="text-slate-800">{testSuccessModal.test.quantity} Litres</strong>
              </div>
              {testSuccessModal.decision === 'ACCEPT' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rate per Litre:</span>
                    <strong className="text-dairy-700 font-mono">₹{testSuccessModal.test.ratePerLiter}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-700 font-bold">Total Collection Amount:</span>
                    <strong className="text-dairy-900 text-sm font-bold font-mono">₹{testSuccessModal.test.totalAmount?.toLocaleString()}</strong>
                  </div>
                </>
              ) : (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] text-center font-medium">
                  Batch rejected by operator. Payout: ₹0. No collection ledger entry generated.
                </div>
              )}
            </div>

            <div className="flex justify-center pt-2">
              <Button variant="primary" size="md" onClick={() => setTestSuccessModal(null)}>
                Done & Next Test
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
