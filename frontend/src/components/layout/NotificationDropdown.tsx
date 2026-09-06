import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, AlertTriangle, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { useDemoData } from '../../context/DemoDataContext';
import { useNavigate } from 'react-router-dom';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { alerts, updateAlertStatus } = useDemoData();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'HIGH_CONDUCTIVITY':
      case 'SUSPICIOUS_MILK':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'ABNORMAL_PH':
      case 'LOW_FAT':
      case 'DEVICE_OFFLINE':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {activeAlerts.length > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {activeAlerts.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/75">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">Alerts & Notices</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">
                {activeAlerts.length} Active
              </span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/alerts');
              }}
              className="text-xs font-semibold text-dairy-600 hover:text-dairy-700 flex items-center gap-1"
            >
              View All <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {activeAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active notifications or alerts
              </div>
            ) : (
              activeAlerts.slice(0, 5).map((alert) => (
                <div key={alert.alertId} className="p-3.5 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{alert.type.replace(/_/g, ' ')}</p>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{alert.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => updateAlertStatus(alert.alertId, 'RESOLVED')}
                      title="Mark as resolved"
                      className="text-slate-400 hover:text-emerald-600 p-1 hover:bg-emerald-50 rounded-md transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
