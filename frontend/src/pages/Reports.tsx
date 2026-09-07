import React, { useState } from 'react';
import { useDemoData } from '../context/DemoDataContext';
import { StatCard } from '../components/common/StatCard';
import { ChartCard } from '../components/common/ChartCard';
import { DataTable } from '../components/common/DataTable';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Milk,
  BarChart3,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Calendar,
  Cpu,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { useToast } from '../context/ToastContext';

type ReportTab = 'daily' | 'monthly' | 'farmer' | 'quality' | 'rejection' | 'sensor';

export const Reports: React.FC = () => {
  const { tests, collections, farmers, devices } = useDemoData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ReportTab>('daily');

  // Daily report aggregate
  const dailyData = React.useMemo(() => {
    return [
      { date: '01-Sep', volume: 1140, payout: 46200, avgFat: 4.5, passRate: 98 },
      { date: '02-Sep', volume: 1220, payout: 49800, avgFat: 4.4, passRate: 96 },
      { date: '03-Sep', volume: 1180, payout: 47900, avgFat: 4.6, passRate: 100 },
      { date: '04-Sep', volume: 1290, payout: 52400, avgFat: 4.5, passRate: 95 },
      { date: '05-Sep', volume: 1310, payout: 53800, avgFat: 4.7, passRate: 99 },
      { date: '06-Sep', volume: 1260, payout: 51200, avgFat: 4.6, passRate: 97 },
      { date: '07-Sep', volume: 1280, payout: 52100, avgFat: 4.6, passRate: 96 }
    ];
  }, []);

  // Monthly breakdown aggregate
  const monthlyData = React.useMemo(() => {
    return [
      { month: 'Apr 2026', volume: 34200, payout: 1380000, avgFat: 4.4, avgScore: 93.1 },
      { month: 'May 2026', volume: 36800, payout: 1490000, avgFat: 4.5, avgScore: 94.0 },
      { month: 'Jun 2026', volume: 38900, payout: 1580000, avgFat: 4.6, avgScore: 93.8 },
      { month: 'Jul 2026', volume: 41200, payout: 1675000, avgFat: 4.5, avgScore: 94.6 },
      { month: 'Aug 2026', volume: 43500, payout: 1765000, avgFat: 4.6, avgScore: 95.2 },
      { month: 'Sep 2026 (MTD)', volume: 8680, payout: 353400, avgFat: 4.6, avgScore: 94.8 }
    ];
  }, []);

  // Farmer performance aggregate
  const farmerData = React.useMemo(() => {
    return farmers.map((f) => {
      const fTests = tests.filter((t) => t.farmerId === f.farmerId || (t.customerCode && t.customerCode === f.customerCode));
      const pass = fTests.filter((t) => t.result !== 'REJECTED').length;
      return {
        farmerId: f.farmerId,
        customerCode: f.customerCode,
        name: f.name,
        village: f.village,
        animalType: f.animalType,
        totalLiters: f.totalMilkSupplied || 0,
        testsCount: fTests.length || f.totalCollections || 0,
        passRate: fTests.length > 0 ? Math.round((pass / fTests.length) * 100) : 95,
        avgScore: f.averageQualityScore || 92
      };
    });
  }, [farmers, tests]);

  // Rejection Audit records
  const rejections = tests.filter((t) => t.result === 'REJECTED' || t.result === 'WARNING');

  // Sensor node audit
  const sensorAudit = devices.map((d) => {
    const dTests = tests.filter((t) => t.deviceId === d.deviceId);
    const activeSensorsCount = Object.values(d.sensors).filter(Boolean).length;
    return {
      deviceId: d.deviceId,
      name: d.name,
      status: d.status,
      location: d.location || 'Dock',
      firmware: d.firmwareVersion,
      testsConducted: dTests.length || 12,
      sensorHealth: `${activeSensorsCount} / 6 Probes OK`,
      lastSeen: d.lastSeen
    };
  });

  const handleExportCSV = () => {
    let headers = '';
    let rows: string[] = [];

    if (activeTab === 'daily') {
      headers = 'Date,Intake Volume (L),Total Payout (INR),Avg Fat (%),Pass Rate (%)';
      rows = dailyData.map((d) => `"${d.date}",${d.volume},${d.payout},${d.avgFat},${d.passRate}`);
    } else if (activeTab === 'monthly') {
      headers = 'Month,Total Volume (L),Total Payout (INR),Avg Fat (%),Avg Purity Score (%)';
      rows = monthlyData.map((m) => `"${m.month}",${m.volume},${m.payout},${m.avgFat},${m.avgScore}`);
    } else if (activeTab === 'farmer') {
      headers = 'Customer Code,Farmer ID,Farmer Name,Village,Animal Type,Total Litres,Tests Count,Pass Rate (%),Avg Purity Score (%)';
      rows = farmerData.map((f) => `"${f.customerCode || ''}","${f.farmerId}","${f.name}","${f.village}","${f.animalType}",${f.totalLiters},${f.testsCount},${f.passRate},${f.avgScore}`);
    } else if (activeTab === 'sensor') {
      headers = 'Device ID,Name,Status,Location,Firmware,Tests Conducted,Probe Health';
      rows = sensorAudit.map((s) => `"${s.deviceId}","${s.name}","${s.status}","${s.location}","${s.firmware}",${s.testsConducted},"${s.sensorHealth}"`);
    } else {
      headers = 'Test ID,Customer Code,Farmer ID,Farmer Name,Volume (L),Fat (%),pH,Purity Score (%),Classification,AI Recommendation,Operator Decision,Final Result,Warnings';
      rows = rejections.map((r) => `"${r.testId}","${r.customerCode || ''}","${r.farmerId}","${r.farmerName}",${r.quantity},${r.fat},${r.ph},${r.purityScore || r.qualityScore},"${r.classification || 'POOR'}","${r.aiRecommendation || (r.result === 'ACCEPTED' ? 'ACCEPT' : r.result === 'WARNING' ? 'REVIEW' : 'REJECT')}","${r.operatorDecision || (r.result === 'REJECTED' ? 'REJECT' : 'ACCEPT')}","${r.result}","${r.warnings.join(' | ')}"`);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dairy_${activeTab}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${activeTab.toUpperCase()} report exported as CSV`, 'success');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Quality Analytics & Dairy Operations Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational summaries, farmer performance audits, and rejection compliance reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintPDF}
            icon={<Printer className="w-4 h-4" />}
          >
            Print / PDF Report
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* 6 Report Type Selector Tabs */}
      <div className="flex rounded-2xl bg-white p-1.5 border border-slate-200/80 text-xs font-semibold text-slate-600 overflow-x-auto shadow-sm">
        {[
          { id: 'daily', label: '1. Daily Collection', icon: Milk },
          { id: 'monthly', label: '2. Monthly Summary', icon: Calendar },
          { id: 'farmer', label: '3. Farmer Performance', icon: FileText },
          { id: 'quality', label: '4. Parameter Diagnostics', icon: BarChart3 },
          { id: 'rejection', label: '5. Rejection Log', icon: AlertTriangle },
          { id: 'sensor', label: '6. IoT Sensor Telemetry', icon: Cpu }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-dairy-600 text-white font-bold shadow-sm shadow-dairy-600/30'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Daily Collection */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="7-Day Volume Intake"
              value="8,680 L"
              subtitle="Daily average: 1,240 L"
              icon={<Milk className="w-5 h-5" />}
              iconBg="bg-dairy-50 text-dairy-600"
            />
            <StatCard
              title="Total Weekly Payout"
              value="₹3,53,400"
              subtitle="Settled across registered producers"
              icon={<FileText className="w-5 h-5" />}
              iconBg="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              title="Average Intake Pass Rate"
              value="97.4%"
              badge={<Badge variant="success" size="sm">Target Met</Badge>}
              icon={<CheckCircle2 className="w-5 h-5" />}
              iconBg="bg-sky-50 text-sky-600"
            />
          </div>

          <ChartCard
            title="Daily Intake Volume & Total Payout"
            subtitle="Comparing daily collected volume (L) against daily payment disbursements (₹)"
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="volume" name="Volume (L)" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Tab 2: Monthly Summary */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="FY 2026 Cumulative Volume"
              value="2,03,280 L"
              subtitle="Across 6 collection months"
              icon={<TrendingUp className="w-5 h-5" />}
              iconBg="bg-dairy-50 text-dairy-600"
            />
            <StatCard
              title="Cumulative Payout Disbursed"
              value="₹82,43,400"
              subtitle="Direct bank transfer settlements"
              icon={<FileText className="w-5 h-5" />}
              iconBg="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              title="Monthly Growth Average"
              value="+7.2%"
              badge={<Badge variant="success" size="sm">Positive</Badge>}
              icon={<CheckCircle2 className="w-5 h-5" />}
              iconBg="bg-sky-50 text-sky-600"
            />
          </div>

          <ChartCard
            title="Monthly Milk Volume Inflow Trend"
            subtitle="Historical volume trajectory in liters"
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="monthlyVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                <Area type="monotone" dataKey="volume" name="Volume (L)" stroke="#0d9488" strokeWidth={2.5} fill="url(#monthlyVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Tab 3: Farmer Performance */}
      {activeTab === 'farmer' && (
        <div className="space-y-4">
          <DataTable
            data={farmerData}
            keyExtractor={(f) => f.farmerId}
            columns={[
              {
                header: 'Code',
                accessor: (f) => (
                  <span className="font-mono text-xs font-black text-dairy-700 bg-dairy-50 px-2 py-0.5 rounded border border-dairy-200">
                    {f.customerCode || f.farmerId}
                  </span>
                )
              },
              {
                header: 'Farmer Name',
                accessor: (f) => (
                  <div>
                    <span className="font-bold text-slate-900 block">{f.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">{f.farmerId}</span>
                  </div>
                )
              },
              {
                header: 'Village',
                accessor: (f) => <span className="text-slate-600">{f.village}</span>
              },
              {
                header: 'Herd Type',
                accessor: (f) => <Badge variant="primary" size="sm">{f.animalType}</Badge>
              },
              {
                header: 'Total Supplied',
                accessor: (f) => <span className="font-mono font-bold">{f.totalLiters.toLocaleString()} L</span>
              },
              {
                header: 'Pass Rate',
                accessor: (f) => (
                  <Badge variant={f.passRate >= 95 ? 'success' : f.passRate >= 85 ? 'warning' : 'danger'} size="sm">
                    {f.passRate}%
                  </Badge>
                )
              },
              {
                header: 'Avg Purity Score',
                accessor: (f) => <span className="font-mono font-bold text-dairy-800">{f.avgScore}%</span>
              }
            ]}
          />
        </div>
      )}

      {/* Tab 4: Quality & Parameter Diagnostics */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Average Parameter Compliance" subtitle="Mean sensor readings vs standard dairy benchmarks">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={[
                    { param: 'pH (Target: 6.6)', value: 6.64, benchmark: 6.6 },
                    { param: 'Fat % (Target: 4.5)', value: 4.8, benchmark: 4.5 },
                    { param: 'EC mS/cm (Target: 5.0)', value: 5.1, benchmark: 5.0 },
                    { param: 'Temp °C (Target: 24.0)', value: 24.2, benchmark: 24.0 }
                  ]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="param" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                  <Bar dataKey="value" name="Current Average" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Quality Score Stability" subtitle="Purity score consistency across morning and evening shifts">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart
                  data={[
                    { shift: '01 Morning', score: 94.2 },
                    { shift: '01 Evening', score: 93.8 },
                    { shift: '02 Morning', score: 95.1 },
                    { shift: '02 Evening', score: 92.4 },
                    { shift: '03 Morning', score: 96.0 },
                    { shift: '03 Evening', score: 94.5 }
                  ]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="shift" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[80, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                  />
                  <Line type="monotone" dataKey="score" name="Avg Score (%)" stroke="#0d9488" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Tab 5: Rejection & Anomaly Log */}
      {activeTab === 'rejection' && (
        <div className="space-y-4">
          <DataTable
            data={rejections}
            keyExtractor={(r) => r.testId}
            columns={[
              {
                header: 'Test ID',
                accessor: (r) => <span className="font-mono font-bold text-slate-800">{r.testId}</span>
              },
              {
                header: 'Farmer',
                accessor: (r) => (
                  <div>
                    <p className="font-bold text-slate-800">{r.farmerName}</p>
                    <p className="text-[10px] text-slate-400">{r.farmerId}</p>
                  </div>
                )
              },
              {
                header: 'Volume',
                accessor: (r) => <span className="font-mono font-bold">{r.quantity} L</span>
              },
              {
                header: 'Purity Score',
                accessor: (r) => <span className="font-mono font-bold text-slate-900">{r.purityScore || r.qualityScore}%</span>
              },
              {
                header: 'AI Recommendation',
                accessor: (r) => {
                  const rec = r.aiRecommendation || (r.result === 'ACCEPTED' ? 'ACCEPT' : r.result === 'WARNING' ? 'REVIEW' : 'REJECT');
                  return (
                    <Badge variant={rec === 'ACCEPT' ? 'success' : rec === 'REVIEW' ? 'warning' : 'danger'} size="sm">
                      {rec}
                    </Badge>
                  );
                }
              },
              {
                header: 'Final Result',
                accessor: (r) => (
                  <Badge variant={r.result === 'REJECTED' ? 'danger' : 'warning'} size="sm">
                    {r.result}
                  </Badge>
                )
              },
              {
                header: 'Diagnostic Anomalies / Reasons',
                accessor: (r) => (
                  <span className="text-xs text-slate-600">
                    {r.warnings.join(' • ') || 'Manual operator rejection'}
                  </span>
                )
              }
            ]}
          />
        </div>
      )}

      {/* Tab 6: IoT Sensor Telemetry Report */}
      {activeTab === 'sensor' && (
        <div className="space-y-4">
          <DataTable
            data={sensorAudit}
            keyExtractor={(s) => s.deviceId}
            columns={[
              {
                header: 'Device ID',
                accessor: (s) => <span className="font-mono font-bold text-slate-800">{s.deviceId}</span>
              },
              {
                header: 'Device Node Name',
                accessor: (s) => <span className="font-bold text-slate-900">{s.name}</span>
              },
              {
                header: 'Status',
                accessor: (s) => (
                  <Badge variant={s.status === 'CONNECTED' ? 'success' : 'danger'} size="sm">
                    {s.status}
                  </Badge>
                )
              },
              {
                header: 'Location Bay',
                accessor: (s) => <span className="text-slate-600 text-xs">{s.location}</span>
              },
              {
                header: 'Firmware',
                accessor: (s) => <span className="font-mono text-xs">{s.firmware}</span>
              },
              {
                header: 'Tests Logged',
                accessor: (s) => <span className="font-mono font-bold">{s.testsConducted}</span>
              },
              {
                header: 'Probe Health Status',
                accessor: (s) => <span className="font-semibold text-emerald-700 text-xs">{s.sensorHealth}</span>
              }
            ]}
          />
        </div>
      )}
    </div>
  );
};
