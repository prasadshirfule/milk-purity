import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, UserRole, UserStatus } from '../types';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  RefreshCw,
  AlertTriangle,
  Mail,
  Calendar,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/common/Button';

export const UserManagement: React.FC = () => {
  const { hasRole, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      } else {
        // Fallback default demo users
        setUsers([
          {
            userId: 'usr_admin_01',
            name: 'Vikram Malhotra',
            username: 'admin',
            role: 'ADMIN',
            status: 'ACTIVE',
            email: 'admin@milkguard.dairy',
            createdAt: '2026-01-01T00:00:00.000Z'
          },
          {
            userId: 'usr_op_01',
            name: 'Rajendra Deshmukh',
            username: 'operator',
            role: 'OPERATOR',
            status: 'ACTIVE',
            email: 'operator@milkguard.dairy',
            createdAt: '2026-01-10T00:00:00.000Z'
          },
          {
            userId: 'usr_quality_01',
            name: 'Dr. Sunita Rao',
            username: 'quality',
            role: 'QUALITY_OPERATOR',
            status: 'ACTIVE',
            email: 'quality@milkguard.dairy',
            createdAt: '2026-01-15T00:00:00.000Z'
          },
          {
            userId: 'usr_viewer_01',
            name: 'Auditor Ramesh',
            username: 'viewer',
            role: 'VIEWER',
            status: 'ACTIVE',
            email: 'viewer@milkguard.dairy',
            createdAt: '2026-02-01T00:00:00.000Z'
          }
        ]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userToUpdate: User) => {
    const newStatus: UserStatus = userToUpdate.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.updateUser(userToUpdate.userId, { status: newStatus });
      if (res.success) {
        setActionSuccess(`User ${userToUpdate.name} is now ${newStatus}`);
        setTimeout(() => setActionSuccess(null), 3000);
        setUsers((prev) =>
          prev.map((u) => (u.userId === userToUpdate.userId ? { ...u, status: newStatus } : u))
        );
      } else {
        setError(res.error || 'Failed to update user status');
      }
    } catch (err: any) {
      setError(err?.message || 'Update failed');
    }
  };

  if (!hasRole('ADMIN')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-400 max-w-md">
          User & Operator Provisioning requires <span className="text-amber-400 font-semibold">ADMIN</span> authorization.
        </p>
      </div>
    );
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            ADMIN
          </span>
        );
      case 'OPERATOR':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-dairy-500/10 text-dairy-400 border border-dairy-500/30">
            OPERATOR
          </span>
        );
      case 'QUALITY_OPERATOR':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            QUALITY OPERATOR
          </span>
        );
      case 'VIEWER':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            VIEWER
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Operator & Role Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure operator terminal identities, assign role permissions, and activate/deactivate accounts.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          isLoading={loading}
          icon={<RefreshCw className="w-4 h-4" />}
          className="bg-slate-900 border-slate-800 text-slate-300"
        >
          Refresh Users
        </Button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* User Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((u) => {
          const isCurrent = u.userId === currentUser?.userId;
          return (
            <div
              key={u.userId}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-white">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {u.name}
                        {isCurrent && (
                          <span className="text-[10px] text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                    </div>
                  </div>
                  {getRoleBadge(u.role)}
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-900">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{u.email || 'No email registered'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Registered: {new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-semibold text-[11px]">Status:</span>
                    <span
                      className={`font-semibold ${
                        u.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-900 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">ID: {u.userId}</span>
                {!isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(u)}
                    className={
                      u.status === 'ACTIVE'
                        ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs'
                        : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs'
                    }
                  >
                    {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
