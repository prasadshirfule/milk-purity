import React from 'react';
import { Menu, Search, Cpu, Sparkles, User as UserIcon, LogOut } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuth } from '../../context/AuthContext';
import { useDemoData } from '../../context/DemoDataContext';
import { useLocation } from 'react-router-dom';

export interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { isDemoMode, summary } = useDemoData();
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
      case '/farmers':
        return 'Farmer Registry & Accounts';
      case '/history':
        return 'Historical Milk Test Records';
      case '/reports':
        return 'Analytics & Quality Reports';
      case '/devices':
        return 'IoT Hardware & ESP32 Nodes';
      case '/alerts':
        return 'System Alerts & Quality Audit';
      case '/settings':
        return 'Dairy Standards & Settings';
      default:
        if (path.startsWith('/farmers/')) return 'Farmer Profile & History';
        if (path.startsWith('/devices/')) return 'IoT Device Telemetry';
        return 'Dairy Management Portal';
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

        {/* Demo Mode Badge */}
        {isDemoMode && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span className="hidden sm:inline">DEMO MODE</span>
          </div>
        )}

        {/* Notifications Dropdown */}
        <NotificationDropdown />

        <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />

        {/* User Profile avatar */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-dairy-600 to-teal-400 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {user ? user.name.slice(0, 2).toUpperCase() : 'OP'}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-none">{user?.name || 'Operator'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{user?.role || 'Dairy Operator'}</p>
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
