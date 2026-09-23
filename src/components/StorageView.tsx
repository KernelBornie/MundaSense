import React, { useState } from 'react';
import { usePolling } from '../hooks/usePolling';
import {
  Warehouse,
  AlertTriangle,
  Send,
  Droplet,
  Thermometer,
  Wind,
  CheckCircle2,
  RefreshCw,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

interface Silo {
  id: number;
  name: string;
  crop: string;
  capacity_tons: number;
  current_fill_tons: number;
  moisture_percent: number;
  temp_c: number;
  co2_ppm: number;
  status: 'optimal' | 'warning' | 'critical';
  aflatoxin_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  last_inspected?: string;
}

export function StorageView() {
  const { data: silos, loading, refresh, tick } = usePolling<Silo[]>('/api/storage/silos', 5000);
  const [broadcastingId, setBroadcastingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleBroadcastAlert = async (id: number, siloName: string) => {
    setBroadcastingId(id);
    try {
      const res = await fetch(`/api/storage/silos/${id}/broadcast-alert`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setToast(`Alert broadcast successfully to ${data.pushed} farmers regarding ${siloName}`);
      setTimeout(() => setToast(null), 5000);
      refresh();
    } catch (err: any) {
      alert(`Broadcast failed: ${err.message}`);
    } finally {
      setBroadcastingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-emerald-400 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                <Warehouse className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Grain Storage & Aflatoxin Early Warning
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Monitoring regional grain aggregation facilities and community storage silos. Early detection of moisture
              spikes prevents aflatoxin and post-harvest grain degradation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#152718] border border-[#234329] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold">LIVE · Tick #{tick}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400">{silos?.length || 0} Silos</span>
            </div>

            <button
              onClick={refresh}
              className="p-2 bg-[#152418] hover:bg-[#1f3724] text-emerald-400 border border-[#233f28] rounded-xl transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Storage Units Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(silos || []).map((silo) => {
          const fillPct = Math.round((silo.current_fill_tons / (silo.capacity_tons || 1)) * 100);
          const isCritical = silo.status === 'critical' || silo.aflatoxin_risk === 'HIGH';
          const isWarning = silo.status === 'warning' || silo.aflatoxin_risk === 'MEDIUM';

          return (
            <div
              key={silo.id}
              className={`bg-[#101b13] border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition ${
                isCritical
                  ? 'border-rose-800/80 shadow-rose-950/20'
                  : isWarning
                  ? 'border-amber-800/80 shadow-amber-950/20'
                  : 'border-[#1e3623]'
              }`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white">{silo.name}</h3>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">
                      Commodity: <strong className="text-emerald-400">{silo.crop}</strong>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                      isCritical
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : isWarning
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}
                  >
                    {silo.status}
                  </span>
                </div>

                {/* Fill Capacity Bar */}
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-gray-300">
                    <span>Fill Level ({fillPct}%):</span>
                    <span className="font-bold text-white">
                      {silo.current_fill_tons} / {silo.capacity_tons} tons
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#182a1c] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        fillPct > 90 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, fillPct)}%` }}
                    />
                  </div>
                </div>

                {/* Sensor Readings (Moisture, Temp, CO2) */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#142317] border border-[#223e28] text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase flex items-center gap-1">
                      <Droplet className="w-3 h-3 text-cyan-400" />
                      Moisture
                    </div>
                    <div
                      className={`font-bold mt-0.5 text-sm ${
                        silo.moisture_percent > 13.5 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {silo.moisture_percent}%
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-gray-400 uppercase flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-amber-400" />
                      Temp
                    </div>
                    <div className="font-bold mt-0.5 text-sm text-amber-300">
                      {silo.temp_c}°C
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-gray-400 uppercase flex items-center gap-1">
                      <Wind className="w-3 h-3 text-gray-400" />
                      CO2
                    </div>
                    <div
                      className={`font-bold mt-0.5 text-sm ${
                        silo.co2_ppm > 800 ? 'text-rose-400' : 'text-gray-300'
                      }`}
                    >
                      {silo.co2_ppm} ppm
                    </div>
                  </div>
                </div>

                {/* Aflatoxin Risk Indicator */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0e1710] border border-[#1a2d1f] text-xs font-mono">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    Aflatoxin Risk:
                  </span>
                  <span
                    className={`font-bold ${
                      silo.aflatoxin_risk === 'HIGH'
                        ? 'text-rose-400'
                        : silo.aflatoxin_risk === 'MEDIUM'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {silo.aflatoxin_risk}
                  </span>
                </div>
              </div>

              {/* Broadcast Alert Action */}
              <div className="mt-4 pt-3 border-t border-[#1a2d1f]">
                <button
                  onClick={() => handleBroadcastAlert(silo.id, silo.name)}
                  disabled={broadcastingId === silo.id}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer ${
                    isCritical
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                      : 'bg-[#182c1b] hover:bg-emerald-600 text-emerald-300 hover:text-white border border-[#2b4d30]'
                  }`}
                >
                  {broadcastingId === silo.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Dispatching SMS Broadcast…
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Broadcast Drying Advisory SMS
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
