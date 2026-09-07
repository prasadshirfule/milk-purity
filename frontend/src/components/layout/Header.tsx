import React from 'react';
import { Menu, Search, Cpu, Sparkles, User as UserIcon, LogOut, ShieldCheck } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuth } from '../../context/AuthContext';
import { useDemoData } from '../../context/DemoDataContext';
import { useLocation } from 'react-router-dom';
import { UserRole } from '../../types';

export interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { isDemoMode, setDemoMode, connectionError, isLoading, summary } = useDemoData();
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
      case '/dashboard':
        return 'Dairy Overview Dashboard';
      case '/milk-testing':
        return 'Real-Time Milk Quality Testing';
      case '/collection':
        return 'Milk Collection & Financial Ledger';
      case '/ledger':
        return 'Farmer Accounts & Payout Ledger';
      case '/farmers':
        return 'Farmer Registry & Accounts';
      case '/history':
        return 'Historical Milk Test Records';
      case '/analytics':
        return 'Quality Telemetry & AI Analytics';
      case '/reports':
        return 'Quality & Yield Inspection Reports';
      case '/devices':
        return 'IoT Hardware & ESP32 Nodes';
      case '/alerts':
        return 'System Alerts & Quality Audit';
      case '/audit-logs':
        return 'Audit Logs & Compliance Ledger';
      case '/users':
        return 'Operator & User Management';
      case '/settings':
        return 'Dairy Standards & Settings';
      case '/about':
        return 'About System & Architecture';
      default:
        if (path.startsWith('/farmers/')) return 'Farmer Profile & History';
        if (path.startsWith('/devices/')) return 'IoT Device Telemetry';
        return 'Dairy Management Portal';
    }
  };

  const getRoleColor = (role?: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-amber-500/10 text-amber-700 border-amber-300';
      case 'OPERATOR':
        return 'bg-dairy-500/10 text-dairy-700 border-dairy-300';
      case 'QUALITY_OPERATOR':
        return 'bg-purple-500/10 text-purple-700 border-purple-300';
      case 'VIEWER':
        return 'bg-slate-500/10 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile menu toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-none">
            {getPageTitle(location.pathname)}
          </h1>
          <p className="text-[11px] font-medium text-slate-400 mt-1 flex items-center gap-1.5 hidden sm:flex">
            <span>Amrit Dairy Network</span>
            <span>•</span>
            <span className="text-dairy-600 font-semibold">Testing Station Bay-A</span>
          </p>
        </div>
      </div>

      {/* Right: Telemetry status, Demo badge, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Device Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
          <Cpu className="w-3.5 h-3.5 text-dairy-600" />
          <span>ESP32:</span>
          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold uppercase tracking-wider text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {summary.deviceStatus}
          </span>
        </div>

        {/* Mode Switcher Badge (Demo vs Connected API) */}
        {isDemoMode ? (
          <button
            onClick={() => setDemoMode(false)}
            title="Click to switch to Connected Mode (Live Express Backend API)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span className="hidden sm:inline">DEMO MODE</span>
          </button>
        ) : (
          <button
            onClick={() => setDemoMode(true)}
            title="Click to switch to Demo Mode (Local Simulation)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              connectionError
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800'
                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
            }`}
          >
            {isLoading ? (
              <span className="w-2 h-2 rounded-full bg-dairy-500 animate-ping" />
            ) : connectionError ? (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
            <span className="hidden sm:inline">
              {isLoading ? 'CONNECTING...' : connectionError ? 'API OFFLINE' : 'CONNECTED API'}
            </span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <NotificationDropdown />

        <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />

        {/* User Profile avatar & Role badge */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-dairy-600 to-teal-400 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {user ? user.name.slice(0, 2).toUpperCase() : 'OP'}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-none">{user?.name || 'Operator'}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded border ${getRoleColor(
                  user?.role
                )}`}
              >
                {user?.role || 'OPERATOR'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
