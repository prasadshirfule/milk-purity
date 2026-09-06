import React, { useState } from 'react';
import { Farmer } from '../../types';
import { Search, UserCheck, Plus } from 'lucide-react';
import { Button } from '../common/Button';

export interface FarmerSelectorProps {
  farmers: Farmer[];
  selectedFarmerId: string;
  onSelectFarmer: (farmerId: string) => void;
  onQuickAddFarmer: () => void;
}

export const FarmerSelector: React.FC<FarmerSelectorProps> = ({
  farmers,
  selectedFarmerId,
  onSelectFarmer,
  onQuickAddFarmer
}) => {
  const [search, setSearch] = useState('');

  const filtered = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.farmerId.toLowerCase().includes(search.toLowerCase()) ||
      f.village.toLowerCase().includes(search.toLowerCase())
  );

  const selectedFarmer = farmers.find((f) => f.farmerId === selectedFarmerId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Select Delivering Farmer
        </label>
        <button
          type="button"
          onClick={onQuickAddFarmer}
          className="text-xs font-bold text-dairy-600 hover:text-dairy-700 flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Quick Register
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by name, ID (e.g. FMR-1001), or village..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-dairy-500 bg-white"
        />
      </div>

      {/* Select Dropdown List */}
      <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
        {filtered.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400">No matching farmers found</div>
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
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isSelected ? 'bg-dairy-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {farmer.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{farmer.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {farmer.farmerId} • {farmer.village} ({farmer.animalType})
                    </p>
                  </div>
                </div>
                {isSelected && <UserCheck className="w-4 h-4 text-dairy-600" />}
              </div>
            );
          })
        )}
      </div>

      {/* Selected Farmer Info Card */}
      {selectedFarmer && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Selected Farmer</span>
            <span className="font-bold text-slate-800">{selectedFarmer.name}</span>
            <span className="text-slate-500 block text-[11px]">
              {selectedFarmer.village} • Avg Quality: {selectedFarmer.averageQualityScore || 90}%
            </span>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 uppercase">
            {selectedFarmer.status}
          </span>
        </div>
      )}
    </div>
  );
};
