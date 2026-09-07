import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { Settings as SettingsIcon, ShieldAlert, Building2, Coins, RotateCcw, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { showToast } = useToast();

  const [dairyName, setDairyName] = useState(settings.dairyName);
  const [dairyAddress, setDairyAddress] = useState(settings.dairyAddress);
  const [contactPhone, setContactPhone] = useState(settings.contactPhone);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);

  // Thresholds state
  const [phMin, setPhMin] = useState(settings.thresholds.phMin.toString());
  const [phMax, setPhMax] = useState(settings.thresholds.phMax.toString());
  const [fatMin, setFatMin] = useState(settings.thresholds.fatMin.toString());
  const [fatMax, setFatMax] = useState(settings.thresholds.fatMax.toString());
  const [densityMin, setDensityMin] = useState(settings.thresholds.densityMin.toString());
  const [densityMax, setDensityMax] = useState(settings.thresholds.densityMax.toString());
  const [condMin, setCondMin] = useState(settings.thresholds.conductivityMin.toString());
  const [condMax, setCondMax] = useState(settings.thresholds.conductivityMax.toString());
  const [tempMin, setTempMin] = useState(settings.thresholds.tempMin.toString());
  const [tempMax, setTempMax] = useState(settings.thresholds.tempMax.toString());

  // Pricing state
  const [baseRate, setBaseRate] = useState(settings.thresholds.baseRatePerLiter.toString());
  const [fatFactor, setFatFactor] = useState(settings.thresholds.fatPremiumFactor.toString());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      dairyName,
      dairyAddress,
      contactPhone,
      contactEmail,
      thresholds: {
        ...settings.thresholds,
        phMin: Number(phMin),
        phMax: Number(phMax),
        fatMin: Number(fatMin),
        fatMax: Number(fatMax),
        densityMin: Number(densityMin),
        densityMax: Number(densityMax),
        conductivityMin: Number(condMin),
        conductivityMax: Number(condMax),
        tempMin: Number(tempMin),
        tempMax: Number(tempMax),
        baseRatePerLiter: Number(baseRate),
        fatPremiumFactor: Number(fatFactor)
      }
    });
    showToast('Dairy settings and quality thresholds updated successfully!', 'success');
  };

  const handleReset = () => {
    resetSettings();
    showToast('Quality thresholds reset to default reference ranges', 'info');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Dairy Standards & Threshold Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure laboratory pass/fail thresholds, scoring boundaries, and collection pricing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Reset Defaults
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            icon={<Save className="w-4 h-4" />}
          >
            Save All Settings
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Dairy Information */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-dairy-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Dairy Collection Center Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Center Name"
              value={dairyName}
              onChange={(e) => setDairyName(e.target.value)}
            />
            <Input
              label="Center Address"
              value={dairyAddress}
              onChange={(e) => setDairyAddress(e.target.value)}
            />
            <Input
              label="Contact Phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
            <Input
              label="Contact Email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </Card>

        {/* Section 2: Sensor Quality Thresholds */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Physical Sensor Quality Boundaries
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Parameters deviating beyond these bounds will be flagged with diagnostic warnings or rejection
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* pH */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase block">pH Normal Standard</span>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Min pH"
                  type="number"
                  step="0.05"
                  value={phMin}
                  onChange={(e) => setPhMin(e.target.value)}
                />
                <Input
                  label="Max pH"
                  type="number"
                  step="0.05"
                  value={phMax}
                  onChange={(e) => setPhMax(e.target.value)}
                />
              </div>
            </div>

            {/* Fat */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase block">Fat Standard (%)</span>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Min Fat %"
                  type="number"
                  step="0.1"
                  value={fatMin}
                  onChange={(e) => setFatMin(e.target.value)}
                />
                <Input
                  label="Max Fat %"
                  type="number"
                  step="0.1"
                  value={fatMax}
                  onChange={(e) => setFatMax(e.target.value)}
                />
              </div>
            </div>

            {/* Specific Density */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase block">Density (g/mL)</span>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Min Density"
                  type="number"
                  step="0.001"
                  value={densityMin}
                  onChange={(e) => setDensityMin(e.target.value)}
                />
                <Input
                  label="Max Density"
                  type="number"
                  step="0.001"
                  value={densityMax}
                  onChange={(e) => setDensityMax(e.target.value)}
                />
              </div>
            </div>

            {/* Electrical Conductivity */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase block">Conductivity (mS/cm)</span>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Min EC"
                  type="number"
                  step="0.1"
                  value={condMin}
                  onChange={(e) => setCondMin(e.target.value)}
                />
                <Input
                  label="Max EC"
                  type="number"
                  step="0.1"
                  value={condMax}
                  onChange={(e) => setCondMax(e.target.value)}
                />
              </div>
            </div>

            {/* Temperature */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase block">Intake Temp (°C)</span>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Min Temp"
                  type="number"
                  step="1"
                  value={tempMin}
                  onChange={(e) => setTempMin(e.target.value)}
                />
                <Input
                  label="Max Temp"
                  type="number"
                  step="1"
                  value={tempMax}
                  onChange={(e) => setTempMax(e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: AI & Quality Screening Thresholds */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <SettingsIcon className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                AI / Quality Screening Thresholds
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated screening score boundaries for Accept, Review, and Reject recommendations
              </p>
            </div>
          </div>

          {/* Screening disclaimer notice */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <span className="font-bold block mb-0.5">Application Screening Policy Notice:</span>
            <span>These are configured application screening thresholds and are not universal laboratory standards.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-1">
              <span className="text-xs font-bold text-emerald-900 uppercase block">Optimal / Accept (≥90%)</span>
              <span className="text-sm font-black text-emerald-700">EXCELLENT</span>
              <p className="text-[11px] text-emerald-800/80">Recommendation: ACCEPT MILK</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200/70 space-y-1">
              <span className="text-xs font-bold text-teal-900 uppercase block">Standard / Accept (≥75%)</span>
              <span className="text-sm font-black text-teal-700">GOOD</span>
              <p className="text-[11px] text-teal-800/80">Recommendation: ACCEPT MILK</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-1">
              <span className="text-xs font-bold text-amber-900 uppercase block">Warning / Review (60–74%)</span>
              <span className="text-sm font-black text-amber-700">WARNING</span>
              <p className="text-[11px] text-amber-800/80">Recommendation: REVIEW MILK</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/70 space-y-1">
              <span className="text-xs font-bold text-rose-900 uppercase block">Rejection Cutoff (&lt;60%)</span>
              <span className="text-sm font-black text-rose-700">POOR</span>
              <p className="text-[11px] text-rose-800/80">Recommendation: REJECT MILK</p>
            </div>
          </div>
        </Card>

        {/* Section 4: Pricing & Settlement Parameters */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Coins className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Pricing Slabs & Quality Incentives
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Base Milk Payout Rate (₹ per Litre)"
              type="number"
              step="0.5"
              value={baseRate}
              onChange={(e) => setBaseRate(e.target.value)}
              helperText="Baseline standard rate per liter"
            />
            <Input
              label="Fat Premium Incentive (₹ per 0.1% Fat)"
              type="number"
              step="0.1"
              value={fatFactor}
              onChange={(e) => setFatFactor(e.target.value)}
              helperText="Incentive added above standard baseline fat"
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="primary" size="lg" type="submit" icon={<Save className="w-4 h-4" />}>
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
