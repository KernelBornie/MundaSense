import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Radio,
  Droplets,
  Thermometer,
  CloudRain,
  Wind,
  BatteryCharging,
  SunMedium,
  Signal,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface SensorsViewProps {
  onOpenSensorModal: () => void;
}

export const SensorsView: React.FC<SensorsViewProps> = ({ onOpenSensorModal }) => {
  const { hubs, hubReadings } = useApp();
  const [selectedHubId, setSelectedHubId] = useState<number>(1);

  const activeHub = hubs.find((h) => h.id === selectedHubId) || hubs[0];
  const readings = hubReadings[selectedHubId] || [];
  const latestReading = readings[readings.length - 1] || {
    soil_moisture_15cm: 24.5,
    soil_moisture_30cm: 28.0,
    soil_moisture_60cm: 32.0,
    temperature: 27.4,
    humidity: 78.2,
    rainfall: 0,
    recorded_at: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Hub Selector */}
      <div className="bg-[#111e15] border border-[#1e3623] rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base font-bold text-white tracking-tight">
              ESP32 + LoRaWAN Community Sensor Hubs
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Solar-powered gateway hubs serving an 8.5 km radius with multi-depth capacitive probes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Hub Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-[#142318] border border-[#233a27] rounded-xl text-xs">
            {hubs.map((hub) => (
              <button
                key={hub.id}
                onClick={() => setSelectedHubId(hub.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  selectedHubId === hub.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {hub.name.split(' ')[0]} ({hub.province})
              </button>
            ))}
          </div>

          <button
            onClick={onOpenSensorModal}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-950 transition"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Simulate Packet</span>
          </button>
        </div>
      </div>

      {/* Hub Diagnostic Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-[#101b13] border border-[#1d3321] rounded-xl p-3">
          <span className="text-[10px] text-gray-400 block">Hub Identifier</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {activeHub.hub_code}
          </span>
        </div>

        <div className="bg-[#101b13] border border-[#1d3321] rounded-xl p-3">
          <span className="text-[10px] text-gray-400 block">Coverage Radius</span>
          <span className="font-mono font-bold text-white text-sm">
            {activeHub.coverage_radius_km} km (LoRa)
          </span>
        </div>

        <div className="bg-[#101b13] border border-[#1d3321] rounded-xl p-3">
          <span className="text-[10px] text-gray-400 block">Attached Farms</span>
          <span className="font-mono font-bold text-white text-sm">
            {activeHub.farms_count ?? (activeHub.id === 1 ? 40 : activeHub.id === 2 ? 35 : 33)} smallholders
          </span>
        </div>

        <div className="bg-[#101b13] border border-[#1d3321] rounded-xl p-3">
          <span className="text-[10px] text-gray-400 block flex items-center gap-1">
            <BatteryCharging className="w-3 h-3 text-emerald-400" /> Battery
          </span>
          <span className="font-mono font-bold text-emerald-300 text-sm">
            {(activeHub.battery_voltage ?? activeHub.battery).toFixed(2)}V (LiFePO4)
          </span>
        </div>

        <div className="bg-[#101b13] border border-[#1d3321] rounded-xl p-3">
          <span className="text-[10px] text-gray-400 block flex items-center gap-1">
            <SunMedium className="w-3 h-3 text-amber-400" /> Solar Input
          </span>
          <span className="font-mono font-bold text-amber-300 text-sm">
            {(activeHub.solar_input_voltage ?? activeHub.solar_v).toFixed(1)}V (Active)
          </span>
        </div>

        <div className="bg-[#101b13] border border-[#1d3321] rounded-xl p-3">
          <span className="text-[10px] text-gray-400 block flex items-center gap-1">
            <Signal className="w-3 h-3 text-emerald-400" /> GSM Cellular
          </span>
          <span className="font-mono font-bold text-emerald-300 text-sm">
            {activeHub.gsm_signal_dbm ?? activeHub.signal_dbm} dBm (MTN)
          </span>
        </div>
      </div>

      {/* Main Telemetry Visualizer: 3-Depth Probes + Environmental Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 3-Depth Capacitive Probe Visualizer */}
        <div className="lg:col-span-5 bg-[#101b13] border border-[#1e3523] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1c3220] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span>3-Depth Capacitive Soil Profile</span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Stratified volumetric water content (VWC %)
              </p>
            </div>
            <span className="text-[10px] font-mono bg-[#16291a] text-emerald-300 px-2 py-0.5 rounded border border-[#23422a]">
              CORROSION-RESISTANT
            </span>
          </div>

          {/* Graphical Soil Cross-Section Diagram */}
          <div className="space-y-4 bg-[#0a120c] p-4 rounded-xl border border-[#192b1c]">
            {/* 15cm Surface Layer */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-semibold">
                  15 cm Depth (Evaporative Surface)
                </span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {latestReading.soil_moisture_15cm}%
                </span>
              </div>
              <div className="w-full bg-[#162719] h-3 rounded-full overflow-hidden border border-[#233f28]">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, latestReading.soil_moisture_15cm)}%` }}
                />
              </div>
              <span className="text-[10.5px] text-gray-500">
                Responds quickly to daily solar evaporation and light drizzle.
              </span>
            </div>

            {/* 30cm Root Zone Layer (Primary Metric) */}
            <div className="space-y-1 p-3 bg-[#132216] rounded-lg border border-[#223d27]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  30 cm Depth (Critical Root Zone)
                </span>
                <span className="font-mono font-extrabold text-emerald-300 text-base">
                  {latestReading.soil_moisture_30cm}%
                </span>
              </div>
              <div className="w-full bg-[#1b3120] h-4 rounded-full overflow-hidden border border-[#26442b]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    latestReading.soil_moisture_30cm < 22
                      ? 'bg-rose-500'
                      : latestReading.soil_moisture_30cm < 32
                      ? 'bg-amber-500'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, latestReading.soil_moisture_30cm)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10.5px] text-gray-400 pt-0.5">
                <span>Field Capacity: 35%</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {latestReading.soil_moisture_30cm < 22
                    ? 'WILTING POINT'
                    : latestReading.soil_moisture_30cm < 32
                    ? 'WATCH (LOW)'
                    : 'OPTIMAL AVAILABLE WATER'}
                </span>
              </div>
            </div>

            {/* 60cm Subsoil Layer */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-semibold">
                  60 cm Depth (Deep Water Table Reserve)
                </span>
                <span className="font-mono font-bold text-blue-400 text-sm">
                  {latestReading.soil_moisture_60cm}%
                </span>
              </div>
              <div className="w-full bg-[#162719] h-3 rounded-full overflow-hidden border border-[#233f28]">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, latestReading.soil_moisture_60cm)}%` }}
                />
              </div>
              <span className="text-[10.5px] text-gray-500">
                Moisture reservoir buffer protecting perennial roots during short dry spells.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Environmental Weather Telemetry & 24h Trend */}
        <div className="lg:col-span-7 bg-[#101b13] border border-[#1e3523] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1c3220] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                24-Hour Environmental Telemetry Trend
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                DHT22 Ambient Weather + Tipping Bucket Rain Gauge
              </p>
            </div>
            <span className="text-[10px] font-mono text-gray-400">
              Updated: {new Date(latestReading.recorded_at).toLocaleTimeString()}
            </span>
          </div>

          {/* Atmospheric Telemetry Cards */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#132216] rounded-xl border border-[#223d27]">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span>Temperature</span>
                <Thermometer className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-black text-white font-mono">
                {latestReading.temperature}°C
              </div>
              <span className="text-[10px] text-gray-400">Ambient Air</span>
            </div>

            <div className="p-3 bg-[#132216] rounded-xl border border-[#223d27]">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span>Relative Humidity</span>
                <Wind className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-emerald-400 font-mono">
                {latestReading.humidity}%
              </div>
              <span className="text-[10px] text-amber-400/90 font-semibold">
                {latestReading.humidity > 75 ? 'HIGH FUNGAL RISK' : 'NORMAL'}
              </span>
            </div>

            <div className="p-3 bg-[#132216] rounded-xl border border-[#223d27]">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span>Rainfall (24h)</span>
                <CloudRain className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-black text-blue-400 font-mono">
                {latestReading.rainfall} mm
              </div>
              <span className="text-[10px] text-gray-400">Tipping Gauge</span>
            </div>
          </div>

          {/* 24-Hour Sparkline Curve Chart (SVG) */}
          <div className="bg-[#0a120c] p-4 rounded-xl border border-[#192b1c] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span className="font-mono font-semibold text-gray-300">
                24-Hour Moisture &amp; Humidity Dynamics
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-0.5 bg-emerald-400 inline-block" /> Soil 30cm
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="w-2 h-0.5 bg-blue-400 inline-block" /> Humidity
                </span>
              </div>
            </div>

            {/* SVG Wave chart */}
            <div className="h-32 w-full">
              <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="soilGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                <line x1="0" y1="30" x2="400" y2="30" stroke="#162719" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="0" y1="60" x2="400" y2="60" stroke="#162719" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="0" y1="90" x2="400" y2="90" stroke="#162719" strokeWidth="1" strokeDasharray="3,3" />

                {/* Humidity path (blue) */}
                <path
                  d={readings
                    .map((r, i) => {
                      const x = (i / Math.max(1, readings.length - 1)) * 390 + 5;
                      const y = 110 - (r.humidity / 100) * 90;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="1.5"
                />

                {/* Soil 30cm path (emerald) */}
                <path
                  d={readings
                    .map((r, i) => {
                      const x = (i / Math.max(1, readings.length - 1)) * 390 + 5;
                      const y = 110 - (r.soil_moisture_30cm / 60) * 90;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.5"
                />

                {/* Dot at latest point */}
                {readings.length > 0 && (
                  <circle
                    cx="395"
                    cy={110 - (latestReading.soil_moisture_30cm / 60) * 90}
                    r="4"
                    fill="#34d399"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
              </svg>
            </div>

            <div className="flex justify-between text-[10px] text-gray-500 font-mono pt-1">
              <span>24h Ago</span>
              <span>18h Ago</span>
              <span>12h Ago</span>
              <span>6h Ago</span>
              <span>Now (Live)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
