import React, { useState, useEffect } from 'react';
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
import { generateCustomerQRUrl } from '../utils/qrParser';
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
  const { farmers, tests, collections, refreshData } = useDemoData();

  useEffect(() => {
    refreshData();
  }, [customerCode, id]);

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
  const qrUrl = generateCustomerQRUrl(code);

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

  const scoredTests = farmerTests.filter((t) => t.purityScore !== undefined || t.qualityScore !== undefined);
  const avgPurityScore =
    scoredTests.length > 0
      ? Number(
          (
            scoredTests.reduce((sum, t) => sum + (t.purityScore || t.qualityScore || 0), 0) /
            scoredTests.length
          ).toFixed(1)
        )
      : farmer.averageQualityScore || 92;

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
            className="bg-dairy-600 hover:bg-dairy-700 text-white font-bold"
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
            <h3 className="text-base font-bold text-white">Customer QR Code Ready</h3>
            <p className="text-xs text-dairy-200">
              Scan this QR with the collection terminal camera or enter code <span className="font-mono font-bold text-white bg-dairy-700/60 px-1.5 py-0.5 rounded">{code}</span> for 1-click customer preselection.
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

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Lifetime Milk"
          value={farmer.totalMilkSupplied ? farmer.totalMilkSupplied.toLocaleString() : (totalAcceptedVolume + totalRejectedVolume).toLocaleString()}
          unit="L"
          subtitle={`${farmerTests.length} tests logged`}
          icon={<Milk className="w-5 h-5" />}
          iconBg="bg-dairy-50 text-dairy-600"
        />

        <StatCard
          title="Accepted Volume"
          value={totalAcceptedVolume.toLocaleString()}
          unit="L"
          subtitle={`${acceptedTests.length + warningTests.length} accepted batches`}
          icon={<Check className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Rejected Volume"
          value={totalRejectedVolume.toLocaleString()}
          unit="L"
          subtitle={`${rejectedTests.length} rejected (${totalRejectedVolume > 0 ? '₹0 payout' : '0% reject'})`}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-rose-50 text-rose-600"
        />

        <StatCard
          title="Avg Milk Purity"
          value={`${avgPurityScore}%`}
          subtitle="Screening baseline"
          icon={<ShieldCheck className="w-5 h-5" />}
          iconBg="bg-sky-50 text-sky-600"
        />

        <StatCard
          title="Current Ledger Balance"
          value={`₹${totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Total accepted dues"
          icon={<Coins className="w-5 h-5" />}
          iconBg="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Financial Ledger Statement Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-dairy-600" />
              Customer Financial Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Authoritative procurement ledger calculated strictly from accepted milk collections.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="md">
              Closing Balance: ₹{totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Badge>
          </div>
        </div>

        {/* Ledger Balance Flow Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-500 font-medium">Opening Balance:</span>
            <div className="font-mono font-bold text-slate-800 text-sm">₹0.00</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-emerald-700 font-medium">Milk Collected (Credit):</span>
            <div className="font-mono font-bold text-emerald-700 text-sm">
              +₹{totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-500 font-medium">Payouts Disbursed (Debit):</span>
            <div className="font-mono font-bold text-slate-600 text-sm">-₹0.00</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-dairy-800 font-medium">Net Closing Balance:</span>
            <div className="font-mono font-black text-dairy-900 text-sm">
              ₹{totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Ledger Entries Table */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Recorded Ledger Entries ({farmerCollections.length})
          </h4>
          <DataTable<MilkCollection>
            data={farmerCollections}
            keyExtractor={(c) => c.collectionId}
            columns={[
              {
                header: 'Collection ID',
                accessor: (c) => <span className="font-mono font-bold text-dairy-700">{c.collectionId}</span>
              },
              {
                header: 'Linked Test ID',
                accessor: (c) => <span className="font-mono text-xs text-slate-600">{c.testId || '—'}</span>
              },
              {
                header: 'Date & Time',
                accessor: (c) => (
                  <span className="text-slate-500 text-xs">
                    {new Date(c.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )
              },
              {
                header: 'Volume (L)',
                accessor: (c) => <span className="font-mono font-bold text-slate-900">{c.quantity} L</span>
              },
              {
                header: 'Fat %',
                accessor: (c) => <Badge variant="primary" size="sm">{c.fat}%</Badge>
              },
              {
                header: 'Rate (₹/L)',
                accessor: (c) => <span className="font-mono text-xs font-semibold text-slate-700">₹{c.rate.toFixed(2)}</span>
              },
              {
                header: 'Credit Amount (₹)',
                accessor: (c) => <span className="font-mono font-bold text-emerald-600">₹{c.totalAmount.toFixed(2)}</span>
              },
              {
                header: 'Status',
                accessor: (c) => (
                  <Badge variant={(c.paymentStatus || 'PAID') === 'PAID' ? 'success' : 'warning'} size="sm">
                    {c.paymentStatus || 'RECORDED'}
                  </Badge>
                )
              }
            ]}
          />
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

      {/* Granular Delivery & Quality Testing History Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Delivery & Quality Screening History</h3>
          <span className="text-xs text-slate-400">Total: {farmerTests.length} tests</span>
        </div>
        <DataTable<MilkTest>
          data={farmerTests}
          keyExtractor={(t) => t.testId}
          columns={[
            {
              header: 'Test ID',
              accessor: (t) => <span className="font-mono font-bold text-slate-800">{t.testId}</span>
            },
            {
              header: 'Date & Time',
              accessor: (t) => (
                <span className="text-slate-500 text-xs">
                  {new Date(t.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )
            },
            {
              header: 'Volume',
              accessor: (t) => <span className="font-mono font-bold text-slate-900">{t.quantity} L</span>
            },
            {
              header: 'Fat %',
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
              accessor: (t) => (
                <span className="font-mono font-bold text-slate-900">
                  {t.purityScore !== undefined || t.qualityScore !== undefined ? `${t.purityScore || t.qualityScore}%` : '—'}
                </span>
              )
            },
            {
              header: 'AI Rec.',
              accessor: (t) => (
                t.aiRecommendation ? (
                  <Badge variant={t.aiRecommendation === 'ACCEPT' ? 'success' : t.aiRecommendation === 'REVIEW' ? 'warning' : 'danger'} size="sm">
                    {t.aiRecommendation}
                  </Badge>
                ) : <span className="text-slate-400 text-xs">—</span>
              )
            },
            {
              header: 'Decision',
              accessor: (t) => (
                <span className="font-bold text-xs uppercase text-slate-700">
                  {t.operatorDecision || t.result}
                </span>
              )
            },
            {
              header: 'Operator',
              accessor: (t) => (
                <span className="text-xs text-slate-600 font-medium">
                  {t.operatorName || 'Historical record'}
                </span>
              )
            },
            {
              header: 'Result',
              accessor: (t) => (
                <div className="space-y-0.5">
                  <Badge
                    variant={t.result === 'ACCEPTED' ? 'success' : t.result === 'WARNING' ? 'warning' : 'danger'}
                    size="sm"
                  >
                    {t.result}
                  </Badge>
                  {t.overrideReason && (
                    <span className="block text-[10px] text-amber-600 font-semibold truncate max-w-[120px]" title={t.overrideReason}>
                      Override: {t.overrideReason}
                    </span>
                  )}
                </div>
              )
            },
            {
              header: 'Payout (₹)',
              accessor: (t) => (
                <span className="font-mono font-bold text-dairy-800">
                  {t.result === 'REJECTED' ? '₹0.00' : (t.totalAmount ? `₹${t.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—')}
                </span>
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
