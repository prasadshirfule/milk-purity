import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { Farmer } from '../../types';
import { useDemoData } from '../../context/DemoDataContext';
import { QrCode, Search, Camera, AlertCircle, CheckCircle2, User, Phone, MapPin, Sparkles } from 'lucide-react';

import { parseCustomerQR, generateCustomerQRUrl } from '../../utils/qrParser';

export interface CustomerLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (farmer: Farmer) => void;
}

export const CustomerLookupModal: React.FC<CustomerLookupModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer
}) => {
  const { farmers, getFarmerByCustomerCode } = useDemoData();
  const [activeTab, setActiveTab] = useState<'code' | 'camera' | 'search'>('code');

  // Manual code input
  const [inputCode, setInputCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [confirmedCustomer, setConfirmedCustomer] = useState<Farmer | null>(null);

  // Search list input
  const [searchQuery, setSearchQuery] = useState('');

  // Camera scanner state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setInputCode('');
      setCodeError(null);
      setSearchQuery('');
      setCameraError(null);
      setIsScanning(false);
      setConfirmedCustomer(null);
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Start Camera when camera tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !confirmedCustomer) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, confirmedCustomer]);

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser or environment. Please enter Customer Code manually.');
      setIsScanning(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Check for native BarcodeDetector
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code']
        });

        const scanInterval = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2 || !streamRef.current) {
            return;
          }
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              clearInterval(scanInterval);
              handleScannedUrlOrCode(rawValue);
            }
          } catch (e) {
            // frame detection error or detector busy
          }
        }, 300);

        return () => clearInterval(scanInterval);
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please grant camera permission or use Manual Customer Code entry.');
      } else {
        setCameraError('Camera is unavailable or in use by another application. Please enter Customer Code manually.');
      }
      setIsScanning(false);
    }
  };

  const handleScannedUrlOrCode = async (rawValue: string) => {
    stopCamera();
    const parsed = parseCustomerQR(rawValue);
    if (!parsed.valid || !parsed.customerCode) {
      setActiveTab('code');
      setCodeError(parsed.error || 'Invalid MILKGUARD customer QR. Expected format /customer/A1024');
      return;
    }

    await resolveAndSelectCode(parsed.customerCode);
  };

  const resolveAndSelectCode = async (rawCode: string) => {
    const parsed = parseCustomerQR(rawCode);
    setCodeError(null);

    if (!parsed.valid || !parsed.customerCode) {
      setCodeError(`Invalid Customer Code format "${rawCode}". Expected 1 uppercase letter + 4 digits (e.g. A1024).`);
      return;
    }

    const formatted = parsed.customerCode;
    setIsSearching(true);
    try {
      const found = await getFarmerByCustomerCode(formatted);
      if (found) {
        setConfirmedCustomer(found);
      } else {
        // Fallback: Check if there is any farmer whose internal farmerId matches
        const fallback = farmers.find((f) => f.farmerId.toUpperCase() === formatted || f.customerCode?.toUpperCase() === formatted);
        if (fallback) {
          setConfirmedCustomer(fallback);
        } else {
          setCodeError(`Customer not found with code "${formatted}". Please verify the code and try again.`);
        }
      }
    } catch (e: any) {
      setCodeError(e.message || 'Error resolving customer code');
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      setCodeError('Please enter a 5-character Customer Code (e.g. A1024)');
      return;
    }
    resolveAndSelectCode(inputCode);
  };

  // Filter for Search list tab
  const filteredFarmers = farmers.filter((f) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      (f.customerCode && f.customerCode.toLowerCase().includes(q)) ||
      f.farmerId.toLowerCase().includes(q) ||
      f.village.toLowerCase().includes(q)
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Identify Customer / Farmer"
      description={confirmedCustomer ? "Confirm customer details before starting milk collection." : "Scan customer QR card, enter customer code, or search the registered dairy directory."}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Step 2: Customer Identified Confirmation Card */}
        {confirmedCustomer ? (
          <div className="space-y-4 py-2">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-dairy-50 via-white to-slate-50 border-2 border-dairy-400 shadow-md space-y-3 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                CUSTOMER IDENTIFIED
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Customer Code</span>
                <span className="font-mono text-2xl font-black text-dairy-800 tracking-widest">
                  {confirmedCustomer.customerCode || confirmedCustomer.farmerId}
                </span>
              </div>

              <div className="border-t border-slate-200/80 pt-2 space-y-1">
                <h3 className="text-xl font-black text-slate-900">{confirmedCustomer.name}</h3>
                <p className="text-xs text-slate-600">
                  {confirmedCustomer.village} • {confirmedCustomer.animalType} Herd • Status: <strong className="text-emerald-700 font-bold">{confirmedCustomer.status}</strong>
                </p>
                <p className="text-[11px] text-slate-400 font-mono">ID: {confirmedCustomer.farmerId}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setConfirmedCustomer(null)}
                >
                  Rescan / Change
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="bg-dairy-600 hover:bg-dairy-700 text-white font-bold"
                  onClick={() => {
                    onSelectCustomer(confirmedCustomer);
                    onClose();
                  }}
                >
                  Continue to Milk Collection
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'code'
                    ? 'border-dairy-600 text-dairy-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <QrCode className="w-4 h-4" />
                Customer Code
              </button>
              <button
                onClick={() => setActiveTab('camera')}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'camera'
                    ? 'border-dairy-600 text-dairy-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Camera className="w-4 h-4" />
                Scan QR (Camera)
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'search'
                    ? 'border-dairy-600 text-dairy-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Search className="w-4 h-4" />
                Directory Search
              </button>
            </div>

        {/* Tab 1: Manual Customer Code Entry */}
        {activeTab === 'code' && (
          <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Enter 5-Character Customer Code
              </label>
              <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                <input
                  type="text"
                  maxLength={5}
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setCodeError(null);
                  }}
                  placeholder="e.g. A1024"
                  className="font-mono text-xl font-black text-center tracking-widest uppercase w-36 px-3 py-2 bg-white rounded-xl border-2 border-slate-300 focus:border-dairy-500 focus:outline-none focus:ring-2 focus:ring-dairy-100"
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSearching}
                >
                  {isSearching ? 'Finding...' : 'Find Customer'}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">
                Format: Exactly 1 uppercase letter followed by 4 digits (e.g. A1024, B5831)
              </p>
            </div>

            {codeError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{codeError}</span>
              </div>
            )}

            {/* Quick Demo Shortcuts for Operator Convenience */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Quick Sample Customer Codes:
              </p>
              <div className="flex flex-wrap gap-2">
                {['A1024', 'B5831', 'P0047', 'M2741', 'R9082'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setInputCode(sample);
                      resolveAndSelectCode(sample);
                    }}
                    className="font-mono text-xs font-bold bg-white border border-slate-200 hover:border-dairy-500 hover:bg-dairy-50 text-slate-700 hover:text-dairy-700 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Camera QR Scanner */}
        {activeTab === 'camera' && (
          <div className="space-y-3 py-2 text-center">
            {cameraError ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-3 text-left">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Camera Scanner Notice</span>
                </div>
                <p>{cameraError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('code')}
                >
                  Switch to Manual Customer Code Entry
                </Button>
              </div>
            ) : (
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-square max-w-xs mx-auto border-2 border-slate-800 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                {/* Visual Viewfinder Box */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                  <div className="w-48 h-48 border-2 border-dashed border-dairy-400 rounded-2xl animate-pulse flex items-center justify-center">
                    <span className="text-[10px] font-bold text-dairy-300 bg-slate-900/80 px-2 py-0.5 rounded uppercase tracking-wider">
                      Align QR Code
                    </span>
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-slate-500">
              Hold the customer's printed card or phone QR in front of the lens.
            </p>
          </div>
        )}

        {/* Tab 3: Directory Search */}
        {activeTab === 'search' && (
          <div className="space-y-3 py-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code, farmer name, village..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-dairy-500 focus:outline-none focus:ring-2 focus:ring-dairy-100"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filteredFarmers.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No customers found matching "{searchQuery}"
                </div>
              ) : (
                filteredFarmers.map((f) => (
                  <button
                    key={f.farmerId}
                    type="button"
                    onClick={() => {
                      onSelectCustomer(f);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-dairy-300 bg-slate-50 hover:bg-dairy-50/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-dairy-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {f.customerCode || f.farmerId}
                        </span>
                        <span className="text-sm font-bold text-slate-900 group-hover:text-dairy-700 transition-colors">
                          {f.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" /> {f.village}
                        </span>
                        <span>•</span>
                        <span>{f.animalType}</span>
                      </p>
                    </div>
                    <Badge variant={f.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                      {f.status}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </>
    )}
  </div>
</Modal>
  );
};
