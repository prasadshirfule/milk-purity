import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Farmer } from '../../types';
import { Printer, Play, Copy, Check, QrCode, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateCustomerQRUrl } from '../../utils/qrParser';

export interface CustomerQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmer: Farmer;
  onPrint?: () => void;
}

export const CustomerQRModal: React.FC<CustomerQRModalProps> = ({
  isOpen,
  onClose,
  farmer,
  onPrint
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);

  const code = farmer.customerCode || farmer.farmerId;
  const qrUrl = generateCustomerQRUrl(code);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartTest = () => {
    onClose();
    navigate(`/milk-testing?customerCode=${encodeURIComponent(code)}&farmerId=${encodeURIComponent(farmer.farmerId)}`);
  };

  const handlePrintCard = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer QR Identification"
      description="Scan or present this QR code during milk delivery to start instant testing."
      maxWidth="md"
    >
      <div className="flex flex-col items-center text-center space-y-5 py-2">
        {/* Customer Badge and ID */}
        <div className="space-y-1.5 w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-dairy-50 rounded-full border border-dairy-200 text-dairy-800 text-xs font-semibold">
            <QrCode className="w-3.5 h-3.5 text-dairy-600" />
            <span>MILKGUARD OFFICIAL IDENTIFICATION</span>
          </div>
          <h3 className="text-xl font-black text-slate-900">{farmer.name}</h3>
          <p className="text-xs text-slate-500">{farmer.village} • {farmer.animalType} Milk Supplier</p>
        </div>

        {/* Customer Code Banner */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Customer Code:</span>
          <span className="font-mono text-lg font-black tracking-widest text-dairy-700">{code}</span>
          <button
            onClick={handleCopy}
            title="Copy Customer Code"
            className="p-1.5 rounded-lg text-slate-400 hover:text-dairy-600 hover:bg-dairy-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* QR Code Graphic Container */}
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm inline-block">
          <QRCodeSVG
            value={qrUrl}
            size={200}
            level="H"
            includeMargin
            imageSettings={{
              src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%230284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16a4 4 0 0 1 4-4 4 4 0 0 1 4 4v3a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-3z"/><path d="M12 2a4 4 0 0 1 4 4v2H8V6a4 4 0 0 1 4-4z"/></svg>',
              height: 24,
              width: 24,
              excavate: true
            }}
          />
        </div>

        <p className="text-xs text-slate-500 max-w-xs">
          Encoded URL: <span className="font-mono text-slate-600 font-medium break-all">{qrUrl}</span>
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintCard}
            icon={<Printer className="w-4 h-4 text-slate-600" />}
            className="w-full justify-center"
          >
            Print QR Card
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleStartTest}
            icon={<Play className="w-4 h-4" />}
            className="w-full justify-center"
          >
            Start Milk Test
          </Button>
        </div>
      </div>
    </Modal>
  );
};
