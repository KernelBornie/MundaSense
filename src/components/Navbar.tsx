import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { usePolling } from '../hooks/usePolling';
import { Role } from '../types';
import {
  Sprout,
  Play,
  Radio,
  FileCode,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Shield,
  User,
  ShoppingBag,
  Truck,
  Building2,
  LogOut,
  Wifi,
  WifiOff,
  CloudSun,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSensorModal: () => void;
  onOpenCodeModal: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSensorModal,
  onOpenCodeModal,
  onLogout,
}) => {
  const {
    currentUser,
    setCurrentUserRole,
    stats,
    startGuidedDemo,
    isDemoRunning,
    resetDemoData,
  } = useApp();

  const { data: health } = usePolling<any>('/api/health', 10000);
  const farmCount = health?.farm_count || stats.totalFarms || 551;
  const depotCount = health?.depots_total || 47;
  const hubCount = health?.hubs_online || 15;

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const roleOptions: { role: Role; label: string; icon: React.ReactNode; color: string }[] = [
    { role: 'farmer', label: 'Farmer (Smallholder)', icon: <User className="w-3.5 h-3.5" />, color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
    { role: 'admin', label: 'Admin (Field Officer)', icon: <Shield className="w-3.5 h-3.5" />, color: 'bg-blue-950 text-blue-300 border-blue-800' },
    { role: 'seller', label: 'Seller (Agro Dealer)', icon: <Building2 className="w-3.5 h-3.5" />, color: 'bg-teal-950 text-teal-300 border-teal-800' },
    { role: 'customer', label: 'Customer (Grain Offtaker)', icon: <ShoppingBag className="w-3.5 h-3.5" />, color: 'bg-purple-950 text-purple-300 border-purple-800' },
    { role: 'transporter', label: 'Transporter (ZamCargo)', icon: <Truck className="w-3.5 h-3.5" />, color: 'bg-orange-950 text-orange-300 border-orange-800' },
  ];

  return (
    <header className="border-b border-[#1f3124] bg-[#0c140f]/95 backdrop-blur sticky top-0 z-40">
      {/* Offline Status Warning Banner */}
      {!isOnline && (
        <div className="bg-rose-950 border-b border-rose-700/80 px-4 py-1.5 text-xs text-rose-200 flex items-center justify-center gap-2 font-medium animate-pulse">
          <WifiOff className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>
            <b>Offline Mode:</b> Network connectivity lost. Sensor telemetry updates, SMS dispatch, and cloud sync are paused. Local cached data remains active.
          </span>
        </div>
      )}

      {/* Top Banner with Stats and Actions */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Brand & Nationwide Counters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/40">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-extrabold text-sm tracking-tight text-white">
                <span>MundaSense</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#16271c] border border-emerald-800/60 rounded text-emerald-400 font-mono">
                  ZAMBIA 🇿🇲
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">
                Smallholder IoT Telemetry &amp; AI Screening
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-[#1f3124]">
            <span className="flex items-center gap-1.5 text-gray-200 font-semibold bg-[#132217] px-2.5 py-1 rounded-lg border border-[#203625]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{farmCount} Farms · {depotCount} Depots</span>
            </span>
            <span className="text-gray-600">·</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> {stats.healthyFarms} Healthy
            </span>
            <span className="text-gray-600">·</span>
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <AlertTriangle className="w-3 h-3" /> {stats.watchFarms} Watch
            </span>
            <span className="text-gray-600">·</span>
            <span className="flex items-center gap-1 text-rose-400 font-semibold">
              <AlertOctagon className="w-3 h-3" /> {stats.alertFarms} Alert
            </span>
          </div>
        </div>

        {/* Global Toolbar Actions & Offline Indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Offline / Online Sync Status Indicator */}
          <div className="flex items-center mr-1">
            {isOnline ? (
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-[11px] font-mono text-emerald-300"
                title="Connected to MundaSense Cloud. Telemetry and SMS sync active."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>Sync Active</span>
              </span>
            ) : (
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/90 border border-rose-600 text-[11px] font-mono text-rose-200"
                title="Network disconnected. Telemetry, SMS, and database sync paused."
              >
                <WifiOff className="w-3 h-3 text-rose-400 animate-bounce" />
                <span>Offline · Sync Paused</span>
              </span>
            )}
          </div>

          {/* 15-Step Hackathon Demo Launcher */}
          <button
            onClick={startGuidedDemo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer ${
              isDemoRunning
                ? 'bg-amber-500 text-black shadow-amber-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
            title="Start 15-step end-to-end presentation flow"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isDemoRunning ? 'Resume Guided Demo' : 'Start 15-Step Demo'}</span>
          </button>

          {/* Simulate ESP32 Packet Button */}
          <button
            onClick={onOpenSensorModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#142217] hover:bg-[#1a2d1f] text-emerald-300 border border-[#233b28] font-medium transition cursor-pointer"
            title="Inject ESP32 Sensor Telemetry packet"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulate ESP32</span>
          </button>

          {/* View Source Code / ESP32 Code */}
          <button
            onClick={onOpenCodeModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#142217] hover:bg-[#1a2d1f] text-gray-300 border border-[#233b28] font-medium transition cursor-pointer"
            title="View FastAPI, ESP32, and Simulator Code"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Code / Firmware</span>
          </button>

          {/* Reset Baseline */}
          <button
            onClick={resetDemoData}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#19271c] rounded-lg transition cursor-pointer"
            title="Reset to baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-xs text-gray-300 hover:text-rose-300 px-3 py-1.5 border border-[#233b28] hover:border-rose-900/50 rounded-lg transition cursor-pointer"
              title="Sign out of MundaSense"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links and Role Switcher Row */}
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto border-t border-[#1a2b1f] text-xs">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 py-1 min-w-max">
          {[
            { id: 'dashboard', label: 'Operations Map' },
            { id: 'farms', label: `${farmCount} Farms Directory` },
            { id: 'climate', label: 'Climate Risk Radar' },
            { id: 'sensors', label: 'IoT Sensor Hubs' },
            { id: 'disease', label: 'AI Disease Screening' },
            { id: 'advisories', label: 'Advisory Engine' },
            { id: 'marketplace', label: 'ZMW Marketplace' },
            { id: 'transport', label: 'Transport Logistics' },
            { id: 'tracking', label: 'Live Tracking' },
            { id: 'storage', label: 'Hermetic Storage' },
            { id: 'simulators', label: 'USSD / SMS Phones' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-md font-semibold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-[#16271c]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#121e15]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Active Role Switcher */}
        <div className="flex items-center gap-1.5 py-1 pl-4 border-l border-[#1a2b1f] min-w-max">
          <span className="text-[11px] text-gray-500 uppercase font-mono tracking-wider">Role:</span>
          <select
            value={currentUser.role}
            onChange={(e) => setCurrentUserRole(e.target.value as Role)}
            className="bg-[#132016] text-emerald-300 border border-[#233a28] rounded-md px-2 py-1 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {roleOptions.map((opt) => (
              <option key={opt.role} value={opt.role} className="bg-[#0c140f] text-gray-200">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
