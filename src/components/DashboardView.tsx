import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { FarmMap } from './FarmMap';
import {
  Sprout,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Droplets,
  Activity,
  ShoppingBag,
  BellRing,
  Cpu,
  Truck,
  Warehouse,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  onScreenFarm: (farmId: number) => void;
}

export function DashboardView({ setActiveTab, onScreenFarm }: DashboardViewProps) {
  const { data: farms, refresh: refreshFarms, tick } = usePolling<any[]>('/api/farms', 5000);
  const { data: listings } = usePolling<any[]>('/api/marketplace', 5000);
  const { data: advisories } = usePolling<any[]>('/api/advisories', 5000);
  const { data: hubs } = usePolling<any[]>('/api/sensors/hubs', 5000);
  const { data: silos } = usePolling<any[]>('/api/storage/silos', 5000);
  const { data: transport } = usePolling<any[]>('/api/transport/requests', 5000);

  // Compute live KPIs
  const totalFarms = farms?.length || 0;
  const healthyFarms = farms ? farms.filter((f) => f.health_status === 'healthy').length : 0;
  const watchFarms = farms ? farms.filter((f) => f.health_status === 'watch').length : 0;
  const alertFarms = farms ? farms.filter((f) => f.health_status === 'alert').length : 0;

  const avgSoilMoisture =
    totalFarms > 0
      ? (
          farms!.reduce((acc, f) => acc + (Number(f.soil_moisture) || 0), 0) /
          totalFarms
        ).toFixed(1)
      : '0.0';

  const activeListingsCount = listings ? listings.filter((l) => l.status === 'available').length : 0;
  const totalListingKg = listings
    ? listings.reduce((acc, l) => acc + (Number(l.quantity_kg) || 0), 0)
    : 0;

  const totalAdvisoriesCount = advisories?.length || 0;
  const activeGatewaysCount = hubs?.length || 0;
  const criticalSilos = silos ? silos.filter((s) => s.status === 'critical' || s.aflatoxin_risk === 'HIGH').length : 0;
  const openTransport = transport ? transport.filter((t) => t.status === 'open').length : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner with Real-Time Polling Status */}
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              MundaSense Agricultural Intelligence Hub
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Live national operations overview aggregating IoT edge telemetry, USSD smallholder registrations,
            decentralized commodity trading, and automated agronomy alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#152718] border border-[#234329] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">REAL-TIME · Tick #{tick}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-400">5s SQLite Sync</span>
          </div>

          <button
            onClick={refreshFarms}
            className="p-2 bg-[#152418] hover:bg-[#1f3724] text-emerald-400 border border-[#233f28] rounded-xl transition cursor-pointer"
            title="Refresh All Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Operations KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Farms */}
        <div
          onClick={() => setActiveTab('farms')}
          className="bg-[#111e15] border border-[#1e3623] hover:border-emerald-600 rounded-xl p-3.5 shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Farms Monitored</span>
            <Sprout className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight font-mono">{totalFarms}</div>
          <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 font-mono">
            <span>{activeGatewaysCount} LoRa Hubs</span>
          </div>
        </div>

        {/* Healthy Farms */}
        <div
          onClick={() => setActiveTab('farms')}
          className="bg-[#111e15] border border-[#1e3623] hover:border-emerald-600 rounded-xl p-3.5 shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Healthy Plots</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight font-mono">{healthyFarms}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5 font-mono">
            {totalFarms > 0 ? ((healthyFarms / totalFarms) * 100).toFixed(0) : 0}% optimal
          </div>
        </div>

        {/* Watch State */}
        <div
          onClick={() => setActiveTab('farms')}
          className="bg-[#111e15] border border-[#1e3623] hover:border-amber-600 rounded-xl p-3.5 shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Watch Warning</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 tracking-tight font-mono">{watchFarms}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5 font-mono">Moisture dip</div>
        </div>

        {/* Disease / Soil Alert */}
        <div
          onClick={() => setActiveTab('farms')}
          className="bg-[#111e15] border border-[#1e3623] hover:border-rose-600 rounded-xl p-3.5 shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Critical Alert</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 tracking-tight font-mono">{alertFarms}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5 font-mono">Action required</div>
        </div>

        {/* Mean Soil Moisture */}
        <div
          onClick={() => setActiveTab('sensors')}
          className="bg-[#111e15] border border-[#1e3623] hover:border-cyan-600 rounded-xl p-3.5 shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Avg Soil @30cm</span>
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight font-mono">{avgSoilMoisture}%</div>
          <div className="text-[10px] text-gray-400 mt-0.5 font-mono">Telemetry mean</div>
        </div>

        {/* Active Marketplace */}
        <div
          onClick={() => setActiveTab('marketplace')}
          className="bg-[#111e15] border border-[#1e3623] hover:border-emerald-600 rounded-xl p-3.5 shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Live Listings</span>
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight font-mono">{activeListingsCount}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5 font-mono">
            {(totalListingKg / 1000).toFixed(0)}t available
          </div>
        </div>

        {/* Advisories Pushed */}
        <div
          onClick={() => setActiveTab('advisories')}
          className="bg-[#111e15] border border-[#1e3623] hover:border-purple-600 rounded-xl p-3.5 shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Advisories</span>
            <BellRing className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 tracking-tight font-mono">
            {totalAdvisoriesCount}
          </div>
          <div className="text-[10px] text-purple-400/80 mt-0.5 font-mono">2G SMS dispatched</div>
        </div>
      </div>

      {/* Main Map Component with Live Spatial Overlay */}
      <FarmMap onScreenFarm={onScreenFarm} />

      {/* Quick Action Activity Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Marketplace Quick Peek */}
        <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                Live Commodity Board
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                {activeListingsCount} Lots Active
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-snug">
              Direct peer-to-peer trade with phone & email contacts on every listing.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('marketplace')}
            className="mt-3 w-full py-2 bg-[#152418] hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-bold border border-[#223d27] flex items-center justify-center gap-1 transition cursor-pointer"
          >
            Explore Marketplace
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Post-Harvest Silos Quick Peek */}
        <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Warehouse className="w-4 h-4 text-amber-400" />
                Grain Silos & Moisture
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  criticalSilos > 0
                    ? 'text-rose-400 bg-rose-950 border-rose-800'
                    : 'text-emerald-400 bg-emerald-950 border-emerald-800'
                }`}
              >
                {criticalSilos > 0 ? `${criticalSilos} Critical Alerts` : 'Optimal Storage'}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-snug">
              Aflatoxin warning triggers SMS broadcasts to farmers when grain moisture exceeds safe thresholds.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('storage')}
            className="mt-3 w-full py-2 bg-[#152418] hover:bg-amber-600 text-amber-300 hover:text-white rounded-xl text-xs font-bold border border-[#223d27] flex items-center justify-center gap-1 transition cursor-pointer"
          >
            Manage Storage Silos
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Transport Quick Peek */}
        <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-cyan-400" />
                Rural Freight Dispatch
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800">
                {openTransport} Open Loads
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-snug">
              Competitive bidding for backhaul trucks and farm-gate cargo collection.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('transport')}
            className="mt-3 w-full py-2 bg-[#152418] hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-xl text-xs font-bold border border-[#223d27] flex items-center justify-center gap-1 transition cursor-pointer"
          >
            Dispatch & Track Loads
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
