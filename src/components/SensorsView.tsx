import React, { useState, useEffect } from 'react';
import { usePolling } from '../hooks/usePolling';
import {
  Cpu,
  Battery,
  Sun,
  Signal,
  Clock,
  Droplet,
  Thermometer,
  CloudRain,
  MapPin,
  RefreshCw,
  X,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface Hub {
  id: number;
  hub_code: string;
  name: string;
  province: string;
  district: string;
  latitude: number;
  longitude: number;
  coverage_radius_km: number;
  battery_voltage?: number;
  battery?: number;
  solar_v?: number;
  solar_input_voltage?: number;
  signal_dbm?: number;
  gsm_signal_dbm?: number;
  uptime_h?: number;
  last_seen: string;
}

interface Reading {
  id: number;
  hub_id: number;
  soil_moisture_15cm: number;
  soil_moisture_30cm: number;
  soil_moisture_60cm: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  recorded_at: string;
}

interface HubDetail {
  hub: Hub;
  latest: Reading | null;
  history: Reading[];
}

export function SensorsView() {
  const { data: hubs, loading, refresh, tick } = usePolling<Hub[]>('/api/sensors/hubs', 5000);
  const [selectedHubId, setSelectedHubId] = useState<number | null>(null);
  const [hubDetail, setHubDetail] = useState<HubDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!selectedHubId) {
      setHubDetail(null);
      return;
    }
    setLoadingDetail(true);
    fetch(`/api/sensors/hubs/${selectedHubId}`)
      .then((r) => r.json())
      .then((d) => setHubDetail(d))
      .catch((e) => console.error(e))
      .finally(() => setLoadingDetail(false));
  }, [selectedHubId]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                <Cpu className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Solar LoRaWAN & GSM Sensor Gateways
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Autonomous solar-powered base stations aggregating telemetry from multi-depth SDI-12 soil moisture
              probes and Davis micro-weather stations across agricultural clusters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#152718] border border-[#234329] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold">LIVE · Tick #{tick}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400">{hubs?.length || 0} Gateways</span>
            </div>

            <button
              onClick={refresh}
              className="p-2 bg-[#152418] hover:bg-[#1f3724] text-emerald-400 border border-[#233f28] rounded-xl transition cursor-pointer"
              title="Refresh hubs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Hubs Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(hubs || []).map((hub) => {
          const batt = hub.battery_voltage ?? hub.battery ?? 4.1;
          const battPct = Math.min(100, Math.max(0, Math.round(((batt - 3.4) / (4.2 - 3.4)) * 100)));
          const solar = hub.solar_input_voltage ?? hub.solar_v ?? 5.8;
          const gsm = hub.gsm_signal_dbm ?? hub.signal_dbm ?? -78;

          return (
            <div
              key={hub.id}
              onClick={() => setSelectedHubId(hub.id)}
              className="bg-[#101b13] border border-[#1e3623] hover:border-emerald-600/70 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                        {hub.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#142618] border border-emerald-800 text-emerald-300">
                        {hub.hub_code}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      <span>{hub.district || hub.province}, {hub.province}</span>
                    </div>
                  </div>

                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                </div>

                {/* Telemetry Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#142317] border border-[#223e28] text-xs font-mono">
                  {/* Battery */}
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase flex items-center gap-1">
                      <Battery className="w-3 h-3 text-emerald-400" />
                      Batt
                    </div>
                    <div className="font-bold text-white mt-0.5">
                      {batt.toFixed(2)}V
                      <span className="text-[10px] text-emerald-400 ml-1">({battPct}%)</span>
                    </div>
                  </div>

                  {/* Solar */}
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-400" />
                      Solar
                    </div>
                    <div className="font-bold text-amber-300 mt-0.5">
                      {solar.toFixed(1)}V
                    </div>
                  </div>

                  {/* GSM Signal */}
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase flex items-center gap-1">
                      <Signal className="w-3 h-3 text-cyan-400" />
                      Signal
                    </div>
                    <div className="font-bold text-cyan-300 mt-0.5">
                      {gsm} dBm
                    </div>
                  </div>
                </div>

                {/* Uptime and Last Seen */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono pt-1">
                  <span>Coverage: ~{hub.coverage_radius_km || 15} km</span>
                  <span className="text-gray-500">
                    Seen: {new Date(hub.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1a2d1f] flex items-center justify-between text-xs text-emerald-400 group-hover:text-emerald-300 font-semibold">
                <span>View Multi-Depth Readings</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Hub Detail & 48-reading Telemetry Modal */}
      {selectedHubId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1e3623] flex items-center justify-between bg-[#142317]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {hubDetail?.hub.name || `Hub #${selectedHubId}`}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {hubDetail?.hub.hub_code}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Location: {hubDetail?.hub.province} · Radius {hubDetail?.hub.coverage_radius_km || 15}km · 48-Hour Historical Series
                </p>
              </div>

              <button
                onClick={() => setSelectedHubId(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2d1f] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5">
              {loadingDetail ? (
                <div className="py-12 text-center text-gray-400 font-mono text-xs">
                  Loading telemetry payload from hub…
                </div>
              ) : hubDetail ? (
                <>
                  {/* Latest Telemetry Quick Cards */}
                  {hubDetail.latest && (
                    <div>
                      <div className="text-[10px] font-mono uppercase text-gray-400 mb-2 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        Most Recent Telemetry Observation ({new Date(hubDetail.latest.recorded_at).toLocaleTimeString()})
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                        <div className="p-3 rounded-xl bg-[#142317] border border-[#223e28] text-center">
                          <div className="text-[10px] text-gray-400 font-mono">Soil @15cm</div>
                          <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                            {hubDetail.latest.soil_moisture_15cm}%
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-[#142317] border border-[#223e28] text-center">
                          <div className="text-[10px] text-gray-400 font-mono">Soil @30cm</div>
                          <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                            {hubDetail.latest.soil_moisture_30cm}%
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-[#142317] border border-[#223e28] text-center">
                          <div className="text-[10px] text-gray-400 font-mono">Soil @60cm</div>
                          <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                            {hubDetail.latest.soil_moisture_60cm}%
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-[#142317] border border-[#223e28] text-center">
                          <div className="text-[10px] text-gray-400 font-mono">Air Temp</div>
                          <div className="text-base font-bold font-mono text-amber-300 mt-0.5">
                            {hubDetail.latest.temperature}°C
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-[#142317] border border-[#223e28] text-center">
                          <div className="text-[10px] text-gray-400 font-mono">Air Humidity</div>
                          <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                            {hubDetail.latest.humidity}%
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-[#142317] border border-[#223e28] text-center">
                          <div className="text-[10px] text-gray-400 font-mono">Rainfall (24h)</div>
                          <div className="text-base font-bold font-mono text-blue-400 mt-0.5">
                            {hubDetail.latest.rainfall} mm
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 48-Hour Historical Readings Table */}
                  <div>
                    <div className="text-[10px] font-mono uppercase text-gray-400 mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      48-Observation Historical Time Series (30-min Intervals)
                    </div>
                    <div className="border border-[#1e3623] rounded-xl overflow-hidden">
                      <div className="max-h-72 overflow-y-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-[#142317] text-gray-400 uppercase text-[10px] sticky top-0 border-b border-[#1e3623]">
                            <tr>
                              <th className="py-2.5 px-3">Timestamp</th>
                              <th className="py-2.5 px-3">Moist 15cm</th>
                              <th className="py-2.5 px-3">Moist 30cm</th>
                              <th className="py-2.5 px-3">Moist 60cm</th>
                              <th className="py-2.5 px-3">Temp (°C)</th>
                              <th className="py-2.5 px-3">Humidity (%)</th>
                              <th className="py-2.5 px-3">Rain (mm)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#18291c] text-gray-200">
                            {hubDetail.history.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-4 text-center text-gray-500">
                                  No historical telemetry records logged yet.
                                </td>
                              </tr>
                            ) : (
                              hubDetail.history.map((r) => (
                                <tr key={r.id} className="hover:bg-[#152418]">
                                  <td className="py-2 px-3 text-gray-400">
                                    {new Date(r.recorded_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </td>
                                  <td className="py-2 px-3 text-emerald-400 font-bold">{r.soil_moisture_15cm}%</td>
                                  <td className="py-2 px-3 text-emerald-400 font-bold">{r.soil_moisture_30cm}%</td>
                                  <td className="py-2 px-3 text-emerald-400 font-bold">{r.soil_moisture_60cm}%</td>
                                  <td className="py-2 px-3 text-amber-300">{r.temperature}°C</td>
                                  <td className="py-2 px-3 text-cyan-300">{r.humidity}%</td>
                                  <td className="py-2 px-3 text-blue-400">{r.rainfall} mm</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
