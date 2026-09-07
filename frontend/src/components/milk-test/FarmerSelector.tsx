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
  const [isChanging, setIsChanging] = useState(false);

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
          Customer Identification
        </label>
        <div className="flex items-center gap-2">
          {onOpenQRScanner && (
            <button
              type="button"
              onClick={onOpenQRScanner}
              className="text-xs font-bold text-dairy-700 hover:text-dairy-800 flex items-center gap-1.5 bg-dairy-50 hover:bg-dairy-100 px-2.5 py-1 rounded-lg border border-dairy-200 transition-colors shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5 text-dairy-600" />
              <span>Scan Customer QR</span>
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
        <div className="p-4 rounded-2xl bg-gradient-to-br from-dairy-50 via-white to-slate-50 border-2 border-dairy-300 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-dairy-700 text-white px-2.5 py-1 rounded-lg text-xs font-mono font-black tracking-widest shadow-sm">
              <QrCode className="w-3.5 h-3.5" />
              <span>{selectedFarmer.customerCode || selectedFarmer.farmerId}</span>
              <button
                type="button"
                onClick={() => handleCopyCode(selectedFarmer.customerCode || selectedFarmer.farmerId)}
                title="Copy Customer Code"
                className="hover:text-dairy-200 ml-1.5"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full uppercase tracking-wider">
              READY FOR MILK TEST
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Customer Name</p>
              <h4 className="text-base font-black text-slate-900 leading-snug">{selectedFarmer.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedFarmer.village} • {selectedFarmer.animalType} Herd • Avg {selectedFarmer.averageQualityScore || 90}%
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (onOpenQRScanner) {
                    onOpenQRScanner();
                  } else {
                    setIsChanging(!isChanging);
                  }
                }}
                className="px-2.5 py-1 bg-white hover:bg-dairy-50 border border-slate-200 hover:border-dairy-300 text-xs font-bold text-dairy-700 rounded-lg transition-colors shadow-2xs"
              >
                Change Customer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Directory Search & Selection (Always visible if no customer selected, or when changing) */}
      {(!selectedFarmer || isChanging) && (
        <div className="space-y-2 pt-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Code (A1024), Name, or Village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-dairy-500 bg-white"
              autoFocus={!selectedFarmer}
            />
          </div>

          <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">No matching customers found</div>
            ) : (
              filtered.map((farmer) => {
                const isSelected = farmer.farmerId === selectedFarmerId;
                return (
                  <div
                    key={farmer.farmerId}
                    onClick={() => {
                      onSelectFarmer(farmer.farmerId);
                      setIsChanging(false);
                    }}
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
      )}
    </div>
  );
};

