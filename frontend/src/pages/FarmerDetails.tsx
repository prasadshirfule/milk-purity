import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDemoData } from '../context/DemoDataContext';
import { StatCard } from '../components/common/StatCard';
import { ChartCard } from '../components/common/ChartCard';
import { DataTable } from '../components/common/DataTable';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { CustomerQRModal } from '../components/farmers/CustomerQRModal';
import { PrintableQRCard } from '../components/farmers/PrintableQRCard';
import { QRCodeSVG } from 'qrcode.react';
import { MilkTest, MilkCollection } from '../types';
import {
  ArrowLeft,
  Milk,
  ShieldCheck,
  Coins,
  MapPin,
  Phone,
  Calendar,
  AlertTriangle,
  FileText,
  QrCode,
  Printer,
  Copy,
  Check,
  Play
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const FarmerDetails: React.FC = () => {
  const { id, customerCode } = useParams<{ id?: string; customerCode?: string }>();
  const navigate = useNavigate();
  const { farmers, tests, collections } = useDemoData();

  const [showQRModal, setShowQRModal] = useState(false);
  const [showPrintCard, setShowPrintCard] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const targetIdentifier = (customerCode || id || '').trim().toUpperCase();

  const farmer = farmers.find(
    (f) =>
      f.farmerId.toUpperCase() === targetIdentifier ||
      (f.customerCode && f.customerCode.toUpperCase() === targetIdentifier)
  );

  if (!farmer) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Customer profile not found</h2>
        <p className="text-sm text-slate-500">
          No customer record matches identifier "{targetIdentifier}".
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/farmers')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Directory
        </Button>
      </div>
    );
  }

  const code = farmer.customerCode || farmer.farmerId;
  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/customer/${code}` : `/customer/${code}`;

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleStartTest = () => {
    navigate(`/milk-testing?customerCode=${encodeURIComponent(code)}&farmerId=${encodeURIComponent(farmer.farmerId)}`);
  };

  const farmerTests = tests.filter((t) => t.farmerId === farmer.farmerId || t.customerCode === code);
  const farmerCollections = collections.filter((c) => c.farmerId === farmer.farmerId || c.customerCode === code);

  const acceptedTests = farmerTests.filter((t) => t.result === 'ACCEPTED');
  const warningTests = farmerTests.filter((t) => t.result === 'WARNING');
  const rejectedTests = farmerTests.filter((t) => t.result === 'REJECTED');

  const totalAcceptedVolume = farmerTests
    .filter((t) => t.result !== 'REJECTED')
    .reduce((sum, t) => sum + t.quantity, 0);
  const totalRejectedVolume = rejectedTests.reduce((sum, t) => sum + t.quantity, 0);
  const totalPayout = farmerCollections.reduce((sum, c) => sum + c.totalAmount, 0);

  const avgEstimatedFat =
    farmerTests.length > 0
      ? Number((farmerTests.reduce((sum, t) => sum + t.fat, 0) / farmerTests.length).toFixed(2))
      : 4.5;

  // Timeline chart data
  const chartData = farmerTests.slice(0, 10).reverse().map((t, idx) => ({
    label: `Batch ${idx + 1}`,
    liters: t.quantity,
    purity: t.purityScore || t.qualityScore,
    fat: t.fat
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Profile Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/farmers')}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            title="Back to Customer List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900">{farmer.name}</h2>
              <Badge variant={farmer.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                {farmer.status}
              </Badge>
              <Badge variant="primary" size="sm">
                {farmer.animalType}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
              <div className="flex items-center gap-1.5 bg-dairy-50 text-dairy-800 px-2.5 py-1 rounded-lg border border-dairy-200 font-semibold">
                <QrCode className="w-3.5 h-3.5 text-dairy-600" />
                <span>Customer Code:</span>
                <span className="font-mono font-black tracking-widest text-dairy-900">{code}</span>
                <button
                  onClick={handleCopyCode}
                  title="Copy Customer Code"
                  className="hover:text-dairy-600 ml-1 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <span className="text-slate-400 font-mono">ID: {farmer.farmerId}</span>

              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {farmer.village}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {farmer.mobile}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
          <Button
            variant="primary"
            size="sm"
            onClick={handleStartTest}
            icon={<Play className="w-4 h-4" />}
          >
            Start Milk Test
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQRModal(true)}
            icon={<QrCode className="w-4 h-4 text-dairy-600" />}
          >
            View QR
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrintCard(true)}
            icon={<Printer className="w-4 h-4 text-slate-600" />}
          >
            Print QR Card
          </Button>
        </div>
      </div>

      {/* QR Identification Strip */}
      <div className="bg-gradient-to-r from-dairy-900 via-dairy-800 to-slate-900 text-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="bg-white p-2.5 rounded-xl shadow-md shrink-0 cursor-pointer" onClick={() => setShowQRModal(true)}>
            <QRCodeSVG value={qrUrl} size={64} level="M" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-dairy-300 uppercase tracking-wider">Fast Operator Identification</span>
            <h3 className="text-base font-bold text-white">QR Code Ready for Milk Acceptance</h3>
            <p className="text-xs text-dairy-200">
              Scan this QR with the collection terminal camera or enter <span className="font-mono font-bold text-white bg-dairy-700/60 px-1.5 py-0.5 rounded">{code}</span> to preselect this customer.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowQRModal(true)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition-colors"
          >
            Enlarge QR
          </button>
          <button
            onClick={() => setShowPrintCard(true)}
            className="px-3 py-1.5 bg-dairy-500 hover:bg-dairy-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print Card
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Lifetime Milk"
          value={farmer.totalMilkSupplied ? farmer.totalMilkSupplied.toLocaleString() : totalAcceptedVolume.toLocaleString()}
          unit="L"
          subtitle={`${farmerCollections.length} batches delivered`}
          icon={<Milk className="w-5 h-5" />}
          iconBg="bg-dairy-50 text-dairy-600"
        />

        <StatCard
          title="Average Milk Purity Score"
          value={`${farmer.averageQualityScore || 92}%`}
          subtitle="Cumulative testing score"
          icon={<ShieldCheck className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Avg Estimated Fat %"
          value={`${avgEstimatedFat}%`}
          subtitle="Estimated screening fat"
          icon={<Coins className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Total Earnings Due"
          value={`₹${totalPayout.toLocaleString()}`}
          subtitle={`${((acceptedTests.length / (farmerTests.length || 1)) * 100).toFixed(0)}% Acceptance rate`}
          icon={<FileText className="w-5 h-5" />}
          iconBg="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Test Status Distribution Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-700 block">Total Tests Recorded: {farmerTests.length}</span>
          <span className="text-[11px] text-slate-400">Lifetime delivery tests logged for {farmer.name}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Badge variant="success" size="sm">
            {acceptedTests.length} Accepted ({totalAcceptedVolume} L)
          </Badge>
          <Badge variant="warning" size="sm">
            {warningTests.length} Warning
          </Badge>
          <Badge variant="danger" size="sm">
            {rejectedTests.length} Rejected ({totalRejectedVolume} L)
          </Badge>
        </div>
      </div>

      {/* Charts: Volume & Purity History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Milk Supply Volume Trend"
          subtitle="Volume in liters across recent delivery sessions"
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="farmerLiters" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#farmerLiters)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Purity Score & Fat Trend"
          subtitle="Quality consistency tracking"
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none'
                }}
              />
              <Line
                type="monotone"
                dataKey="purity"
                name="Milk Purity Score (%)"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Historical Tests Table for Farmer */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900">Delivery & Quality History</h3>
        <DataTable<MilkTest>
          data={farmerTests}
          keyExtractor={(t) => t.testId}
          columns={[
            {
              header: 'Test ID',
              accessor: (t) => <span className="font-mono font-bold text-slate-800">{t.testId}</span>
            },
            {
              header: 'Date',
              accessor: (t) => (
                <span className="text-slate-500">
                  {new Date(t.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )
            },
            {
              header: 'Volume',
              accessor: (t) => <span className="font-mono font-bold text-slate-900">{t.quantity} L</span>
            },
            {
              header: 'Est. Fat %',
              accessor: (t) => <span className="font-mono font-semibold">{t.fat}%</span>
            },
            {
              header: 'pH',
              accessor: (t) => <span className="font-mono">{t.ph}</span>
            },
            {
              header: 'Density',
              accessor: (t) => <span className="font-mono">{t.density}</span>
            },
            {
              header: 'Purity Score',
              accessor: (t) => <span className="font-mono font-bold text-slate-900">{t.purityScore || t.qualityScore}%</span>
            },
            {
              header: 'Result',
              accessor: (t) => (
                <Badge
                  variant={t.result === 'ACCEPTED' ? 'success' : t.result === 'WARNING' ? 'warning' : 'danger'}
                  size="sm"
                >
                  {t.result}
                </Badge>
              )
            },
            {
              header: 'Payout (₹)',
              accessor: (t) => (
                <span className="font-mono font-bold text-dairy-800">
                  {t.totalAmount ? `₹${t.totalAmount.toLocaleString()}` : '—'}
                </span>
              )
            }
          ]}
        />
      </div>

      {/* Historical Collections for Farmer */}
      <div className="space-y-3 pt-4">
        <h3 className="text-base font-bold text-slate-900">Procurement Collections & Ledger Entries</h3>
        <DataTable<MilkCollection>
          data={farmerCollections}
          keyExtractor={(c) => c.collectionId}
          columns={[
            {
              header: 'Collection ID',
              accessor: (c) => <span className="font-mono font-bold text-dairy-700">{c.collectionId}</span>
            },
            {
              header: 'Date',
              accessor: (c) => (
                <span className="text-slate-500">
                  {new Date(c.timestamp).toLocaleDateString()}
                </span>
              )
            },
            {
              header: 'Volume',
              accessor: (c) => <span className="font-mono font-bold">{c.quantity} L</span>
            },
            {
              header: 'Est. Fat',
              accessor: (c) => <Badge variant="primary" size="sm">{c.fat}%</Badge>
            },
            {
              header: 'Rate (₹/L)',
              accessor: (c) => <span className="font-mono text-xs">₹{c.rate.toFixed(2)}</span>
            },
            {
              header: 'Total Payable',
              accessor: (c) => <span className="font-mono font-bold text-emerald-600">₹{c.totalAmount.toFixed(2)}</span>
            },
            {
              header: 'Payment Status',
              accessor: (c) => (
                <Badge variant={(c.paymentStatus || 'PAID') === 'PAID' ? 'success' : 'warning'} size="sm">
                  {c.paymentStatus || 'PAID'}
                </Badge>
              )
            }
          ]}
        />
      </div>

      {/* QR Code Identification Modal */}
      {showQRModal && (
        <CustomerQRModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          farmer={farmer}
          onPrint={() => {
            setShowQRModal(false);
            setShowPrintCard(true);
          }}
        />
      )}

      {/* Printable QR ID Card Overlay */}
      {showPrintCard && (
        <PrintableQRCard
          farmer={farmer}
          onClose={() => setShowPrintCard(false)}
        />
      )}
    </div>
  );
};

export default FarmerDetails;
