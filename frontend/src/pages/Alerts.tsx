import React, { useState } from 'react';
import { useDemoData } from '../context/DemoDataContext';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Alert, AlertSeverity, AlertStatus } from '../types';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  X,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';

export const Alerts: React.FC = () => {
  const { alerts, updateAlertStatus } = useDemoData();

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    const matchesSearch =
      a.message.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      (a.farmerName && a.farmerName.toLowerCase().includes(search.toLowerCase())) ||
      (a.testId && a.testId.toLowerCase().includes(search.toLowerCase()));

    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getAlertIcon = (type: string, severity: AlertSeverity) => {
    if (severity === 'CRITICAL') return <AlertCircle className="w-5 h-5 text-rose-600" />;
    if (severity === 'WARNING') return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <Info className="w-5 h-5 text-sky-600" />;
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="danger" size="sm">CRITICAL</Badge>;
      case 'WARNING':
        return <Badge variant="warning" size="sm">WARNING</Badge>;
      case 'INFO':
        return <Badge variant="info" size="sm">INFO</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            System Alerts & Quality Screening Audit Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time notifications for anomalous sensor thresholds, device disconnections, and flagged batches
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts by test ID, farmer, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-dairy-500 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-dairy-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Alerts Only</option>
            <option value="RESOLVED">Resolved Alerts</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-dairy-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Information</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No matching alerts</h3>
            <p className="text-xs text-slate-400 mt-1">All dairy dock telemetry parameters are normal.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.alertId}
              className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all ${
                alert.status === 'ACTIVE'
                  ? 'border-slate-200 shadow-sm'
                  : 'border-slate-100 opacity-60 bg-slate-50/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getAlertIcon(alert.type, alert.severity)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">
                        {alert.type.replace(/_/g, ' ')}
                      </span>
                      {getSeverityBadge(alert.severity)}
                      <span className="text-[11px] font-mono text-slate-400">
                        {alert.alertId}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span>
                        Time: {new Date(alert.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      {alert.farmerName && (
                        <span>• Farmer: <strong className="text-slate-700">{alert.farmerName}</strong></span>
                      )}
                      {alert.testId && (
                        <span>• Linked Test: <strong className="text-slate-700 font-mono">{alert.testId}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                    alert.status === 'ACTIVE' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {alert.status}
                  </span>

                  {alert.status === 'ACTIVE' && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateAlertStatus(alert.alertId, 'RESOLVED')}
                        icon={<Check className="w-3.5 h-3.5 text-emerald-600" />}
                      >
                        Resolve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateAlertStatus(alert.alertId, 'DISMISSED')}
                        className="text-slate-400 hover:text-slate-600"
                        icon={<X className="w-3.5 h-3.5" />}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
