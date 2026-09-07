import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoData } from '../context/DemoDataContext';
import { StatCard } from '../components/common/StatCard';
import { ChartCard } from '../components/common/ChartCard';
import { DataTable } from '../components/common/DataTable';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ParameterAnalysisTable } from '../components/milk-test/ParameterAnalysisTable';
import { QualityCalculator } from '../services/qualityCalculator';
import { useSettings } from '../context/SettingsContext';
import { MilkTest } from '../types';
import {
  Milk,
  FlaskConical,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Users,
  Cpu,
  Plus,
  Coins,
  FileText,
  Eye,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDemoMode, setDemoMode, connectionError, refreshData, summary, tests, collections } = useDemoData();
  const { settings } = useSettings();

  const [timeFilter, setTimeFilter] = useState<'today' | '7days' | '30days'>('7days');
  const [selectedTest, setSelectedTest] = useState<MilkTest | null>(null);

  // Timeline chart data
  const chartData = React.useMemo(() => {
    if (timeFilter === 'today') {
      return [
        { label: '06:00 AM', liters: 45, purity: 94 },
        { label: '08:00 AM', liters: 120, purity: 92 },
        { label: '10:00 AM', liters: 180, purity: 93 },
        { label: '12:00 PM', liters: 210, purity: 91 },
        { label: '02:00 PM', liters: 240, purity: 92 },
        { label: '04:00 PM', liters: 310, purity: 95 },
        { label: '06:00 PM', liters: 420, purity: 93 }
      ];
    }
    if (timeFilter === '30days') {
      return Array.from({ length: 15 }, (_, i) => ({
        label: `Day ${i * 2 + 1}`,
        liters: Math.floor(180 + Math.random() * 120),
        purity: Math.floor(88 + Math.random() * 8)
      }));
    }
    // Default 7 Days
    return [
      { label: 'Mon', liters: 210, purity: 93.2 },
      { label: 'Tue', liters: 245, purity: 94.0 },
      { label: 'Wed', liters: 198, purity: 91.5 },
      { label: 'Thu', liters: 260, purity: 92.8 },
      { label: 'Fri', liters: 285, purity: 95.1 },
      { label: 'Sat', liters: 310, purity: 93.8 },
      { label: 'Sun', liters: 290, purity: 94.6 }
    ];
  }, [timeFilter]);

  // Quality distribution pie data
  const qualityDistribution = React.useMemo(() => {
    const excellent = tests.filter((t) => t.classification === 'EXCELLENT').length;
    const good = tests.filter((t) => t.classification === 'GOOD').length;
    const suspicious = tests.filter((t) => t.classification === 'SUSPICIOUS').length;
    const reject = tests.filter((t) => t.classification === 'REJECT').length;

    const total = excellent + good + suspicious + reject;
    if (total === 0) {
      return [{ name: 'No Tests Recorded', value: 1, color: '#cbd5e1' }];
    }

    return [
      { name: 'Excellent (Optimal)', value: excellent, color: '#0d9488' },
      { name: 'Good (Standard)', value: good, color: '#3b82f6' },
      { name: 'Suspicious (Warning)', value: suspicious, color: '#f59e0b' },
      { name: 'Rejected (Anomaly)', value: reject, color: '#e11d48' }
    ].filter((item) => item.value > 0);
  }, [tests]);

  const recentTests = tests.slice(0, 7);

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'ACCEPTED':
        return <Badge variant="success">ACCEPTED</Badge>;
      case 'WARNING':
        return <Badge variant="warning">WARNING</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">REJECTED</Badge>;
      default:
        return <Badge variant="neutral">{result}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Backend Offline Warning Banner (Connected Mode Only) */}
      {!isDemoMode && connectionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Connected Mode: Backend API Offline
              </h4>
              <p className="text-xs text-rose-700/90 mt-0.5">
                {connectionError} Ensure the Express server is running on port 5000, or switch back to Demo Mode.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshData()}
              className="border-rose-300 text-rose-800 hover:bg-rose-100"
            >
              Retry Connection
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setDemoMode(true)}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Switch to Demo Mode
            </Button>
          </div>
        </div>
      )}

      {/* Quick Action Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-dairy-900 via-slate-900 to-slate-900 text-white shadow-md">
        <div>
          <h2 className="text-base font-extrabold tracking-tight">Dairy Intake Control Panel</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Active Station: <strong>Bay-A Dock</strong> • Ready for intake measurement
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/milk-testing')}
            className="shadow-lg shadow-dairy-600/40"
            icon={<FlaskConical className="w-4 h-4" />}
          >
            Start Milk Test
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/farmers')}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Farmer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/collection')}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            icon={<Coins className="w-4 h-4" />}
          >
            Collection Ledger
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/reports')}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            icon={<FileText className="w-4 h-4" />}
          >
            Audit Reports
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Milk Intake"
          value={summary.todayCollectionLiters.toLocaleString()}
          unit="L"
          change={summary.collectionGrowthPercent}
          changeLabel="vs yesterday"
          icon={<Milk className="w-5 h-5" />}
          iconBg="bg-dairy-50 text-dairy-600"
        />

        <StatCard
          title="Milk Tests Performed"
          value={summary.totalTestsToday}
          subtitle={`${summary.acceptedCount} Accepted • ${summary.rejectedCount} Rejected`}
          icon={<FlaskConical className="w-5 h-5" />}
          iconBg="bg-sky-50 text-sky-600"
          badge={
            <Badge variant="success" size="sm">
              {((summary.acceptedCount / (summary.totalTestsToday || 1)) * 100).toFixed(0)}% Pass
            </Badge>
          }
        />

        <StatCard
          title="Average Purity Score"
          value={`${summary.averagePurityScore}%`}
          change={+1.2}
          changeLabel="purity trend"
          icon={<ShieldCheck className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
          badge={<Badge variant="primary" size="sm">Grade A</Badge>}
        />

        <StatCard
          title="Active Dairy Farmers"
          value={summary.activeFarmers}
          subtitle="Registered co-op suppliers"
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Collection Trend Chart */}
        <ChartCard
          title="Milk Intake Volume (Litres)"
          subtitle="Real-time collection volume across testing sessions"
          className="lg:col-span-2"
          action={
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setTimeFilter('today')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeFilter === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeFilter('7days')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeFilter === '7days' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeFilter('30days')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeFilter === '30days' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                30 Days
              </button>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none'
                }}
              />
              <Area
                type="monotone"
                dataKey="liters"
                name="Volume (L)"
                stroke="#0d9488"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorLiters)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Quality Classification Distribution */}
        <ChartCard
          title="Quality Grade Distribution"
          subtitle="Proportion of tests by purity grade"
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={qualityDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {qualityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none'
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Milk Tests Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Milk Quality Tests</h3>
            <p className="text-xs text-slate-500">
              Live automated sensor readings and purity determinations
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/history')}>
            View Full History
          </Button>
        </div>

        <DataTable<MilkTest>
          data={recentTests}
          keyExtractor={(t) => t.testId}
          onRowClick={(t) => setSelectedTest(t)}
          columns={[
            {
              header: 'Test ID',
              accessor: (t) => <span className="font-mono font-bold text-slate-800">{t.testId}</span>
            },
            {
              header: 'Date / Time',
              accessor: (t) => (
                <span className="text-slate-500">
                  {new Date(t.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                  {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )
            },
            {
              header: 'Farmer',
              accessor: (t) => (
                <div>
                  <p className="font-bold text-slate-800">{t.farmerName}</p>
                  <p className="text-[10px] text-slate-400">{t.farmerId}</p>
                </div>
              )
            },
            {
              header: 'Quantity',
              accessor: (t) => <span className="font-bold font-mono text-slate-800">{t.quantity} L</span>
            },
            {
              header: 'Fat %',
              accessor: (t) => <span className="font-mono font-semibold">{t.fat}%</span>
            },
            {
              header: 'pH',
              accessor: (t) => <span className="font-mono font-semibold">{t.ph}</span>
            },
            {
              header: 'Density',
              accessor: (t) => <span className="font-mono text-slate-600">{t.density}</span>
            },
            {
              header: 'EC (mS/cm)',
              accessor: (t) => <span className="font-mono text-slate-600">{t.conductivity}</span>
            },
            {
              header: 'Purity Score',
              accessor: (t) => (
                <span className="font-bold font-mono text-slate-900">{t.qualityScore}%</span>
              )
            },
            {
              header: 'Result',
              accessor: (t) => getResultBadge(t.result)
            },
            {
              header: 'Action',
              align: 'right',
              accessor: (t) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTest(t);
                  }}
                  icon={<Eye className="w-3.5 h-3.5" />}
                >
                  Inspect
                </Button>
              )
            }
          ]}
        />
      </div>

      {/* Test Inspection Modal */}
      {selectedTest && (
        <Modal
          isOpen={!!selectedTest}
          onClose={() => setSelectedTest(null)}
          title={`Test Inspection: ${selectedTest.testId}`}
          description={`Delivered by ${selectedTest.farmerName} (${selectedTest.farmerId}) on ${new Date(
            selectedTest.timestamp
          ).toLocaleString()}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Top Score Summary Banner */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Assessment</span>
                <span className="text-2xl font-black">{selectedTest.classification} ({selectedTest.qualityScore}%)</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Determination</span>
                {getResultBadge(selectedTest.result)}
              </div>
            </div>

            {/* Parameter Analysis breakdown */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Multi-Sensor Diagnostics
              </h4>
              <ParameterAnalysisTable
                quality={QualityCalculator.calculate(
                  {
                    deviceId: selectedTest.deviceId,
                    timestamp: selectedTest.timestamp.toString(),
                    temperature: selectedTest.temperature,
                    ph: selectedTest.ph,
                    fat: selectedTest.fat,
                    density: selectedTest.density,
                    conductivity: selectedTest.conductivity,
                    milkLevel: selectedTest.quantity
                  },
                  settings.thresholds
                )}
              />
            </div>

            {/* Financial Details if accepted */}
            {selectedTest.result !== 'REJECTED' && (
              <div className="p-4 rounded-xl bg-dairy-50/70 border border-dairy-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-600">Calculated Payout Rate:</span>
                  <p className="font-bold text-sm text-dairy-900 font-mono">₹{selectedTest.ratePerLiter} / Litre</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-600">Total Batch Amount:</span>
                  <p className="font-bold text-base text-dairy-900 font-mono">₹{selectedTest.totalAmount?.toLocaleString()}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="primary" size="sm" onClick={() => setSelectedTest(null)}>
                Close Inspection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
