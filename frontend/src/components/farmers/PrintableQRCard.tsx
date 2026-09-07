import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Farmer } from '../../types';
import { ShieldCheck, Milk } from 'lucide-react';

export interface PrintableQRCardProps {
  farmer: Farmer;
  onClose?: () => void;
}

export const PrintableQRCard: React.FC<PrintableQRCardProps> = ({ farmer, onClose }) => {
  const code = farmer.customerCode || farmer.farmerId;
  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/customer/${code}` : `/customer/${code}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
        {/* Controls - Hidden during print */}
        <div className="flex items-center justify-between no-print border-b border-slate-100 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Print Preview</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-dairy-600 hover:bg-dairy-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Print Now
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* The Printable Card Body */}
        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-white text-center space-y-4 printable-area">
          {/* Brand Header */}
          <div className="flex items-center justify-center gap-2">
            <div className="p-1.5 bg-dairy-600 rounded-lg text-white">
              <Milk className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">MILKGUARD</h1>
              <p className="text-[10px] font-bold text-dairy-600 uppercase tracking-widest">Smart Milk Quality</p>
            </div>
          </div>

          <div className="h-px bg-slate-200 w-full" />

          {/* Customer Details */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Customer Name</p>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">{farmer.name}</h2>
            <p className="text-xs font-medium text-slate-500">{farmer.village}</p>
          </div>

          {/* Customer Code */}
          <div className="inline-block bg-slate-100 border border-slate-200 px-4 py-1.5 rounded-lg">
            <span className="text-[11px] font-medium text-slate-500 uppercase mr-2">Code:</span>
            <span className="font-mono text-base font-black tracking-widest text-slate-900">{code}</span>
          </div>

          {/* Large Reliable QR Code */}
          <div className="flex justify-center py-1">
            <div className="p-3 bg-white border-2 border-slate-900 rounded-xl shadow-sm inline-block">
              <QRCodeSVG
                value={qrUrl}
                size={160}
                level="H"
                includeMargin
              />
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800">Scan QR for Milk Collection</p>
            <p className="text-[10px] text-slate-400">Present this ID card to operator at reception</p>
          </div>
        </div>
      </div>
    </div>
  );
};
