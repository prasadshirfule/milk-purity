import React, { useState, useMemo } from 'react';
import { useDemoData } from '../context/DemoDataContext';
import { StatCard } from '../components/common/StatCard';
import { DataTable } from '../components/common/DataTable';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { MilkCollection } from '../types';
import {
  Coins,
  Receipt,
  Download,
  Search,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Info,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Ledger: React.FC = () => {
  const { collections, farmers } = useDemoData();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedFarmerId, setSelectedFarmerId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedStatementFarmer, setSelectedStatementFarmer] = useState<string | null>(null);

  // Filtered collections
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      const matchesSearch =
        c.farmerName.toLowerCase().includes(search.toLowerCase()) ||
        c.farmerId.toLowerCase().includes(search.toLowerCase()) ||
        c.collectionId.toLowerCase().includes(search.toLowerCase()) ||
        c.testId.toLowerCase().includes(search.toLowerCase());

      const matchesFarmer = selectedFarmerId === 'ALL' || c.farmerId === selectedFarmerId;
      const matchesStatus = statusFilter === 'ALL' || (c.paymentStatus || 'PAID') === statusFilter;
      const matchesDate = !dateFilter || new Date(c.timestamp).toISOString().slice(0, 10) === dateFilter;

      return matchesSearch && matchesFarmer && matchesStatus && matchesDate;
    });
  }, [collections, search, selectedFarmerId, statusFilter, dateFilter]);

  // Aggregate stats
  const totalVolume = useMemo(
    () => filteredCollections.reduce((sum, c) => sum + c.quantity, 0),
    [filteredCollections]
  );
  const totalPayable = useMemo(
    () => filteredCollections.reduce((sum, c) => sum + c.totalAmount, 0),
    [filteredCollections]
  );
  const totalSettled = useMemo(
    () =>
      filteredCollections
        .filter((c) => (c.paymentStatus || 'PAID') === 'PAID')
        .reduce((sum, c) => sum + c.totalAmount, 0),
    [filteredCollections]
  );
  const totalPending = useMemo(
    () =>
      filteredCollections
        .filter((c) => c.paymentStatus === 'PENDING')
        .reduce((sum, c) => sum + c.totalAmount, 0),
    [filteredCollections]
  );

  // Farmer Ledger Breakdown Summary Map
  const farmerLedgerSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        farmerId: string;
        farmerName: string;
        village: string;
        totalLiters: number;
        entriesCount: number;
        totalAmount: number;
        paidAmount: number;
        pendingAmount: number;
      }
    >();

    farmers.forEach((f) => {
      map.set(f.farmerId, {
        farmerId: f.farmerId,
        farmerName: f.name,
        village: f.village,
        totalLiters: 0,
        entriesCount: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0
      });
    });

    collections.forEach((c) => {
      const existing = map.get(c.farmerId) || {
        farmerId: c.farmerId,
        farmerName: c.farmerName || c.farmerId,
        village: 'Registered',
        totalLiters: 0,
        entriesCount: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0
      };

      existing.totalLiters = Number((existing.totalLiters + c.quantity).toFixed(1));
      existing.entriesCount += 1;
      existing.totalAmount = Number((existing.totalAmount + c.totalAmount).toFixed(2));
      if (c.paymentStatus === 'PENDING') {
        existing.pendingAmount = Number((existing.pendingAmount + c.totalAmount).toFixed(2));
      } else {
        existing.paidAmount = Number((existing.paidAmount + c.totalAmount).toFixed(2));
      }
      map.set(c.farmerId, existing);
    });

    return Array.from(map.values()).filter(
      (f) =>
        f.entriesCount > 0 &&
        (selectedFarmerId === 'ALL' || f.farmerId === selectedFarmerId)
    );
  }, [farmers, collections, selectedFarmerId]);

  // Selected statement farmer details
  const statementFarmer = useMemo(() => {
    if (!selectedStatementFarmer) return null;
    const f = farmers.find((item) => item.farmerId === selectedStatementFarmer);
    const farmerCols = collections
      .filter((c) => c.farmerId === selectedStatementFarmer)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const totalLit = farmerCols.reduce((sum, c) => sum + c.quantity, 0);
    const totalDue = farmerCols.reduce((sum, c) => sum + c.totalAmount, 0);

    return {
      farmer: f,
      collections: farmerCols,
      totalLit: Number(totalLit.toFixed(1)),
      totalDue: Number(totalDue.toFixed(2))
    };
  }, [selectedStatementFarmer, farmers, collections]);

  const handleExportCSV = () => {
    const headers = [
      'Collection ID,Test ID,Farmer ID,Farmer Name,Quantity (L),Estimated Fat (%),Rate (INR/L),Total Amount (INR),Payment Status,Date'
    ];
    const rows = filteredCollections.map(
      (c) =>
        `"${c.collectionId}","${c.testId}","${c.farmerId}","${c.farmerName}",${c.quantity},${c.fat},${c.rate},${c.totalAmount},"${c.paymentStatus || 'PAID'}","${new Date(
          c.timestamp
        ).toISOString()}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `farmer_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Farmer ledger exported as CSV', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-dairy-600" />
            Farmer Procurement Ledger & Payments
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual supplier account statements, intake dues, and payout transaction ledgers
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          icon={<Download className="w-4 h-4" />}
        >
          Export Ledger CSV
        </Button>
      </div>

      {/* Honest Disclaimer Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Ledger Accounting:</strong> Entries reflect verified milk batch collection values calculated based on fat content and volume. Payment status represents recorded settlement ledger records.
          </span>
        </div>
        <Badge variant="warning" size="sm">
          Internal Dairy Ledger
        </Badge>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Procurement Value"
          value={`₹${totalPayable.toLocaleString()}`}
          subtitle={`${totalVolume.toLocaleString()} Litres collected`}
          icon={<Coins className="w-5 h-5" />}
          iconBg="bg-dairy-50 text-dairy-600"
        />

        <StatCard
          title="Settled Disbursements"
          value={`₹${totalSettled.toLocaleString()}`}
          subtitle="Recorded as disbursed in ledger"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Pending Settlement"
          value={`₹${totalPending.toLocaleString()}`}
          subtitle="Awaiting weekly batch clearance"
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Delivering Suppliers"
          value={farmerLedgerSummary.length}
          subtitle="Suppliers with active records"
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-sky-50 text-sky-600"
        />
      </div>

      {/* Filter Control Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by farmer name, ID, or collection ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-dairy-500 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedFarmerId}
            onChange={(e) => setSelectedFarmerId(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-dairy-500 font-semibold text-slate-700"
          >
            <option value="ALL">All Farmers ({farmers.length})</option>
            {farmers.map((f) => (
              <option key={f.farmerId} value={f.farmerId}>
                {f.name} ({f.farmerId})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-dairy-500 font-semibold text-slate-700"
          >
            <option value="ALL">All Payout Statuses</option>
            <option value="PAID">Settled (PAID)</option>
            <option value="PENDING">Pending (PENDING)</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-dairy-500 text-slate-700"
          />

          {(search || selectedFarmerId !== 'ALL' || statusFilter !== 'ALL' || dateFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedFarmerId('ALL');
                setStatusFilter('ALL');
                setDateFilter('');
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Tabular Section 1: Farmer-wise Account Balances Summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-dairy-600" />
            Supplier Account Balances Summary
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {farmerLedgerSummary.length} Accounts
          </span>
        </div>

        <DataTable
          keyExtractor={(f: any) => f.farmerId}
          columns={[
            {
              header: 'Farmer ID',
              accessor: (f: any) => <span className="font-mono font-bold text-slate-900">{f.farmerId}</span>
            },
            {
              header: 'Farmer Name',
              accessor: (f: any) => (
                <div>
                  <span className="font-bold text-slate-900 block">{f.farmerName}</span>
                  <span className="text-[11px] text-slate-400">{f.village}</span>
                </div>
              )
            },
            {
              header: 'Total Milk (L)',
              accessor: (f: any) => <span className="font-bold text-slate-900">{f.totalLiters} L</span>
            },
            {
              header: 'Batches',
              accessor: (f: any) => <span>{f.entriesCount} intakes</span>
            },
            {
              header: 'Total Payable (₹)',
              accessor: (f: any) => <span className="font-mono font-bold text-emerald-600">₹{f.totalAmount.toFixed(2)}</span>
            },
            {
              header: 'Settled (₹)',
              accessor: (f: any) => <span className="text-slate-600">₹{f.paidAmount.toFixed(2)}</span>
            },
            {
              header: 'Pending (₹)',
              accessor: (f: any) => (
                <span className={f.pendingAmount > 0 ? 'font-bold text-amber-600' : 'text-slate-400'}>
                  ₹{f.pendingAmount.toFixed(2)}
                </span>
              )
            },
            {
              header: 'Statement',
              accessor: (f: any) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStatementFarmer(f.farmerId)}
                  className="text-xs py-1 px-2.5 h-auto"
                >
                  View Statement
                </Button>
              )
            }
          ]}
          data={farmerLedgerSummary}
        />
      </div>

      {/* Tabular Section 2: Individual Intake Collection Ledger Entries */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-dairy-600" />
            Detailed Procurement Ledger Entries
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {filteredCollections.length} Collection records
          </span>
        </div>

        <DataTable
          keyExtractor={(c: MilkCollection) => c.collectionId}
          columns={[
            {
              header: 'Date & Time',
              accessor: (c: MilkCollection) => (
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">
                    {new Date(c.timestamp).toLocaleDateString()}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            },
            {
              header: 'Collection ID',
              accessor: (c: MilkCollection) => (
                <div>
                  <span className="font-mono text-xs font-bold text-dairy-700 block">{c.collectionId}</span>
                  <span className="font-mono text-[10px] text-slate-400 block">{c.testId}</span>
                </div>
              )
            },
            {
              header: 'Delivering Farmer',
              accessor: (c: MilkCollection) => (
                <div>
                  <span className="font-bold text-slate-900 block">{c.farmerName}</span>
                  <span className="font-mono text-[11px] text-slate-500">{c.farmerId}</span>
                </div>
              )
            },
            {
              header: 'Volume',
              accessor: (c: MilkCollection) => <span className="font-bold text-slate-900">{c.quantity} L</span>
            },
            {
              header: 'Est. Fat',
              accessor: (c: MilkCollection) => (
                <Badge variant="primary" size="sm">
                  {c.fat}%
                </Badge>
              )
            },
            {
              header: 'Rate (₹/L)',
              accessor: (c: MilkCollection) => <span className="text-xs text-slate-600">₹{c.rate.toFixed(2)}</span>
            },
            {
              header: 'Total Dues',
              accessor: (c: MilkCollection) => (
                <span className="font-mono font-bold text-xs text-emerald-600">₹{c.totalAmount.toFixed(2)}</span>
              )
            },
            {
              header: 'Status',
              accessor: (c: MilkCollection) => (
                <Badge variant={(c.paymentStatus || 'PAID') === 'PAID' ? 'success' : 'warning'} size="sm">
                  {c.paymentStatus || 'PAID'}
                </Badge>
              )
            }
          ]}
          data={filteredCollections}
        />
      </div>

      {/* Farmer Account Statement Modal */}
      {statementFarmer && (
        <Modal
          isOpen={!!selectedStatementFarmer}
          onClose={() => setSelectedStatementFarmer(null)}
          title={`Supplier Statement: ${statementFarmer.farmer?.name || selectedStatementFarmer}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-dairy-400 tracking-wider block">
                  Supplier Profile
                </span>
                <h3 className="text-lg font-black">{statementFarmer.farmer?.name}</h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  ID: {statementFarmer.farmer?.farmerId} • {statementFarmer.farmer?.village} • {statementFarmer.farmer?.mobile}
                </p>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Cumulative Intake Dues
                </span>
                <span className="text-xl font-black text-emerald-400 block">
                  ₹{statementFarmer.totalDue.toFixed(2)}
                </span>
                <span className="text-xs text-slate-300">
                  {statementFarmer.totalLit} Litres delivered across {statementFarmer.collections.length} batches
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                Batch Collection Ledger History
              </h4>
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {statementFarmer.collections.map((c) => (
                  <div key={c.collectionId} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <span className="font-bold text-slate-900 block">{c.collectionId}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.timestamp).toLocaleString()} • Fat: {c.fat}% • {c.quantity} L
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-600 block">₹{c.totalAmount.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400">@ ₹{c.rate.toFixed(2)}/L</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStatementFarmer(null)}
              >
                Close Statement
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default Ledger;
