import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AuditLog, UserRole, AuditAction } from '../types';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/common/Button';

export const AuditLogs: React.FC = () => {
  const { hasRole, user: currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [customerCodeFilter, setCustomerCodeFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAuditLogs({
        role: selectedRole !== 'ALL' ? selectedRole : undefined,
        action: selectedAction !== 'ALL' ? selectedAction : undefined,
        customerCode: customerCodeFilter ? customerCodeFilter.trim().toUpperCase() : undefined,
        limit: 100
      });

      if (res.success && res.data) {
        setLogs(res.data);
      } else {
        // Mock fallback if offline demo
        setLogs([
          {
            auditId: 'AUD-SEED-01',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            userId: 'usr_admin_01',
            userName: 'Vikram Malhotra',
            role: 'ADMIN',
            action: 'LOGIN',
            entityType: 'AUTH',
            details: { method: 'password' }
          },
          {
            auditId: 'AUD-SEED-02',
            timestamp: new Date(Date.now() - 3000000).toISOString(),
            userId: 'usr_op_01',
            userName: 'Rajendra Deshmukh',
            role: 'OPERATOR',
            action: 'CREATE_MILK_TEST',
            entityType: 'MILK_TEST',
            entityId: 'TEST-20260907-001',
            customerCode: 'A1024',
            details: { purityScore: 94.5, decision: 'ACCEPT' }
          }
        ]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedRole, selectedAction]);

  if (!hasRole('ADMIN')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-400 max-w-md">
          The Audit Logs ledger contains sensitive security and operational compliance trails. Only users with the <span className="text-amber-400 font-semibold">ADMIN</span> role have authorization to view this section.
        </p>
      </div>
    );
  }

  // Filter logs locally by search term
  const filteredLogs = logs.filter((log) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = log.userName.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchEntity = log.entityId?.toLowerCase().includes(q) || false;
      const matchCode = log.customerCode?.toLowerCase().includes(q) || false;
      if (!matchName && !matchAction && !matchEntity && !matchCode) return false;
    }
    if (customerCodeFilter && log.customerCode) {
      if (!log.customerCode.toUpperCase().includes(customerCodeFilter.trim().toUpperCase())) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'LOGIN':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LOGIN</span>;
      case 'LOGOUT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">LOGOUT</span>;
      case 'CREATE_MILK_TEST':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">MILK TEST</span>;
      case 'OVERRIDE_RECOMMENDATION':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">OVERRIDE</span>;
      case 'REJECT_MILK':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">REJECT</span>;
      case 'ACCEPT_MILK':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">ACCEPT</span>;
      case 'CREATE_COLLECTION':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">COLLECTION</span>;
      case 'UPDATE_SETTINGS':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">SETTINGS</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-700/50 text-slate-300 border border-slate-600">{action}</span>;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <span className="text-[11px] font-bold text-amber-400">ADMIN</span>;
      case 'OPERATOR':
        return <span className="text-[11px] font-bold text-dairy-400">OPERATOR</span>;
      case 'QUALITY_OPERATOR':
        return <span className="text-[11px] font-bold text-purple-400">QUALITY</span>;
      case 'VIEWER':
        return <span className="text-[11px] font-bold text-slate-400">VIEWER</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Audit Trail & Compliance Ledger</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of operator quality decisions, batch overrides, logins, collections and system configurations.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          isLoading={loading}
          icon={<RefreshCw className="w-4 h-4" />}
          className="bg-slate-900 border-slate-800 text-slate-300"
        >
          Refresh Log
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user, ID, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-dairy-500"
          />
        </div>

        <div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-dairy-500"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="OPERATOR">OPERATOR</option>
            <option value="QUALITY_OPERATOR">QUALITY_OPERATOR</option>
            <option value="VIEWER">VIEWER</option>
          </select>
        </div>

        <div>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-dairy-500"
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CREATE_MILK_TEST">CREATE_MILK_TEST</option>
            <option value="ACCEPT_MILK">ACCEPT_MILK</option>
            <option value="REJECT_MILK">REJECT_MILK</option>
            <option value="OVERRIDE_RECOMMENDATION">OVERRIDE_RECOMMENDATION</option>
            <option value="CREATE_COLLECTION">CREATE_COLLECTION</option>
            <option value="UPDATE_SETTINGS">UPDATE_SETTINGS</option>
          </select>
        </div>

        <div>
          <input
            type="text"
            placeholder="Filter Customer Code (e.g. A1024)"
            value={customerCodeFilter}
            onChange={(e) => setCustomerCodeFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-dairy-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">Operator / User</th>
                <th className="py-3.5 px-4 font-semibold">Role</th>
                <th className="py-3.5 px-4 font-semibold">Action</th>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Entity / Reference</th>
                <th className="py-3.5 px-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.auditId} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-white whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getRoleBadge(log.role)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.customerCode ? (
                        <span className="font-mono font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                          {log.customerCode}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {log.entityId || log.entityType}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      {log.details ? (
                        <span title={JSON.stringify(log.details, null, 2)}>
                          {log.details.overrideReason
                            ? `Override Reason: "${log.details.overrideReason}"`
                            : Object.entries(log.details)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(', ')}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/40 border-t border-slate-800 text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{filteredLogs.length === 0 ? 0 : (page - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-white">{Math.min(page * pageSize, filteredLogs.length)}</strong> of{' '}
            <strong className="text-white">{filteredLogs.length}</strong> events
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 disabled:opacity-30 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-xs text-white">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 disabled:opacity-30 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
