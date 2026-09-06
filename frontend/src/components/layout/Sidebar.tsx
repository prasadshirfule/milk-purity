import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  Coins,
  Users,
  History,
  BarChart3,
  Cpu,
  AlertTriangle,
  Settings,
  X,
  Milk,
  Radio,
  Info
} from 'lucide-react';
import { useDemoData } from '../../context/DemoDataContext';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { summary } = useDemoData();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Milk Testing', path: '/milk-testing', icon: FlaskConical, badge: 'Live' },
    { name: 'Milk Collection', path: '/collection', icon: Coins },
    { name: 'Farmers', path: '/farmers', icon: Users },
    { name: 'Test History', path: '/history', icon: History },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'IoT Devices', path: '/devices', icon: Cpu },
    {
      name: 'Alerts',
      path: '/alerts',
      icon: AlertTriangle,
      count: summary.activeAlertsCount > 0 ? summary.activeAlertsCount : undefined
    },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'About System', path: '/about', icon: Info }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-dairy-600 to-teal-400 text-white shadow-md shadow-dairy-600/30">
              <Milk className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-white block">MILKGUARD</span>
              <span className="text-[9px] font-semibold text-dairy-400 tracking-wider uppercase block">
                Smart Milk Quality
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all duration-150 ${
                    isActive
                      ? 'bg-dairy-600 text-white shadow-md shadow-dairy-600/25 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                    {item.count !== undefined && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Hardware & System Status Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-dairy-400" />
                IoT Receiver
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <div className="text-[10px] text-slate-400 space-y-0.5">
              <div className="flex justify-between">
                <span>Active Node:</span>
                <span className="text-slate-200 font-mono font-medium">ESP32-001</span>
              </div>
              <div className="flex justify-between">
                <span>Sampling:</span>
                <span className="text-slate-200">1.2s Interval</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
