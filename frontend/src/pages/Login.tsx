import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { UserRole } from '../types';
import { Milk, Eye, EyeOff, Lock, User as UserIcon, Sparkles, ShieldCheck, CheckCircle2, ShieldAlert, FileText } from 'lucide-react';
import { Button } from '../components/common/Button';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, demoLogin, isLoading } = useAuth();

  const [username, setUsername] = useState('operator');
  const [password, setPassword] = useState('dairy2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await login(username, password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.error || 'Invalid credentials. Please verify your username and password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login request failed. Check server connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setSubmitting(true);
    setError('');
    try {
      await demoLogin(role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to switch demo account.');
    } finally {
      setSubmitting(false);
    }
  };

  const demoRoles: { role: UserRole; title: string; desc: string; icon: any; color: string; badge: string }[] = [
    {
      role: 'ADMIN',
      title: 'Administrator',
      desc: 'Full access: Audit Logs, User Mgmt, Settings, Testing & Collections',
      icon: ShieldCheck,
      color: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30 hover:border-amber-400',
      badge: 'admin / dairy2026'
    },
    {
      role: 'OPERATOR',
      title: 'Station Operator',
      desc: 'Milk Testing, Quality Scoring, Farmer Collections, Receipts',
      icon: Milk,
      color: 'from-dairy-500/20 to-blue-600/10 text-dairy-400 border-dairy-500/30 hover:border-dairy-400',
      badge: 'operator / dairy2026'
    },
    {
      role: 'QUALITY_OPERATOR',
      title: 'Quality Analyst',
      desc: 'Purity Assessment, Lab Verification, Override Decisions',
      icon: ShieldAlert,
      color: 'from-purple-500/20 to-indigo-600/10 text-purple-400 border-purple-500/30 hover:border-purple-400',
      badge: 'quality / dairy2026'
    },
    {
      role: 'VIEWER',
      title: 'Auditor / Viewer',
      desc: 'Read-only access to Dashboards, Ledgers, Reports & History',
      icon: FileText,
      color: 'from-slate-500/20 to-slate-600/10 text-slate-300 border-slate-600/40 hover:border-slate-400',
      badge: 'viewer / dairy2026'
    }
  ];

  return (
    <div className="min-h-screen w-screen flex bg-slate-900 overflow-hidden font-sans">
      {/* Left visual hero */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-950 via-slate-900 to-dairy-950 p-12 flex-col justify-between border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-dairy-500 to-teal-400 text-white shadow-lg shadow-dairy-500/30">
            <Milk className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white block">MILKGUARD</span>
            <span className="text-xs font-semibold text-dairy-400 tracking-wider uppercase block">
              Smart Milk Quality & Dairy Management
            </span>
          </div>
        </div>

        <div className="max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dairy-500/10 border border-dairy-500/20 text-dairy-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Enterprise RBAC & Audit Trail
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Role-Based Terminal Access & Full Operational Audit.
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Authenticated operator binding for every milk quality decision, immutable audit logging, and server-side RBAC authorization for tamper-proof dairy records.
          </p>

          <div className="space-y-3 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-dairy-400 shrink-0" />
              <span>Cryptographic operator identity bound to tests & collection receipts</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-dairy-400 shrink-0" />
              <span>Multi-role authorization: ADMIN, OPERATOR, QUALITY, VIEWER</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-dairy-400 shrink-0" />
              <span>Centralized audit logging of overrides, logins & configurations</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          © 2026 MILKGUARD Systems • Academic & Industrial Milk Quality Demonstration
        </div>
      </div>

      {/* Right Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-900 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 bg-slate-950/90 p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl">
          <div className="text-center sm:text-left">
            <div className="lg:hidden inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-dairy-500 to-teal-400 text-white shadow-lg mb-4">
              <Milk className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Operator Authentication</h2>
            <p className="text-xs text-slate-400 mt-1">
              Sign in with your assigned terminal credentials or select a demo role.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / operator / quality / viewer"
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-dairy-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-dairy-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-bold shadow-lg shadow-dairy-600/30"
              isLoading={submitting || isLoading}
            >
              Sign In to Station
            </Button>
          </form>

          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-950 px-3 text-slate-500 font-semibold tracking-wider">
                1-Click Demo Accounts
              </span>
            </div>
          </div>

          {/* Quick 1-Click Role Selectors */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {demoRoles.map((dr) => {
              const Icon = dr.icon;
              return (
                <button
                  key={dr.role}
                  type="button"
                  onClick={() => handleQuickDemo(dr.role)}
                  className={`flex flex-col text-left p-3 rounded-xl border bg-gradient-to-br ${dr.color} transition-all duration-150 group hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs">{dr.title}</span>
                    <Icon className="w-3.5 h-3.5 opacity-80" />
                  </div>
                  <span className="text-[10px] text-slate-400 line-clamp-1">{dr.badge}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
