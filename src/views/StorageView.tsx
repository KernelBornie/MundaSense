import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Warehouse,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Thermometer,
  Wind,
  Droplets,
  Sun,
  ShieldCheck,
} from 'lucide-react';

export const StorageView: React.FC = () => {
  const { storageUnits, sendInboundSMS } = useApp();

  const handleBroadcastSiloAlert = (siloName: string, moisture: number) => {
    sendInboundSMS(
      '+260970000002',
      `STORAGE ALERT for ${siloName}: Grain moisture is ${moisture}%. Safe storage maximum is 13.0%. Sun-dry bags today to prevent Aspergillus flavus aflatoxin contamination.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111e15] border border-[#1e3623] rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Hermetic Silo &amp; Aflatoxin Telemetry
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time grain moisture and temperature monitoring to eliminate post-harvest losses
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-gray-400">Safe Maize Moisture Threshold:</span>
          <span className="px-2.5 py-1 rounded-lg bg-[#152719] border border-emerald-700 text-emerald-300 font-bold">
            &le; 13.0% VWC
          </span>
        </div>
      </div>

      {/* Silo Units Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
        {storageUnits.map((silo) => {
          const isCritical = silo.status === 'critical';
          const isWatch = silo.status === 'watch';

          return (
            <div
              key={silo.id}
              className={`border-2 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition ${
                isCritical
                  ? 'bg-[#181113] border-rose-600/80 shadow-rose-950/30'
                  : isWatch
                  ? 'bg-[#171510] border-amber-600/70 shadow-amber-950/20'
                  : 'bg-[#101b13] border-[#1e3623]'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-[#233526]">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {silo.name}
                    </h3>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {silo.location} · {silo.crop} ({(silo.capacity_bags ?? silo.capacity).toLocaleString()} bags)
                    </p>
                  </div>
                  <span
                    className={`text-[9.5px] px-2.5 py-0.5 rounded font-mono font-bold uppercase ${
                      isCritical
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : isWatch
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {silo.status}
                  </span>
                </div>

                {/* Primary Metric: Grain Moisture */}
                <div className="my-4 p-4 rounded-xl bg-[#0e1710] border border-[#1c2e20] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-bold flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-blue-400" />
                      Internal Grain Moisture
                    </span>
                    <span
                      className={`text-2xl font-black font-mono ${
                        isCritical ? 'text-rose-400' : isWatch ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {silo.moisture_percent ?? silo.grain_moisture}%
                    </span>
                  </div>

                  <div className="w-full bg-[#18281a] h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCritical ? 'bg-rose-500' : isWatch ? 'bg-amber-500' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, ((silo.moisture_percent ?? silo.grain_moisture) / 20) * 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10.5px] text-gray-400 font-mono pt-1">
                    <span>Safe: &lt; 13%</span>
                    <span className={isCritical ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {isCritical ? '+1.3% OVER THRESHOLD' : 'OPTIMAL'}
                    </span>
                  </div>
                </div>

                {/* Ambient Sensor readings */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-[#142318] rounded-xl border border-[#223d27]">
                    <span className="text-[10px] text-gray-400 block flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-amber-400" /> Internal Temp
                    </span>
                    <span className="text-base font-black text-white font-mono">
                      {silo.temperature_c ?? silo.temperature}°C
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#142318] rounded-xl border border-[#223d27]">
                    <span className="text-[10px] text-gray-400 block flex items-center gap-1">
                      <Wind className="w-3 h-3 text-emerald-400" /> Headspace RH
                    </span>
                    <span className="text-base font-black text-emerald-300 font-mono">
                      {silo.humidity_percent ?? silo.air_humidity}%
                    </span>
                  </div>
                </div>

                {/* Aflatoxin Risk Status */}
                <div className="mt-3 p-3 rounded-xl bg-[#142318] border border-[#223d27] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-gray-400">Aflatoxin Hazard Index:</span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase ${
                        (silo.aflatoxin_risk ?? (isCritical ? 'HIGH' : isWatch ? 'WATCH' : 'LOW')) === 'HIGH'
                          ? 'text-rose-400'
                          : (silo.aflatoxin_risk ?? (isCritical ? 'HIGH' : isWatch ? 'WATCH' : 'LOW')) === 'WATCH'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {silo.aflatoxin_risk ?? (isCritical ? 'HIGH' : isWatch ? 'WATCH' : 'LOW')} RISK
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    {isCritical
                      ? 'WARNING: Grain moisture exceeds 13.0%. High risk of Aspergillus mold development and aflatoxin contamination. Sun-drying or aeration required immediately.'
                      : isWatch
                      ? 'Monitor moisture level closely. Keep hermetic bag seals airtight.'
                      : 'Hermetic barrier intact. Grain moisture is safe for long-term storage.'}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-[#1e3421]">
                {isCritical ? (
                  <button
                    onClick={() => handleBroadcastSiloAlert(silo.name, silo.moisture_percent ?? silo.grain_moisture)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950 transition active:scale-95"
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Broadcast Sun-Drying Alert</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1 text-emerald-400 font-mono text-[11px] py-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Hermetically Protected</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
