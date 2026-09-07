import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDemoData } from '../context/DemoDataContext';
import { useRealtimeSensors, SimulationProfile } from '../hooks/useRealtimeSensors';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { CollectionReceiptModal } from '../components/milk-test/CollectionReceiptModal';
import { FarmerSelector } from '../components/milk-test/FarmerSelector';
import { CustomerLookupModal } from '../components/milk-test/CustomerLookupModal';
import { SensorCard } from '../components/milk-test/SensorCard';
import { QualityScoreCard } from '../components/milk-test/QualityScoreCard';
import { ParameterAnalysisTable } from '../components/milk-test/ParameterAnalysisTable';
import { FarmerModal } from '../components/farmers/FarmerModal';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
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
  Coins,
  QrCode,
  FileCheck,
  Printer,
  Eye
} from 'lucide-react';

export const MilkTesting: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { farmers, addFarmer, addMilkTest } = useDemoData();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(farmers[0]?.farmerId || 'FMR-1001');
  const [isFarmerModalOpen, setIsFarmerModalOpen] = useState<boolean>(false);
  const [isLookupModalOpen, setIsLookupModalOpen] = useState<boolean>(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState<boolean>(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState<boolean>(false);
  const [pendingDecision, setPendingDecision] = useState<'ACCEPT' | 'REJECT'>('ACCEPT');
  const [overrideReason, setOverrideReason] = useState<string>('Secondary laboratory spot-check verified');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<{ test: any; collection: any; farmer: any } | null>(null);

  // URL Query Param preselection (e.g. from QR scan / customer profile)
  useEffect(() => {
    const codeParam = searchParams.get('customerCode');
    const farmerIdParam = searchParams.get('farmerId');

    if (codeParam) {
      const match = farmers.find(
        (f) => f.customerCode?.toUpperCase() === codeParam.trim().toUpperCase()
      );
      if (match) {
        setSelectedFarmerId(match.farmerId);
        showToast(`Customer ${match.name} (${match.customerCode}) selected for intake test`, 'info');
        return;
      }
    }

    if (farmerIdParam) {
      const match = farmers.find(
        (f) => f.farmerId.toUpperCase() === farmerIdParam.trim().toUpperCase()
      );
      if (match) {
        setSelectedFarmerId(match.farmerId);
      }
    }
  }, [searchParams, farmers, showToast]);

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

  const executeDecision = async (decision: 'ACCEPT' | 'REJECT', reason?: string) => {
    if (isSaving) return;

    if (!selectedFarmerId) {
      showToast('Please select a delivering farmer first', 'error');
      return;
    }
    if (quantity <= 0) {
      showToast('Please enter a valid milk volume (quantity > 0 Litres)', 'error');
      return;
    }

    setIsSaving(true);
    stopTest();

    try {
      const result = await addMilkTest({
        farmerId: selectedFarmerId,
        customerCode: selectedFarmer?.customerCode,
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

      setSummaryModalOpen(false);
      setOverrideModalOpen(false);
      setReceiptData({
        test: result.test,
        collection: result.collection,
        farmer: selectedFarmer
      });
      showToast(`Milk ${decision === 'ACCEPT' ? 'Collection' : 'Test'} saved successfully!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to record milk test', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDecision = (decision: 'ACCEPT' | 'REJECT') => {
    setPendingDecision(decision);
    if (decision === 'ACCEPT' && qualityPreview.result === 'REJECTED') {
      // Prompt for override reason
      setOverrideModalOpen(true);
      return;
    }
    // Open final transaction summary modal
    setSummaryModalOpen(true);
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

        {/* Live Simulation Controls & QR Lookup */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsLookupModalOpen(true)}
            icon={<QrCode className="w-4 h-4 text-dairy-600" />}
            className="border-dairy-400 bg-dairy-50 hover:bg-dairy-100 text-dairy-800 font-extrabold shadow-sm"
          >
            Scan Customer QR
          </Button>

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
              onOpenQRScanner={() => setIsLookupModalOpen(true)}
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              AI Recommendation:
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${
              qualityPreview.result === 'ACCEPTED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : qualityPreview.result === 'WARNING'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}>
              {qualityPreview.result === 'ACCEPTED' ? '✅ ACCEPT MILK' : qualityPreview.result === 'WARNING' ? '⚠️ REVIEW MILK' : '❌ REJECT MILK'} ({qualityPreview.purityScore || qualityPreview.score}% Purity Score)
            </span>
          </div>
          <span className="text-sm font-bold text-white">
            Delivering: {selectedFarmer?.name || 'Unassigned'} • Volume: {quantity} L
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
            REJECT MILK
          </Button>

          <Button
            variant="success"
            size="lg"
            onClick={() => handleDecision('ACCEPT')}
            className="flex-1 sm:flex-initial font-bold shadow-lg shadow-emerald-600/30"
            icon={<CheckCircle2 className="w-5 h-5" />}
          >
            ACCEPT MILK ({quantity} L)
          </Button>
        </div>
      </div>

      {/* Quick Add Farmer Modal */}
      <FarmerModal
        isOpen={isFarmerModalOpen}
        onClose={() => setIsFarmerModalOpen(false)}
        onSubmit={async (data) => {
          try {
            const created = await addFarmer(data);
            setSelectedFarmerId(created.farmerId);
          } catch (err: any) {
            showToast(err?.message || 'Failed to add farmer', 'error');
          }
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

      {/* Transaction Summary Confirmation Modal */}
      {summaryModalOpen && selectedFarmer && (
        <Modal
          isOpen={summaryModalOpen}
          onClose={() => !isSaving && setSummaryModalOpen(false)}
          title="Confirm Milk Collection Transaction"
          description="Verify intake volume, purity screening result, and financial settlement before logging collection."
          maxWidth="md"
        >
          <div className="space-y-4">
            {/* Customer Identification Header */}
            <div className="p-3.5 rounded-xl bg-dairy-50/80 border border-dairy-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Customer</span>
                <strong className="text-sm font-black text-slate-900">{selectedFarmer.name}</strong>
                <p className="text-xs text-slate-500">{selectedFarmer.village}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Customer Code</span>
                <span className="font-mono text-sm font-black text-dairy-800 bg-white px-2 py-0.5 rounded border border-dairy-200 inline-block">
                  {selectedFarmer.customerCode || selectedFarmer.farmerId}
                </span>
              </div>
            </div>

            {/* Milk & Pricing Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Delivered Volume:</span>
                <strong className="text-slate-900 font-mono">{quantity} Litres</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Fat Content:</span>
                <strong className="text-slate-800 font-mono">{reading.fat}%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Calculated Payout Rate:</span>
                <strong className="text-dairy-700 font-mono">
                  {pendingDecision === 'REJECT' ? '₹0.00 / L (Rejected)' : `₹${currentRate} / L`}
                </strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold">
                <span className="text-slate-700">Estimated Total Amount:</span>
                <span className="font-mono text-base text-dairy-900">
                  {pendingDecision === 'REJECT' ? '₹0.00' : `₹${totalAmount.toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* Quality Assessment Breakdown */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Purity Score (%):</span>
                <span className="font-mono font-bold text-sm text-dairy-400">
                  {qualityPreview.purityScore || qualityPreview.score}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Quality Classification:</span>
                <Badge variant="primary" size="sm">
                  {qualityPreview.classification || 'EXCELLENT'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">AI Recommendation:</span>
                <Badge
                  variant={qualityPreview.result === 'ACCEPTED' ? 'success' : qualityPreview.result === 'WARNING' ? 'warning' : 'danger'}
                  size="sm"
                >
                  {qualityPreview.result === 'ACCEPTED' ? 'ACCEPT' : qualityPreview.result === 'WARNING' ? 'REVIEW' : 'REJECT'}
                </Badge>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                <span className="text-slate-300 font-bold">Operator Decision:</span>
                <span className={`px-2 py-0.5 rounded font-black text-xs uppercase ${
                  pendingDecision === 'ACCEPT' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                  {pendingDecision}
                </span>
              </div>
            </div>

            {/* Action Buttons with Duplicate Submission Protection */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="ghost"
                size="md"
                disabled={isSaving}
                onClick={() => setSummaryModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant={pendingDecision === 'ACCEPT' ? 'primary' : 'danger'}
                size="md"
                disabled={isSaving}
                className="font-bold min-w-[160px] justify-center"
                onClick={() => executeDecision(pendingDecision)}
              >
                {isSaving ? 'Saving Collection...' : 'Confirm Collection'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Collection Receipt Modal */}
      {receiptData && (
        <CollectionReceiptModal
          isOpen={!!receiptData}
          onClose={() => setReceiptData(null)}
          test={receiptData.test}
          collection={receiptData.collection}
          farmer={receiptData.farmer}
          onNewTest={() => {
            setReceiptData(null);
            resetReadings();
          }}
        />
      )}

      {/* Customer QR & Code Scanner Modal */}
      {isLookupModalOpen && (
        <CustomerLookupModal
          isOpen={isLookupModalOpen}
          onClose={() => setIsLookupModalOpen(false)}
          onSelectCustomer={(customer) => {
            setSelectedFarmerId(customer.farmerId);
            showToast(`Selected ${customer.name} (Code: ${customer.customerCode || customer.farmerId})`, 'success');
          }}
        />
      )}
    </div>
  );
};
