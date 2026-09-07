import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoData } from '../context/DemoDataContext';
import { FarmerModal } from '../components/farmers/FarmerModal';
import { CustomerQRModal } from '../components/farmers/CustomerQRModal';
import { PrintableQRCard } from '../components/farmers/PrintableQRCard';
import { DataTable } from '../components/common/DataTable';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Farmer, AnimalType } from '../types';
import { Users, Plus, Search, Filter, Eye, Edit2, Trash2, Phone, MapPin, QrCode } from 'lucide-react';

export const Farmers: React.FC = () => {
  const navigate = useNavigate();
  const { farmers, addFarmer, updateFarmer, deleteFarmer } = useDemoData();

  const [search, setSearch] = useState('');
  const [animalFilter, setAnimalFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [deletingFarmerId, setDeletingFarmerId] = useState<string | null>(null);
  const [qrFarmer, setQrFarmer] = useState<Farmer | null>(null);
  const [printFarmer, setPrintFarmer] = useState<Farmer | null>(null);

  const filteredFarmers = farmers.filter((f) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      f.name.toLowerCase().includes(q) ||
      (f.customerCode && f.customerCode.toLowerCase().includes(q)) ||
      f.farmerId.toLowerCase().includes(q) ||
      f.village.toLowerCase().includes(q) ||
      f.mobile.includes(q);

    const matchesAnimal = animalFilter === 'ALL' || f.animalType === animalFilter;
    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;

    return matchesSearch && matchesAnimal && matchesStatus;
  });

  const handleEdit = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingFarmerId) {
      deleteFarmer(deletingFarmerId);
      setDeletingFarmerId(null);
    }
  };

  const getAnimalBadge = (type: AnimalType) => {
    switch (type) {
      case 'BUFFALO':
        return <Badge variant="primary" size="sm">Buffalo</Badge>;
      case 'COW':
        return <Badge variant="info" size="sm">Cow</Badge>;
      case 'MIXED':
        return <Badge variant="neutral" size="sm">Mixed</Badge>;
      case 'GOAT':
        return <Badge variant="warning" size="sm">Goat</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Dairy Customer & Farmer Registry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage registered milk producers, unique customer codes, QR identifiers, and quality ratings
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingFarmer(null);
            setIsModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Register New Customer
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Customer Code (A1024), Name, ID, or Village..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-dairy-500 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Animal Type Filter */}
          <select
            value={animalFilter}
            onChange={(e) => setAnimalFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-dairy-500"
          >
            <option value="ALL">All Animal Types</option>
            <option value="COW">Cow Dairy</option>
            <option value="BUFFALO">Buffalo Dairy</option>
            <option value="MIXED">Mixed Herd</option>
            <option value="GOAT">Caprine (Goat)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-dairy-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Farmers Data Table */}
      <DataTable<Farmer>
        data={filteredFarmers}
        keyExtractor={(f) => f.farmerId}
        onRowClick={(f) => navigate(`/customer/${f.customerCode || f.farmerId}`)}
        columns={[
          {
            header: 'Code',
            accessor: (f) => (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/customer/${f.customerCode || f.farmerId}`);
                }}
                className="font-mono text-xs font-black text-dairy-700 bg-dairy-50 hover:bg-dairy-100 px-2 py-1 rounded-md border border-dairy-200 transition-colors inline-block cursor-pointer"
                title="Open Customer Profile & QR Card"
              >
                {f.customerCode || f.farmerId}
              </span>
            )
          },
          {
            header: 'Customer Name',
            accessor: (f) => (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-dairy-50 text-dairy-700 font-bold text-xs flex items-center justify-center">
                  {f.name[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-900 leading-tight">{f.name}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <span className="font-mono text-[10px] text-slate-400">{f.farmerId}</span> • <Phone className="w-3 h-3 text-slate-400" /> {f.mobile}
                  </p>
                </div>
              </div>
            )
          },
          {
            header: 'Village / Region',
            accessor: (f) => (
              <span className="text-slate-600 flex items-center gap-1 text-xs">
                <MapPin className="w-3 h-3 text-slate-400" /> {f.village}
              </span>
            )
          },
          {
            header: 'Herd Type',
            accessor: (f) => getAnimalBadge(f.animalType)
          },
          {
            header: 'Total Milk',
            accessor: (f) => (
              <span className="font-mono font-bold text-slate-800">
                {f.totalMilkSupplied?.toLocaleString() || 0} L
              </span>
            )
          },
          {
            header: 'Avg Purity',
            accessor: (f) => (
              <span className="font-mono font-bold text-dairy-700">
                {f.averageQualityScore || 90}%
              </span>
            )
          },
          {
            header: 'Status',
            accessor: (f) => (
              <Badge variant={f.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                {f.status}
              </Badge>
            )
          },
          {
            header: 'Actions',
            align: 'right',
            accessor: (f) => (
              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setQrFarmer(f)}
                  title="View Customer QR Code"
                  className="p-1.5 text-dairy-600 hover:text-dairy-800 hover:bg-dairy-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                >
                  <QrCode className="w-4 h-4" />
                  <span className="hidden sm:inline">QR</span>
                </button>
                <button
                  onClick={() => navigate(`/customer/${f.customerCode || f.farmerId}`)}
                  title="View Customer Profile & Dashboard"
                  className="p-1.5 text-slate-400 hover:text-dairy-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(f)}
                  title="Edit Customer Record"
                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingFarmerId(f.farmerId)}
                  title="Deactivate Record"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          }
        ]}
      />

      {/* Add / Edit Farmer Modal */}
      <FarmerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFarmer(null);
        }}
        initialData={editingFarmer}
        onSubmit={(data) => {
          if (editingFarmer) {
            updateFarmer(editingFarmer.farmerId, data);
          } else {
            addFarmer(data);
          }
        }}
      />

      {/* Quick Customer QR Modal */}
      {qrFarmer && (
        <CustomerQRModal
          isOpen={!!qrFarmer}
          onClose={() => setQrFarmer(null)}
          farmer={qrFarmer}
          onPrint={() => {
            const current = qrFarmer;
            setQrFarmer(null);
            setPrintFarmer(current);
          }}
        />
      )}

      {/* Printable QR Card */}
      {printFarmer && (
        <PrintableQRCard
          farmer={printFarmer}
          onClose={() => setPrintFarmer(null)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingFarmerId}
        onClose={() => setDeletingFarmerId(null)}
        onConfirm={handleDeleteConfirm}
        title="Deactivate Farmer Record"
        message="Are you sure you want to deactivate this farmer record? Their previous test records and collections will remain archived in the database."
        confirmText="Yes, Deactivate"
      />
    </div>
  );
};
