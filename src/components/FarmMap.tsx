import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Farm, Province, HealthStatus } from '../types';
import {
  MapPin,
  Radio,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Droplets,
  Layers,
  Send,
  Camera,
  X,
} from 'lucide-react';

interface FarmMapProps {
  onScreenFarm?: (farmId: number) => void;
}

export const FarmMap: React.FC<FarmMapProps> = ({ onScreenFarm }) => {
  const {
    farms,
    hubs,
    selectedFarm,
    setSelectedFarm,
    activeProvinceFilter,
    setActiveProvinceFilter,
    activeCropFilter,
    setActiveCropFilter,
    activeStatusFilter,
    setActiveStatusFilter,
    sendInboundSMS,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCluster, setActiveCluster] = useState<Province | 'all'>('all');
  const [quickSmsText, setQuickSmsText] = useState('Inspect lower leaves after rain.');

  // Filtering
  const filteredFarms = useMemo(() => {
    return farms.filter((farm) => {
      if (activeCluster !== 'all' && farm.province !== activeCluster) return false;
      if (activeProvinceFilter !== 'all' && farm.province !== activeProvinceFilter) return false;
      if (activeCropFilter !== 'all' && farm.crop !== activeCropFilter) return false;
      if (activeStatusFilter !== 'all' && farm.health_status !== activeStatusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          farm.name.toLowerCase().includes(q) ||
          farm.village.toLowerCase().includes(q) ||
          farm.ziamis_id.toLowerCase().includes(q) ||
          farm.crop.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [farms, activeCluster, activeProvinceFilter, activeCropFilter, activeStatusFilter, searchQuery]);

  // View bounds for map viewport coordinates
  // Zambia coordinates roughly: Lat -18 to -8, Lon 22 to 34
  // We normalize to SVG viewport (800 x 540)
  const mapProjection = (lat: number, lon: number) => {
    // Map bounding box: Lat -17.5 to -12.5, Lon 27.5 to 33.5
    const minLat = -16.5;
    const maxLat = -12.5;
    const minLon = 27.5;
    const maxLon = 33.8;

    const x = ((lon - minLon) / (maxLon - minLon)) * 740 + 30;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 460 + 40;
    return { x, y };
  };

  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return '#22c55e'; // Green
      case 'watch':
        return '#f59e0b'; // Amber
      case 'alert':
        return '#ef4444'; // Red
      default:
        return '#94a3b8';
    }
  };

  return (
    <div className="bg-[#101b13] border border-[#1f3523] rounded-2xl overflow-hidden shadow-xl">
      {/* Map Controls Header */}
      <div className="p-4 border-b border-[#1f3523] flex flex-wrap items-center justify-between gap-3 bg-[#0d1710]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Zambia Agri-IoT GIS Coverage Map
            </h2>
            <p className="text-[11px] text-gray-400">
              Real-time monitoring across 108 smallholder plots · 3 LoRaWAN Community Hubs
            </p>
          </div>
        </div>

        {/* Quick Cluster Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[#142318] border border-[#233a27] rounded-lg text-xs">
          {(['all', 'Eastern', 'Lusaka', 'Central'] as const).map((cluster) => (
            <button
              key={cluster}
              onClick={() => {
                setActiveCluster(cluster);
                setActiveProvinceFilter(cluster);
              }}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                activeCluster === cluster
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {cluster === 'all' ? 'All Clusters (108)' : `${cluster} Hub`}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-[#0f1911] border-b border-[#1b2e1f] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search farmer, village, ZIAMIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#142217] border border-[#233827] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={activeStatusFilter}
            onChange={(e) => setActiveStatusFilter(e.target.value)}
            className="bg-[#142217] text-gray-300 border border-[#233827] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Health (108)</option>
            <option value="healthy">Healthy Only (82)</option>
            <option value="watch">Watch Only (18)</option>
            <option value="alert">Alert Only (8)</option>
          </select>

          {/* Crop Filter */}
          <select
            value={activeCropFilter}
            onChange={(e) => setActiveCropFilter(e.target.value)}
            className="bg-[#142217] text-gray-300 border border-[#233827] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Crops</option>
            <option value="Maize">Maize</option>
            <option value="Groundnuts">Groundnuts</option>
            <option value="Soybeans">Soybeans</option>
            <option value="Sunflower">Sunflower</option>
            <option value="Cotton">Cotton</option>
          </select>

          {/* Map Legend */}
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-[#1f3523] text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Healthy (82)
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Watch (18)
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Alert (8)
            </span>
            <span className="flex items-center gap-1 text-red-300 font-medium">
              <Radio className="w-3.5 h-3.5 text-rose-500" /> LoRaWAN Hub
            </span>
          </div>
        </div>
      </div>

      {/* Main Map View & Slide-out Inspector */}
      <div className="relative w-full h-[520px] bg-[#0a120c] overflow-hidden flex">
        {/* Interactive SVG GIS Map */}
        <div className="flex-1 h-full relative cursor-crosshair">
          <svg
            viewBox="0 0 800 540"
            className="w-full h-full select-none"
            style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}
          >
            {/* Dark GIS grid lines */}
            <defs>
              <pattern id="gisGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#142418" strokeWidth="0.8" />
              </pattern>
              <radialGradient id="hubRadarGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                <stop offset="70%" stopColor="#ef4444" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
              </radialGradient>
            </defs>

            <rect width="800" height="540" fill="url(#gisGrid)" />

            {/* Stylized Zambia Provinces Boundary Silhouettes */}
            <g opacity="0.3" stroke="#25422a" strokeWidth="1.2" fill="#0d1b10">
              {/* Eastern Province Cluster outline */}
              <path d="M 520 80 Q 720 120 740 280 T 560 380 Q 480 300 520 80 Z" />
              {/* Central Province Cluster outline */}
              <path d="M 210 100 Q 420 110 450 260 T 260 320 Q 180 200 210 100 Z" />
              {/* Lusaka Province Cluster outline */}
              <path d="M 120 280 Q 320 290 340 440 T 160 480 Q 90 380 120 280 Z" />
            </g>

            {/* Hub Coverage Radius Circles (8.5 km representation) */}
            {hubs.map((hub) => {
              const { x, y } = mapProjection(hub.latitude, hub.longitude);
              return (
                <g key={hub.id}>
                  {/* Radio coverage circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r="68"
                    fill="url(#hubRadarGrad)"
                    stroke="#ef4444"
                    strokeWidth="1.2"
                    strokeDasharray="4,4"
                    className="animate-pulse"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="40"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="0.8"
                    strokeOpacity="0.4"
                  />
                  {/* Hub Marker */}
                  <circle cx={x} cy={y} r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                  <circle cx={x} cy={y} r="3" fill="#ffffff" />
                  <text
                    x={x}
                    y={y - 14}
                    textAnchor="middle"
                    fill="#fca5a5"
                    fontSize="11"
                    fontWeight="bold"
                    filter="drop-shadow(0 1px 3px black)"
                  >
                    📡 {hub.name}
                  </text>
                  <text
                    x={x}
                    y={y + 24}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontFamily="monospace"
                  >
                    8.5km Radius · {hub.province}
                  </text>
                </g>
              );
            })}

            {/* Farm Markers (108 pins) */}
            {filteredFarms.map((farm) => {
              const { x, y } = mapProjection(farm.latitude, farm.longitude);
              const isSelected = selectedFarm?.id === farm.id;
              const color = getStatusColor(farm.health_status);

              return (
                <g
                  key={farm.id}
                  onClick={() => setSelectedFarm(farm)}
                  className="cursor-pointer transition-transform hover:scale-125"
                  style={{ transformOrigin: `${x}px ${y}px` }}
                >
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r="12"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="animate-ping opacity-75"
                    />
                  )}
                  {/* Farm marker dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? '6' : '4.5'}
                    fill={color}
                    stroke="#0a120c"
                    strokeWidth="1.2"
                  />
                  {isSelected && (
                    <text
                      x={x}
                      y={y - 9}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      filter="drop-shadow(0 1px 2px black)"
                    >
                      {farm.name.split(' ')[0]} ({farm.crop})
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating Map Stats Pill */}
          <div className="absolute bottom-3 left-3 bg-[#0d160f]/90 backdrop-blur border border-[#1f3524] rounded-xl px-3 py-2 text-[11px] text-gray-300 shadow-lg flex items-center gap-4 font-mono">
            <div>
              <span className="text-gray-500">DISPLAYED:</span>{' '}
              <span className="text-emerald-400 font-bold">{filteredFarms.length}</span> / 108 farms
            </div>
            <div>
              <span className="text-gray-500">GATEWAY:</span>{' '}
              <span className="text-emerald-400 font-bold">LoRaWAN EU868</span>
            </div>
          </div>
        </div>

        {/* Slide-out Farm Telemetry Inspector Drawer */}
        {selectedFarm && (
          <div className="w-80 md:w-96 bg-[#0f1a12] border-l border-[#1f3524] p-4 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right-4 duration-200">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-[#1a2d1f]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {selectedFarm.name}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        selectedFarm.health_status === 'healthy'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : selectedFarm.health_status === 'watch'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {selectedFarm.health_status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedFarm.village} · {selectedFarm.district} ({selectedFarm.province})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFarm(null)}
                  className="text-gray-400 hover:text-white p-1 rounded transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Farm Metadata Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-[#142318] rounded-lg border border-[#213826]">
                  <span className="text-[10px] text-gray-400 block">ZIAMIS ID</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {selectedFarm.ziamis_id}
                  </span>
                </div>
                <div className="p-2 bg-[#142318] rounded-lg border border-[#213826]">
                  <span className="text-[10px] text-gray-400 block">Phone</span>
                  <span className="font-mono font-semibold text-gray-200">
                    {selectedFarm.phone}
                  </span>
                </div>
                <div className="p-2 bg-[#142318] rounded-lg border border-[#213826]">
                  <span className="text-[10px] text-gray-400 block">Crop / Stage</span>
                  <span className="font-semibold text-white">
                    {selectedFarm.crop} ({selectedFarm.crop_stage})
                  </span>
                </div>
                <div className="p-2 bg-[#142318] rounded-lg border border-[#213826]">
                  <span className="text-[10px] text-gray-400 block">Plot Area</span>
                  <span className="font-semibold text-gray-200">
                    {selectedFarm.area_hectares} Hectares
                  </span>
                </div>
              </div>

              {/* Soil Moisture Profile: 15cm, 30cm, 60cm */}
              <div className="p-3 bg-[#132217] rounded-xl border border-[#233c29] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5" /> Soil Moisture Profile
                  </span>
                  <span className="text-gray-400 text-[11px]">Capacitive Probe</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {/* 15cm Surface */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-gray-400">15 cm (Surface Layer)</span>
                      <span className="font-mono font-bold text-gray-200">
                        {(selectedFarm.soil_moisture * 0.9).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-[#1e3423] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, selectedFarm.soil_moisture * 0.9)}%` }}
                      />
                    </div>
                  </div>

                  {/* 30cm Root Zone */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-gray-400">30 cm (Root Zone)</span>
                      <span className="font-mono font-bold text-emerald-300">
                        {selectedFarm.soil_moisture.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-[#1e3423] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          selectedFarm.soil_moisture < 22
                            ? 'bg-rose-500'
                            : selectedFarm.soil_moisture < 32
                            ? 'bg-amber-500'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, selectedFarm.soil_moisture)}%` }}
                      />
                    </div>
                  </div>

                  {/* 60cm Subsoil */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-gray-400">60 cm (Deep Subsoil)</span>
                      <span className="font-mono font-bold text-gray-200">
                        {(selectedFarm.soil_moisture * 1.15).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-[#1e3423] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, selectedFarm.soil_moisture * 1.15)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Disease Risk & Advisory Engine */}
              <div className="p-3 bg-[#132217] rounded-xl border border-[#233c29] space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[11px]">Disease Risk Pressure:</span>
                  <span
                    className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${
                      selectedFarm.disease_risk === 'HIGH'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : selectedFarm.disease_risk === 'WATCH'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {selectedFarm.disease_risk}
                  </span>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  {selectedFarm.disease_risk === 'HIGH'
                    ? 'Elevated risk of Northern Leaf Blight and Rust due to recent rainfall and 78% humidity.'
                    : selectedFarm.disease_risk === 'WATCH'
                    ? 'Moderate pressure. Inspect leaves for target-board spotting.'
                    : 'Optimal crop conditions. Continue standard scouting.'}
                </p>
              </div>

              {/* Quick SMS Dispatch to Farmer */}
              <div className="space-y-1.5 text-xs">
                <label className="text-[11px] text-gray-400 block font-medium">
                  Dispatch Direct SMS to Farmer:
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={quickSmsText}
                    onChange={(e) => setQuickSmsText(e.target.value)}
                    className="flex-1 bg-[#142318] border border-[#233a27] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => {
                      sendInboundSMS(selectedFarm.phone, quickSmsText);
                      setQuickSmsText('Delivered!');
                      setTimeout(() => setQuickSmsText('Inspect lower leaves after rain.'), 2000);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 transition"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Action Footer */}
            <div className="pt-4 border-t border-[#1a2d1f] flex gap-2">
              <button
                onClick={() => onScreenFarm && onScreenFarm(selectedFarm.id)}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Screen Leaf Photo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
