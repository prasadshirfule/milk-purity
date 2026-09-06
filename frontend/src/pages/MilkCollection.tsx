import React, { useState } from 'react';
import { useDemoData } from '../context/DemoDataContext';
import { StatCard } from '../components/common/StatCard';
import { DataTable } from '../components/common/DataTable';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { MilkCollection as IMilkCollection } from '../types';
import { Coins, Milk, Droplets, Download, Plus, Search, Calendar, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const MilkCollection: React.FC = () => {
  const { collections, farmers, addMilkTest } = useDemoData();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manual entry states
  const [manualFarmerId, setManualFarmerId] = useState(farmers[0]?.farmerId || '');
  const [manualQty, setManualQty] = useState('30');
  const [manualFat, setManualFat] = useState('4.5');
  const [manualRate, setManualRate] = useState('41.5');

  const filteredCollections = collections.filter((c) => {
    const matchesSearch =
      c.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      c.farmerId.toLowerCase().includes(search.toLowerCase()) ||
      c.collectionId.toLowerCase().includes(search.toLowerCase());

    const matchesDate = !dateFilter || new Date(c.timestamp).toISOString().slice(0, 10) === dateFilter;

    return matchesSearch && matchesDate;
  });

  const totalVolume = filteredCollections.reduce((sum, c) => sum + c.quantity, 0);
  const totalPayout = filteredCollections.reduce((sum, c) => sum + c.totalAmount, 0);
  const avgFat =
    filteredCollections.length > 0
      ? Number((filteredCollections.reduce((sum, c) => sum + c.fat, 0) / filteredCollections.length).toFixed(2))
      : 0;

  const handleExportCSV = () => {
    const headers = ['Collection ID,Test ID,Farmer ID,Farmer Name,Quantity (L),Estimated Fat (%),Rate (INR),Total Amount (INR),Date'];
    const rows = filteredCollections.map(
      (c) =>
        `"${c.collectionId}","${c.testId}","${c.farmerId}","${c.farmerName}",${c.quantity},${c.fat},${c.rate},${c.totalAmount},"${new Date(
          c.timestamp
        ).toISOString()}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `milk_collection_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Collection ledger exported as CSV', 'success');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const farmer = farmers.find((f) => f.farmerId === manualFarmerId);
    if (!farmer) {
      showToast('Select a valid farmer', 'error');
      return;
    }

    addMilkTest({
      farmerId: farmer.farmerId,
      farmerName: farmer.name,
      deviceId: 'ESP32-MILK-001',
      quantity: Number(manualQty),
      sensorReading: {
        deviceId: 'ESP32-MILK-001',
        timestamp: new Date().toISOString(),
        temperature: 24.0,
        ph: 6.64,
        fat: Number(manualFat),
        density: 1.029,
        conductivity: 5.0,
        milkLevel: Number(manualQty)
      },
      notes: 'Manual entry via collection ledger'
    });

    setIsManualModalOpen(false);
    showToast('Manual collection recorded successfully', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Milk Collection & Farmer Payout Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent intake accounting with automated fat-linked illustrative pricing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download className="w-4 h-4" />}
          >
            Export Ledger CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsManualModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Record Collection
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Collected Volume"
          value={totalVolume.toLocaleString()}
          unit="Litres"
          icon={<Milk className="w-5 h-5" />}
          iconBg="bg-dairy-50 text-dairy-600"
        />

        <StatCard
          title="Total Farmer Payout"
          value={`₹${totalPayout.toLocaleString()}`}
          icon={<Coins className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
          badge={<Badge variant="success" size="sm">Settled</Badge>}
        />

        <StatCard
          title="Average Estimated Fat"
          value={`${avgFat}%`}
          subtitle="Weighted intake average"
          icon={<Droplets className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by collection ID, farmer name, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-dairy-500 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-dairy-500"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-400 hover:text-slate-700 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Collection Ledger Table */}
      <DataTable<IMilkCollection>
        data={filteredCollections}
        keyExtractor={(c) => c.collectionId}
        columns={[
          {
            header: 'Collection ID',
            accessor: (c) => <span className="font-mono font-bold text-slate-800">{c.collectionId}</span>
          },
          {
            header: 'Date / Time',
            accessor: (c) => (
              <span className="text-slate-500">
                {new Date(c.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )
          },
          {
            header: 'Farmer Name',
            accessor: (c) => (
              <div>
                <p className="font-bold text-slate-800">{c.farmerName}</p>
                <p className="text-[10px] text-slate-400">{c.farmerId}</p>
              </div>
            )
          },
          {
            header: 'Linked Test',
            accessor: (c) => <span className="font-mono text-xs text-dairy-700">{c.testId}</span>
          },
          {
            header: 'Quantity',
            accessor: (c) => <span className="font-mono font-bold text-slate-900">{c.quantity} L</span>
          },
          {
            header: 'Fat %',
            accessor: (c) => <span className="font-mono font-semibold">{c.fat}%</span>
          },
          {
            header: 'Rate / L',
            accessor: (c) => <span className="font-mono font-bold text-slate-800">₹{c.rate}</span>
          },
          {
            header: 'Total Payout',
            accessor: (c) => (
              <span className="font-mono font-extrabold text-dairy-900 text-sm">
                ₹{c.totalAmount.toLocaleString()}
              </span>
            )
          },
          {
            header: 'Payment',
            accessor: () => (
              <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                PAID
              </Badge>
            )
          }
        ]}
      />

      {/* Manual Collection Record Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Record Manual Collection"
        description="Manually record a milk intake and create linked test & accounting ledger entry"
        maxWidth="md"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <Select
            label="Delivering Farmer *"
            value={manualFarmerId}
            onChange={(e) => setManualFarmerId(e.target.value)}
            options={farmers.map((f) => ({
              value: f.farmerId,
              label: `${f.name} (${f.farmerId} - ${f.village})`
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Volume (Litres) *"
              type="number"
              step="0.5"
              value={manualQty}
              onChange={(e) => setManualQty(e.target.value)}
            />
            <Input
              label="Fat Content (%) *"
              type="number"
              step="0.1"
              value={manualFat}
              onChange={(e) => setManualFat(e.target.value)}
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-semibold">Estimated Payout Total:</span>
            <span className="font-mono font-bold text-sm text-dairy-900">
              ₹{(Number(manualQty) * (38.0 + (Number(manualFat) - 3.5) * 3.5)).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsManualModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Collection Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
