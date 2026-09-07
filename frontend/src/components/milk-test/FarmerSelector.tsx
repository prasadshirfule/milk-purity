import React, { useState } from 'react';
import { Farmer } from '../../types';
import { Search, UserCheck, Plus, QrCode, Copy, Check } from 'lucide-react';
import { Badge } from '../common/Badge';

export interface FarmerSelectorProps {
  farmers: Farmer[];
  selectedFarmerId: string;
  onSelectFarmer: (farmerId: string) => void;
  onQuickAddFarmer: () => void;
  onOpenQRScanner?: () => void;
}

export const FarmerSelector: React.FC<FarmerSelectorProps> = ({
  farmers,
  selectedFarmerId,
  onSelectFarmer,
  onQuickAddFarmer,
  onOpenQRScanner
}) => {
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const filtered = farmers.filter((f) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      (f.customerCode && f.customerCode.toLowerCase().includes(q)) ||
      f.farmerId.toLowerCase().includes(q) ||
      f.village.toLowerCase().includes(q)
    );
  });

  const selectedFarmer = farmers.find((f) => f.farmerId === selectedFarmerId);

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Delivering Customer / Farmer
        </label>
        <div className="flex items-center gap-2">
          {onOpenQRScanner && (
            <button
              type="button"
              onClick={onOpenQRScanner}
              className="text-xs font-bold text-dairy-600 hover:text-dairy-700 flex items-center gap-1 bg-dairy-50 hover:bg-dairy-100 px-2 py-1 rounded-lg border border-dairy-200 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" /> Scan QR
            </button>
          )}
          <button
            type="button"
            onClick={onQuickAddFarmer}
            className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>
      </div>

      {/* Selected Customer Hero Card */}
      {selectedFarmer ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-dairy-50/90 to-slate-50 border-2 border-dairy-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-dairy-600 text-white px-2.5 py-0.5 rounded-md text-[11px] font-mono font-black tracking-widest shadow-sm">
              <QrCode className="w-3 h-3" />
              <span>{selectedFarmer.customerCode || selectedFarmer.farmerId}</span>
              <button
                type="button"
                onClick={() => handleCopyCode(selectedFarmer.customerCode || selectedFarmer.farmerId)}
                title="Copy Customer Code"
                className="hover:text-dairy-200 ml-1"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
              READY FOR MILK TEST
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">{selectedFarmer.name}</h4>
              <p className="text-[11px] text-slate-500">
                {selectedFarmer.village} • {selectedFarmer.animalType} Herd • Avg {selectedFarmer.averageQualityScore || 90}%
              </p>
            </div>
            {onOpenQRScanner && (
              <button
                type="button"
                onClick={onOpenQRScanner}
                className="text-[11px] font-bold text-dairy-600 hover:text-dairy-700 underline"
              >
                Change
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Search & Directory Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by Code (A1024), Name, or Village..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-dairy-500 bg-white"
        />
      </div>

      {/* Select Dropdown List */}
      <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
        {filtered.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400">No matching customers found</div>
        ) : (
          filtered.map((farmer) => {
            const isSelected = farmer.farmerId === selectedFarmerId;
            return (
              <div
                key={farmer.farmerId}
                onClick={() => onSelectFarmer(farmer.farmerId)}
                className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected ? 'bg-dairy-50/90 text-dairy-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] font-black text-dairy-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {farmer.customerCode || farmer.farmerId}
                  </span>
                  <div>
                    <p className="text-xs font-bold leading-tight">{farmer.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {farmer.village} ({farmer.animalType})
                    </p>
                  </div>
                </div>
                {isSelected && <UserCheck className="w-4 h-4 text-dairy-600" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

