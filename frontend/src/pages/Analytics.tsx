import React, { useState, useMemo } from 'react';
import { useDemoData } from '../context/DemoDataContext';
import { StatCard } from '../components/common/StatCard';
import { ChartCard } from '../components/common/ChartCard';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  BarChart3,
  TrendingUp,
  Milk,
  Coins,
  ShieldCheck,
  Droplets,
  Calendar,
  Layers,
  Award,
  Filter,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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

export const Analytics: React.FC = () => {
  const { tests, collections, farmers, isDemoMode } = useDemoData();
  const [timeFilter, setTimeFilter] = useState<'today' | '7days' | '30days' | 'all'>('7days');

  // Filter collections and tests based on selected time window
  const { filteredTests, filteredCollections } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const msInDay = 24 * 60 * 60 * 1000;

    let cutoff = 0;
    if (timeFilter === 'today') {
      cutoff = startOfToday;
    } else if (timeFilter === '7days') {
      cutoff = now.getTime() - 7 * msInDay;
    } else if (timeFilter === '30days') {
      cutoff = now.getTime() - 30 * msInDay;
    } else {
      cutoff = 0; // all-time
    }

    const t = tests.filter((item) => new Date(item.timestamp).getTime() >= cutoff);
    const c = collections.filter((item) => new Date(item.timestamp).getTime() >= cutoff);
    return { filteredTests: t, filteredCollections: c };
  }, [tests, collections, timeFilter]);

  // Aggregate stats
  const totalVolume = useMemo(
    () => filteredCollections.reduce((sum, c) => sum + c.quantity, 0),
    [filteredCollections]
  );
  const totalRevenue = useMemo(
    () => filteredCollections.reduce((sum, c) => sum + c.totalAmount, 0),
    [filteredCollections]
  );
  const avgFat = useMemo(() => {
    if (filteredCollections.length === 0) return 0;
    const sum = filteredCollections.reduce((s, c) => s + c.fat, 0);
    return Number((sum / filteredCollections.length).toFixed(2));
  }, [filteredCollections]);

  const avgQualityScore = useMemo(() => {
    if (filteredTests.length === 0) return 0;
    const sum = filteredTests.reduce((s, t) => s + t.qualityScore, 0);
    return Number((sum / filteredTests.length).toFixed(1));
  }, [filteredTests]);

  const acceptedCount = useMemo(
    () => filteredTests.filter((t) => t.result === 'ACCEPTED').length,
    [filteredTests]
  );
  const warningCount = useMemo(
    () => filteredTests.filter((t) => t.result === 'WARNING').length,
    [filteredTests]
  );
  const rejectedCount = useMemo(
    () => filteredTests.filter((t) => t.result === 'REJECTED').length,
    [filteredTests]
  );
  const totalTests = filteredTests.length;
  const passRate = totalTests > 0 ? Number(((acceptedCount / totalTests) * 100).toFixed(1)) : 0;

  // 1. Intake & Revenue Trend Data
  const volumeRevenueTrend = useMemo(() => {
    const map = new Map<string, { date: string; liters: number; amount: number; count: number }>();
    const sortedCollections = [...filteredCollections].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sortedCollections.forEach((c) => {
      const d = new Date(c.timestamp);
      const key =
        timeFilter === 'today'
          ? `${String(d.getHours()).padStart(2, '0')}:00`
          : `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

      const existing = map.get(key) || { date: key, liters: 0, amount: 0, count: 0 };
      existing.liters = Number((existing.liters + c.quantity).toFixed(1));
      existing.amount = Number((existing.amount + c.totalAmount).toFixed(2));
      existing.count += 1;
      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [filteredCollections, timeFilter]);

  // 2. Quality Score & Fat Trend
  const qualityFatTrend = useMemo(() => {
    const map = new Map<string, { date: string; avgScore: number; avgFat: number; totalScore: number; totalFat: number; count: number }>();
    const sortedTests = [...filteredTests].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sortedTests.forEach((t) => {
      const d = new Date(t.timestamp);
      const key =
        timeFilter === 'today'
          ? `${String(d.getHours()).padStart(2, '0')}:00`
          : `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

      const existing = map.get(key) || { date: key, avgScore: 0, avgFat: 0, totalScore: 0, totalFat: 0, count: 0 };
      existing.totalScore += t.qualityScore;
      existing.totalFat += t.fat;
      existing.count += 1;
      existing.avgScore = Number((existing.totalScore / existing.count).toFixed(1));
      existing.avgFat = Number((existing.totalFat / existing.count).toFixed(2));
      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [filteredTests, timeFilter]);

  // 3. Quality Distribution
  const qualityPieData = useMemo(() => {
    return [
      { name: 'Accepted (Optimal)', value: acceptedCount, color: '#0d9488' },
      { name: 'Warning (Monitored)', value: warningCount, color: '#f59e0b' },
      { name: 'Rejected (Anomaly)', value: rejectedCount, color: '#e11d48' }
    ].filter((item) => item.value > 0);
  }, [acceptedCount, warningCount, rejectedCount]);

  // 4. Top Farmer Contributions
  const topFarmersData = useMemo(() => {
    const map = new Map<string, { name: string; liters: number; amount: number }>();
    filteredCollections.forEach((c) => {
      const name = c.farmerName || c.farmerId;
      const existing = map.get(name) || { name, liters: 0, amount: 0 };
      existing.liters = Number((existing.liters + c.quantity).toFixed(1));
      existing.amount = Number((existing.amount + c.totalAmount).toFixed(2));
      map.set(name, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => b.liters - a.liters)
      .slice(0, 6);
  }, [filteredCollections]);

  // 5. Parameter Averages
  const parameterAverages = useMemo(() => {
    if (filteredTests.length === 0) {
      return [
        { param: 'pH Level', avg: 6.65, min: 6.5, max: 6.8, unit: 'pH' },
        { param: 'Estimated Fat', avg: 4.5, min: 3.5, max: 6.5, unit: '%' },
        { param: 'Density', avg: 1.029, min: 1.026, max: 1.034, unit: 'g/mL' },
        { param: 'Conductivity', avg: 5.0, min: 4.0, max: 6.0, unit: 'mS/cm' },
        { param: 'Temperature', avg: 23.5, min: 15.0, max: 30.0, unit: '°C' }
      ];
    }
    const count = filteredTests.length;
    const avgPh = Number((filteredTests.reduce((s, t) => s + t.ph, 0) / count).toFixed(2));
    const avgFatVal = Number((filteredTests.reduce((s, t) => s + t.fat, 0) / count).toFixed(2));
    const avgDensity = Number((filteredTests.reduce((s, t) => s + t.density, 0) / count).toFixed(4));
    const avgCond = Number((filteredTests.reduce((s, t) => s + t.conductivity, 0) / count).toFixed(2));
    const avgTemp = Number((filteredTests.reduce((s, t) => s + t.temperature, 0) / count).toFixed(1));

    return [
      { param: 'pH Level', avg: avgPh, min: 6.5, max: 6.8, unit: 'pH' },
      { param: 'Estimated Fat', avg: avgFatVal, min: 3.5, max: 6.5, unit: '%' },
      { param: 'Density', avg: avgDensity, min: 1.026, max: 1.034, unit: 'g/mL' },
      { param: 'Conductivity', avg: avgCond, min: 4.0, max: 6.0, unit: 'mS/cm' },
      { param: 'Temperature', avg: avgTemp, min: 15.0, max: 30.0, unit: '°C' }
    ];
  }, [filteredTests]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-dairy-600" />
            Dairy Analytics & Quality Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational trends, multi-sensor parameter benchmarks, and supplier contribution analytics
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl shadow-sm self-start sm:self-auto">
          <button
            onClick={() => setTimeFilter('today')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              timeFilter === 'today'
                ? 'bg-dairy-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeFilter('7days')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              timeFilter === '7days'
                ? 'bg-dairy-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeFilter('30days')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              timeFilter === '30days'
                ? 'bg-dairy-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              timeFilter === 'all'
                ? 'bg-dairy-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* Analytics Disclaimer Note */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-dairy-600 shrink-0" />
          <span>
            Analytics calculated strictly from recorded batch intake records ({timeFilter.toUpperCase()} window). Sensor readings represent multi-parameter screening metrics.
          </span>
        </div>
        <Badge variant="primary" size="sm">
          {isDemoMode ? 'Demo Analytics Mode' : 'Connected API Analytics'}
        </Badge>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Period Milk Intake"
          value={totalVolume.toLocaleString()}
          unit="L"
          subtitle={`${filteredCollections.length} batches delivered`}
          icon={<Milk className="w-5 h-5" />}
          iconBg="bg-dairy-50 text-dairy-600"
        />

        <StatCard
          title="Procurement Value"
          value={`₹${totalRevenue.toLocaleString()}`}
          subtitle={`Avg ₹${(totalRevenue / (totalVolume || 1)).toFixed(2)}/L`}
          icon={<Coins className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Avg Quality Score"
          value={`${avgQualityScore}%`}
          subtitle={`${passRate}% Acceptance rate`}
          icon={<ShieldCheck className="w-5 h-5" />}
          iconBg="bg-sky-50 text-sky-600"
          badge={
            <Badge variant={avgQualityScore >= 90 ? 'success' : avgQualityScore >= 75 ? 'primary' : 'warning'} size="sm">
              {avgQualityScore >= 90 ? 'Optimal' : avgQualityScore >= 75 ? 'Standard' : 'Caution'}
            </Badge>
          }
        />

        <StatCard
          title="Avg Estimated Fat"
          value={`${avgFat}%`}
          subtitle="Non-certified sensor estimation"
          icon={<Droplets className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Charts Row 1: Volume & Revenue Trend + Quality Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Milk Intake Volume & Revenue Trend"
            subtitle="Daily milk volume (Litres) and total procurement payout (INR ₹)"
          >
            <div className="h-72 w-full">
              {volumeRevenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={volumeRevenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(val: any, name: string) => [
                        name === 'liters' ? `${val} L` : `₹${val}`,
                        name === 'liters' ? 'Intake Volume' : 'Procurement Value'
                      ]}
                    />
                    <Area type="monotone" dataKey="liters" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#volGrad)" name="liters" />
                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#revGrad)" name="amount" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                  No intake records found for the selected period
                </div>
              )}
            </div>
          </ChartCard>
        </div>

        <div>
          <ChartCard
            title="Batch Quality Distribution"
            subtitle="Testing outcome proportions across active period"
          >
            <div className="h-72 w-full flex flex-col items-center justify-center">
              {qualityPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qualityPieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {qualityPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '10px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px'
                      }}
                    />
                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-xs font-semibold">No tests in period</div>
              )}
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Charts Row 2: Quality Score vs Fat Trend + Top Farmer Contributors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Quality Score & Estimated Fat Trend"
          subtitle="Correlation between average purity score (%) and estimated fat content (%)"
        >
          <div className="h-64 w-full">
            {qualityFatTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qualityFatTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                    formatter={(val: any, name: string) => [
                      name === 'avgScore' ? `${val}%` : `${val}%`,
                      name === 'avgScore' ? 'Avg Quality Score' : 'Avg Estimated Fat'
                    ]}
                  />
                  <Line type="monotone" dataKey="avgScore" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 3 }} name="avgScore" />
                  <Line type="monotone" dataKey="avgFat" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="avgFat" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                No quality records found
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Top Supplier Volume Contributions"
          subtitle="Highest volume delivering farmers in selected period"
        >
          <div className="h-64 w-full">
            {topFarmersData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFarmersData} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                    formatter={(val: any) => [`${val} Litres`, 'Total Intake']}
                  />
                  <Bar dataKey="liters" fill="#0d9488" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                No supplier data available
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Row 3: Parameter Benchmarking Averages */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-dairy-600" />
            Sensor Parameter Benchmark Averages
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Average multi-sensor readings recorded across all tests vs configured normal reference bounds
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
          {parameterAverages.map((p) => {
            const isWithin = p.avg >= p.min && p.avg <= p.max;
            return (
              <div key={p.param} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">{p.param}</span>
                  <Badge variant={isWithin ? 'success' : 'warning'} size="sm">
                    {isWithin ? 'In Range' : 'Variance'}
                  </Badge>
                </div>
                <div className="text-base font-extrabold text-slate-900">
                  {p.avg} <span className="text-xs font-normal text-slate-500">{p.unit}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Ref: {p.min} – {p.max} {p.unit}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default Analytics;
