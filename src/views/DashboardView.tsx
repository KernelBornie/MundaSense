import React from 'react';
import { useApp } from '../context/AppContext';
import { FarmMap } from '../components/FarmMap';
import {
  Sprout,
  Radio,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Droplets,
  Activity,
  Warehouse,
  ShoppingBag,
  Truck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  onScreenFarm: (farmId: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab, onScreenFarm }) => {
  const { stats, advisories, cropReports } = useApp();

  return (
    <div className="space-y-6">
      {/* Top Operations KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Farms */}
        <div className="bg-[#111e15] border border-[#1e3623] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Farms Monitored</span>
            <Sprout className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">{stats.totalFarms}</div>
          <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 font-mono">
            <span>3 Agro Hubs</span>
          </div>
        </div>

        {/* Healthy Farms */}
        <div className="bg-[#111e15] border border-[#1e3623] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Healthy State</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">{stats.healthyFarms}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5 font-mono">
            {((stats.healthyFarms / stats.totalFarms) * 100).toFixed(0)}% optimal
          </div>
        </div>

        {/* Watch State */}
        <div className="bg-[#111e15] border border-[#1e3623] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Watch Warning</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 tracking-tight">{stats.watchFarms}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5 font-mono">
            Moisture &lt; 32%
          </div>
        </div>

        {/* Alert State */}
        <div className="bg-[#111e15] border border-[#1e3623] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Critical Alert</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 tracking-tight">{stats.alertFarms}</div>
          <div className="text-[10px] text-rose-400/80 mt-0.5 font-mono">
            Urgent Action
          </div>
        </div>

        {/* Soil Moisture Avg */}
        <div className="bg-[#111e15] border border-[#1e3623] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Avg Soil Moisture</span>
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 tracking-tight font-mono">
            {stats.avgSoilMoisture}%
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
            30cm Root Zone
          </div>
        </div>

        {/* Disease Risk Overview */}
        <div className="bg-[#111e15] border border-[#1e3623] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Disease Pressure</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 tracking-tight font-mono">
            {stats.diseaseRiskOverview}
          </div>
          <div className="text-[10px] text-amber-500/80 mt-0.5 font-mono">
            Foliar Blight Risk
          </div>
        </div>

        {/* Storage Silo Alerts */}
        <div className="bg-[#111e15] border border-[#1e3623] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Silo Moisture Alert</span>
            <Warehouse className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 tracking-tight font-mono">
            {stats.storageAlerts}
          </div>
          <div className="text-[10px] text-rose-400/80 mt-0.5 font-mono">
            &gt; 13% Aflatoxin
          </div>
        </div>
      </div>

      {/* Main Interactive GIS Map */}
      <FarmMap onScreenFarm={onScreenFarm} />

      {/* Activity & Quick Feeds Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Recent AI Screenings & Disease Alerts */}
        <div className="bg-[#111e15] border border-[#1e3623] rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1b3120]">
            <h3 className="font-bold text-sm text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Recent AI-Assisted Screenings</span>
            </h3>
            <button
              onClick={() => setActiveTab('disease')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 text-[11px]"
            >
              <span>Screen Leaf</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {cropReports.slice(0, 4).map((report) => (
              <div
                key={report.id}
                className="p-2.5 rounded-xl bg-[#142318] border border-[#233c29] flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{report.predicted_disease}</span>
                    <span
                      className={`text-[9.5px] px-2 py-0.5 rounded font-bold font-mono ${
                        report.risk_level === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : report.risk_level === 'WATCH'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {report.risk_level}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {report.farm_name || `Plot #${report.farm_id}`} · {report.crop} ·{' '}
                    <span className="text-emerald-400 font-mono">
                      {Math.round(report.confidence * 100)}% confidence
                    </span>
                  </p>
                </div>
                {report.needs_expert_review && (
                  <span className="text-[10px] text-rose-400 border border-rose-800 bg-rose-950/60 px-2 py-1 rounded font-semibold whitespace-nowrap">
                    Officer Escalation
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Outbound Farmer Advisories */}
        <div className="bg-[#111e15] border border-[#1e3623] rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1b3120]">
            <h3 className="font-bold text-sm text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Multi-Lingual Advisory Feed</span>
            </h3>
            <button
              onClick={() => setActiveTab('advisories')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 text-[11px]"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {advisories.slice(0, 4).map((advisory) => (
              <div
                key={advisory.id}
                className="p-2.5 rounded-xl bg-[#142318] border border-[#233c29] space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-300 font-mono">
                    {advisory.farm_name} ({advisory.village})
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span className="bg-[#1a2d1e] px-1.5 py-0.5 rounded text-gray-300">
                      {advisory.channel}
                    </span>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      {advisory.category}
                    </span>
                    <span>{advisory.language}</span>
                  </div>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  {advisory.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
