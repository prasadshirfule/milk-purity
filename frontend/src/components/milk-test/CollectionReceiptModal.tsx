import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { MilkTest, MilkCollection, Farmer } from '../../types';
import { Milk, Printer, Play, Eye, CheckCircle2, QrCode, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface CollectionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: MilkTest;
  collection?: MilkCollection | null;
  farmer?: Farmer | null;
  onNewTest: () => void;
}

export const CollectionReceiptModal: React.FC<CollectionReceiptModalProps> = ({
  isOpen,
  onClose,
  test,
  collection,
  farmer,
  onNewTest
}) => {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  const code = test.customerCode || farmer?.customerCode || test.farmerId;
  const farmerName = test.farmerName || farmer?.name || 'Registered Customer';
  const village = farmer?.village || 'Local Dairy Hub';
  const testDate = new Date(test.timestamp);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Milk Collection Receipt"
      description="Authoritative intake record and financial payout summary."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Printable Receipt Paper Card */}
        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-white text-slate-900 space-y-4 printable-area">
          {/* Brand Header */}
          <div className="text-center space-y-1 border-b border-slate-200 pb-3">
            <div className="flex items-center justify-center gap-2">
              <div className="p-1.5 bg-dairy-700 text-white rounded-lg">
                <Milk className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-900">MILKGUARD</h1>
            </div>
            <p className="text-[11px] font-bold text-dairy-700 uppercase tracking-widest">
              Milk Collection & Quality Intake Receipt
            </p>
          </div>

          {/* Customer & Timestamp Info */}
          <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Customer Name</span>
              <strong className="text-slate-900 text-sm">{farmerName}</strong>
              <p className="text-[11px] text-slate-500">{village}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Customer Code</span>
              <span className="font-mono text-sm font-black text-dairy-800 bg-dairy-50 px-2 py-0.5 rounded border border-dairy-200 inline-block">
                {code}
              </span>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {test.farmerId}</p>
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">Date & Time:</span>
              <span className="font-semibold text-slate-800">
                {testDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} • {testDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Collection ID:</span>
              <span className="font-mono font-bold text-dairy-800">
                {collection?.collectionId || `COL-${test.testId.replace('TST-', '')}`}
              </span>
            </div>
          </div>

          {/* Volume & Quality Assessment Breakdown */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Delivered Volume:</span>
              <strong className="text-slate-900 text-sm font-mono">{test.quantity.toFixed(2)} Litres</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Estimated Fat Content:</span>
              <strong className="text-slate-800 font-mono">{test.fat}%</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Purity Score (%):</span>
              <strong className="text-dairy-800 font-mono text-sm">{test.purityScore || test.qualityScore}%</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">AI Quality Recommendation:</span>
              <Badge variant={test.aiRecommendation === 'ACCEPT' ? 'success' : test.aiRecommendation === 'REVIEW' ? 'warning' : 'danger'} size="sm">
                {test.aiRecommendation || 'ACCEPT'}
              </Badge>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Operator Decision:</span>
              <strong className="text-slate-800 font-bold uppercase">{test.operatorDecision || test.result}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Final Intake Status:</span>
              <Badge variant={test.result === 'ACCEPTED' ? 'success' : test.result === 'WARNING' ? 'warning' : 'danger'} size="sm">
                {test.result}
              </Badge>
            </div>
          </div>

          {/* Financial Settlement */}
          {test.result !== 'REJECTED' && test.ratePerLiter ? (
            <div className="bg-dairy-50/80 p-3.5 rounded-xl border border-dairy-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Procurement Rate:</span>
                <span className="font-mono font-bold text-slate-900">₹{test.ratePerLiter.toFixed(2)} / L</span>
              </div>
              <div className="flex justify-between text-sm font-black text-dairy-950 pt-1 border-t border-dairy-200">
                <span>Total Amount Payable:</span>
                <span className="font-mono text-base text-dairy-800">
                  ₹{(test.totalAmount || (test.quantity * test.ratePerLiter)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 text-center font-medium">
              Milk batch was rejected. Payout: ₹0.00. No ledger credit issued.
            </div>
          )}

          <div className="text-center text-[10px] text-slate-400 pt-1">
            Standard Intake Acknowledgement • Not a certified laboratory assay
          </div>
        </div>

        {/* Action Controls - Hidden during print */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 no-print">
          <Button
            variant="outline"
            size="md"
            onClick={handlePrint}
            icon={<Printer className="w-4 h-4" />}
            className="w-full justify-center"
          >
            Print Receipt
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => {
              onClose();
              navigate(`/customer/${encodeURIComponent(code)}`);
            }}
            icon={<Eye className="w-4 h-4" />}
            className="w-full justify-center"
          >
            View Customer
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              onClose();
              onNewTest();
            }}
            icon={<Play className="w-4 h-4" />}
            className="w-full justify-center bg-dairy-600 hover:bg-dairy-700 text-white font-bold"
          >
            New Collection
          </Button>
        </div>
      </div>
    </Modal>
  );
};
