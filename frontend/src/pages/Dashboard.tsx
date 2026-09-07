import React, { useState, useMemo } from 'react';
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
import { MilkTest, MilkCollection } from '../types';
import {
  Milk,
  FlaskConical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Users,
  Cpu,
  Plus,
  Coins,
  Receipt,
  FileText,
  Eye,
  Activity,
  TrendingUp,
  Droplets,
  ArrowRight
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
  const { isDemoMode, setDemoMode, connectionError, refreshData, summary, tests, collections, farmers } = useDemoData();
  const { settings } = useSettings();

  const [timeFilter, setTimeFilter] = useState<'today' | '7days' | '30days'>('7days');
  const [selectedTest, setSelectedTest] = useState<MilkTest | null>(null);

  // Today calculations
  const todayStats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayTests = tests.filter((t) => new Date(t.timestamp).toDateString() === todayStr);
    const todayCollections = collections.filter((c) => new Date(c.timestamp).toDateString() === todayStr);

    const acceptedTests = todayTests.filter((t) => t.result !== 'REJECTED');
    const rejectedTests = todayTests.filter((t) => t.result === 'REJECTED');

    const acceptedVolume = acceptedTests.reduce((sum, t) => sum + t.quantity, 0);
    const rejectedVolume = rejectedTests.reduce((sum, t) => sum + t.quantity, 0);
    const revenue = todayCollections.reduce((sum, c) => sum + c.totalAmount, 0);

    const avgFat =
      todayTests.length > 0
        ? Number((todayTests.reduce((sum, t) => sum + t.fat, 0) / todayTests.length).toFixed(2))
        : tests.length > 0
        ? Number((tests.slice(0, 10).reduce((sum, t) => sum + t.fat, 0) / Math.min(10, tests.length)).toFixed(2))
        : 4.5;

    return {
      acceptedVolume: Number(acceptedVolume.toFixed(1)),
      rejectedVolume: Number(rejectedVolume.toFixed(1)),
      revenue: Number(revenue.toFixed(2)),
      avgFat,
      todayTestsCount: todayTests.length
    };
  }, [tests, collections]);

  // Dynamic Chart Data computed from real collections
  const chartData = useMemo(() => {
    const map = new Map<string, { label: string; liters: number; revenue: number }>();
    const now = new Date();

    if (timeFilter === 'today') {
      for (let h = 6; h <= 20; h += 2) {
        const hourStr = `${String(h).padStart(2, '0')}:00`;
        map.set(hourStr, { label: hourStr, liters: 0, revenue: 0 });
      }

      const todayStr = now.toDateString();
      collections
        .filter((c) => new Date(c.timestamp).toDateString() === todayStr)
        .forEach((c) => {
          const h = new Date(c.timestamp).getHours();
          const bucketHour = Math.floor(h / 2) * 2;
          const bucketStr = `${String(bucketHour).padStart(2, '0')}:00`;
          const existing = map.get(bucketStr) || { label: bucketStr, liters: 0, revenue: 0 };
          existing.liters = Number((existing.liters + c.quantity).toFixed(1));
          existing.revenue = Number((existing.revenue + c.totalAmount).toFixed(2));
          map.set(bucketStr, existing);
        });

      return Array.from(map.values());
    }

    const numDays = timeFilter === '7days' ? 7 : 14;
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      const fullDateStr = d.toDateString();

      const dayCols = collections.filter((c) => new Date(c.timestamp).toDateString() === fullDateStr);
      const liters = dayCols.reduce((sum, c) => sum + c.quantity, 0);
      const revenue = dayCols.reduce((sum, c) => sum + c.totalAmount, 0);

      map.set(dateKey, {
        label: dateKey,
        liters: Number(liters.toFixed(1)),
        revenue: Number(revenue.toFixed(2))
      });
    }

    return Array.from(map.values());
  }, [collections, timeFilter]);

  // Dynamic Milk Purity Trend computed from actual test results
  const purityTrendData = useMemo(() => {
    if (tests.length === 0) return [];
    return tests
      .slice(0, 12)
      .reverse()
      .map((t) => ({
        label: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        purity: t.purityScore || t.qualityScore,
        fat: t.fat,
        result: t.result
      }));
  }, [tests]);

  // Quality distribution pie data
  const qualityDistribution = useMemo(() => {
    const excellent = tests.filter((t) => t.classification === 'EXCELLENT').length;
    const good = tests.filter((t) => t.classification === 'GOOD').length;
    const suspicious = tests.filter((t) => t.classification === 'SUSPICIOUS').length;
    const reject = tests.filter((t) => t.classification === 'REJECT').length;

    const total = excellent + good + suspicious + reject;
    if (total === 0) {
      return [{ name: 'No Tests Recorded', value: 1, color: '#cbd5e1' }];
    }

    return [
      { name: 'Optimal (Accepted)', value: excellent, color: '#0d9488' },
      { name: 'Standard (Accepted)', value: good, color: '#3b82f6' },
      { name: 'Warning (Monitored)', value: suspicious, color: '#f59e0b' },
      { name: 'Rejected (Anomaly)', value: reject, color: '#e11d48' }
    ].filter((item) => item.value > 0);
  }, [tests]);

  const recentTests = useMemo(() => tests.slice(0, 6), [tests]);
  const recentCollections = useMemo(() => collections.slice(0, 6), [collections]);

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
          <h2 className="text-base font-extrabold tracking-tight">Dairy Intake Control Station</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Active Station: <strong>Bay-A Dock</strong> • Real-time quality screening & collection
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
            Collections
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/ledger')}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            icon={<Receipt className="w-4 h-4" />}
          >
            Ledger
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/analytics')}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            icon={<TrendingUp className="w-4 h-4" />}
          >
            Analytics
          </Button>
        </div>
      </div>

      {/* 8 SUMMARY CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Farmers"
          value={farmers.length}
          subtitle={`${summary.activeFarmers} active delivering`}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-indigo-50 text-indigo-600"
        />

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
          title="Today's Accepted Milk"
          value={todayStats.acceptedVolume.toLocaleString()}
          unit="L"
          subtitle={`${summary.acceptedCount} batches accepted`}
          icon={<CheckCircle className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Today's Rejected Milk"
          value={todayStats.rejectedVolume.toLocaleString()}
          unit="L"
          subtitle={`${summary.rejectedCount} batches rejected`}
          icon={<XCircle className="w-5 h-5" />}
          iconBg="bg-rose-50 text-rose-600"
        />

        <StatCard
          title="Today's Procurement Revenue"
          value={`₹${todayStats.revenue.toLocaleString()}`}
          subtitle="Total dues calculated for today"
          icon={<Coins className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Avg Estimated Fat %"
          value={`${todayStats.avgFat}%`}
          subtitle="Non-certified sensor estimation"
          icon={<Droplets className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Average Milk Purity Score"
          value={`${summary.averagePurityScore}%`}
          subtitle={`${summary.totalTestsToday} tests performed today`}
          icon={<ShieldCheck className="w-5 h-5" />}
          iconBg="bg-sky-50 text-sky-600"
        />

        <StatCard
          title="Active System Alerts"
          value={summary.activeAlertsCount}
          subtitle="Parameter deviations flagged"
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg={summary.activeAlertsCount > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500"}
          badge={
            summary.activeAlertsCount > 0 ? (
              <Badge variant="warning" size="sm">Action Req</Badge>
            ) : (
              <Badge variant="success" size="sm">Normal</Badge>
            )
          }
        />
      </div>

      {/* Quality Overview Breakdown Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Today's Quality Screening Overview</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Breakdown of automated multi-sensor test determinations for current operational shift
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700">ACCEPTED:</span>
            <span className="text-xs font-mono font-extrabold text-emerald-600">{summary.acceptedCount} batches</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700">WARNING:</span>
            <span className="text-xs font-mono font-extrabold text-amber-600">{summary.warningCount} batches</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700">REJECTED:</span>
            <span className="text-xs font-mono font-extrabold text-rose-600">{summary.rejectedCount} batches</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Collection Trend Chart */}
        <ChartCard
          title="Milk Intake Volume Trend (Litres)"
          subtitle="Real-time collection volume dynamically aggregated from verified collections"
          className="lg:col-span-2"
          action={
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setTimeFilter('today')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeFilter === 'today' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeFilter('7days')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeFilter === '7days' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeFilter('30days')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeFilter === '30days' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                14 Days
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
                formatter={(val: any) => [`${val} L`, 'Volume']}
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
          subtitle="Proportion of tests across historical batch records"
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

      {/* Dedicated Milk Purity Screening Trend Chart */}
      <ChartCard
        title="Milk Purity Score Screening Trend (%)"
        subtitle="Chronological sequence of purity scores across recent milk intake tests (Model: screening-baseline-v1)"
      >
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={purityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPurity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                border: 'none'
              }}
              formatter={(val: any) => [`${val}%`, 'Purity Score']}
            />
            <Area
              type="monotone"
              dataKey="purity"
              name="Purity Score (%)"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorPurity)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Two-Column Recent Data Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Milk Tests Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Recent Quality & Purity Tests</h3>
              <p className="text-[11px] text-slate-500">Multi-parameter automated intake screenings</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/history')}
              className="text-xs py-1 px-2.5 h-auto"
            >
              All Tests <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <DataTable<MilkTest>
            data={recentTests}
            keyExtractor={(t) => t.testId}
            onRowClick={(t) => setSelectedTest(t)}
            columns={[
              {
                header: 'Test ID',
                accessor: (t) => <span className="font-mono font-bold text-slate-800 text-xs">{t.testId}</span>
              },
              {
                header: 'Farmer',
                accessor: (t) => (
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">{t.farmerName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{t.farmerId}</span>
                  </div>
                )
              },
              {
                header: 'Volume',
                accessor: (t) => <span className="font-mono font-bold text-slate-800 text-xs">{t.quantity} L</span>
              },
              {
                header: 'Est. Fat',
                accessor: (t) => <span className="font-mono font-semibold text-xs">{t.fat}%</span>
              },
              {
                header: 'Purity Score',
                accessor: (t) => <span className="font-mono font-bold text-slate-900 text-xs">{t.purityScore || t.qualityScore}%</span>
              },
              {
                header: 'Recommendation',
                accessor: (t) => {
                  const rec = t.aiRecommendation || (t.result === 'ACCEPTED' ? 'ACCEPT' : t.result === 'WARNING' ? 'REVIEW' : 'REJECT');
                  return (
                    <Badge variant={rec === 'ACCEPT' ? 'success' : rec === 'REVIEW' ? 'warning' : 'danger'} size="sm">
                      {rec}
                    </Badge>
                  );
                }
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
                    className="p-1 h-auto"
                    icon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Inspect
                  </Button>
                )
              }
            ]}
          />
        </div>

        {/* Recent Collections Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Recent Intake Collections</h3>
              <p className="text-[11px] text-slate-500">Delivered batches recorded into ledger</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/collection')}
              className="text-xs py-1 px-2.5 h-auto"
            >
              All Collections <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <DataTable<MilkCollection>
            data={recentCollections}
            keyExtractor={(c) => c.collectionId}
            columns={[
              {
                header: 'Collection ID',
                accessor: (c) => <span className="font-mono font-bold text-dairy-700 text-xs">{c.collectionId}</span>
              },
              {
                header: 'Farmer',
                accessor: (c) => (
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">{c.farmerName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{c.farmerId}</span>
                  </div>
                )
              },
              {
                header: 'Volume',
                accessor: (c) => <span className="font-mono font-bold text-slate-800 text-xs">{c.quantity} L</span>
              },
              {
                header: 'Rate (₹/L)',
                accessor: (c) => <span className="font-mono text-xs">₹{c.rate.toFixed(2)}</span>
              },
              {
                header: 'Total Dues',
                accessor: (c) => <span className="font-mono font-bold text-emerald-600 text-xs">₹{c.totalAmount.toFixed(2)}</span>
              },
              {
                header: 'Status',
                accessor: (c) => (
                  <Badge variant={(c.paymentStatus || 'PAID') === 'PAID' ? 'success' : 'warning'} size="sm">
                    {c.paymentStatus || 'PAID'}
                  </Badge>
                )
              }
            ]}
          />
        </div>
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
                Multi-Sensor Diagnostics & Reference Benchmarks
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
export default Dashboard;

