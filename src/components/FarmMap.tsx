import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { usePolling } from '../hooks/usePolling';
import { Farm, Province, HealthStatus } from '../types';
import {
  GoogleFarmMap,
  DEPOT_COLORS,
  DEPOT_ICONS,
  DEPOT_TYPE_LABELS,
} from './GoogleFarmMap';
import { useLiveFarmData } from '../hooks/useLiveFarmData';
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
  Globe,
  Building2,
  Phone,
  Mail,
  Navigation,
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

  const { hubs: liveHubs } = useLiveFarmData();
  const { data: rawDepots } = usePolling<any[]>('/api/depots', 30000, []);
  const depots = useMemo(() => (Array.isArray(rawDepots) ? rawDepots : []), [rawDepots]);

  const [mapMode, setMapMode] = useState<'google' | 'vector'>('google');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCluster, setActiveCluster] = useState<Province | 'all'>('all');
  const [showDepots, setShowDepots] = useState(true);
  const [depotTypeFilter, setDepotTypeFilter] = useState<string>('');
  const [focusDistrict, setFocusDistrict] = useState<string>('');
  const [selectedDepot, setSelectedDepot] = useState<any | null>(null);
  const [quickSmsText, setQuickSmsText] = useState('Inspect lower leaves after rain.');

  const hubsWithLive = useMemo(() => {
    return (hubs || []).map((h) => ({
      ...h,
      live: liveHubs[h.id] || undefined,
    }));
  }, [hubs, liveHubs]);

  // Filtering farms
  const filteredFarms = useMemo(() => {
    return (farms || []).filter((farm) => {
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

  // Filtering depots
  const filteredDepots = useMemo(() => {
    if (!showDepots || !Array.isArray(depots)) return [];
    return depots.filter((d: any) => {
      if (depotTypeFilter && d.type !== depotTypeFilter) return false;
      if (activeProvinceFilter !== 'all' && d.province !== activeProvinceFilter) return false;
      if (activeCluster !== 'all' && d.province !== activeCluster) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.district.toLowerCase().includes(q) ||
          d.operator.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [depots, showDepots, depotTypeFilter, activeProvinceFilter, activeCluster, searchQuery]);

  // Zambia coordinates: Lat -18.2 to -8.0, Lon 21.8 to 34.0
  const mapProjection = (lat: number, lon: number) => {
    const minLat = -18.2;
    const maxLat = -8.0;
    const minLon = 21.8;
    const maxLon = 34.0;

    const x = ((lon - minLon) / (maxLon - minLon)) * 740 + 30;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 460 + 40;
    return { x, y };
  };

  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return '#22c55e';
      case 'watch':
        return '#f59e0b';
      case 'alert':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  const totalFarmCount = (farms?.length) || 551;
  const healthyCount = (farms || []).filter((f) => f.health_status === 'healthy').length;
  const watchCount = (farms || []).filter((f) => f.health_status === 'watch').length;
  const alertCount = (farms || []).filter((f) => f.health_status === 'alert').length;
  const hubCount = (hubs?.length) || 15;

  const ALL_PROVINCES: (Province | 'all')[] = [
    'all',
    'Central',
    'Copperbelt',
    'Eastern',
    'Luapula',
    'Lusaka',
    'Muchinga',
    'Northern',
    'North-Western',
    'Southern',
    'Western',
  ];

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
              Zambia Agri-IoT &amp; Depots Operations Map
            </h2>
            <p className="text-[11px] text-gray-400">
              Real-time monitoring across {totalFarmCount} smallholder plots · {(depots?.length) || 47} Strategic Depots · {hubCount} LoRaWAN Hubs · 10 Provinces
            </p>
          </div>
        </div>

        {/* Controls right side */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Focus to Lukulu District */}
          <button
            onClick={() => {
              setFocusDistrict('Lukulu');
              setActiveCluster('Western');
              setActiveProvinceFilter('Western');
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/80 text-amber-300 rounded-lg text-xs font-semibold transition cursor-pointer"
            title="Center map on Lukulu District (-14.37, 23.24) to view 4 local depots"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Focus Lukulu (4 Depots)</span>
          </button>

          {/* Map Type Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-[#142318] border border-[#233a27] rounded-lg text-xs">
            <button
              onClick={() => setMapMode('google')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                mapMode === 'google'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Google Satellite</span>
            </button>
            <button
              onClick={() => setMapMode('vector')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                mapMode === 'vector'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vector Topology</span>
            </button>
          </div>

          {/* Quick Province Selector Dropdown */}
          <div className="flex items-center gap-1 bg-[#142318] border border-[#233a27] rounded-lg px-2 py-1 text-xs">
            <span className="text-gray-400 text-[11px]">Province:</span>
            <select
              value={activeCluster}
              onChange={(e) => {
                const val = e.target.value as Province | 'all';
                setActiveCluster(val);
                setActiveProvinceFilter(val);
                if (val !== 'Western') setFocusDistrict('');
              }}
              className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              {ALL_PROVINCES.map((p) => (
                <option key={p} value={p} className="bg-[#142217] text-white">
                  {p === 'all' ? `All Provinces (${totalFarmCount})` : p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Depot Layer Controls */}
      <div className="p-3 bg-[#0f1911] border-b border-[#1b2e1f] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Search + Layer Toggles */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search farm, depot, district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#142217] border border-[#233827] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Depot Toggle Checkbox */}
          <label className="flex items-center gap-1.5 bg-[#142217] px-2.5 py-1.5 rounded-lg border border-[#233827] cursor-pointer text-xs select-none">
            <input
              type="checkbox"
              checked={showDepots}
              onChange={(e) => setShowDepots(e.target.checked)}
              className="accent-emerald-500 rounded cursor-pointer"
            />
            <span className="text-gray-200 font-medium">
              Show Depots ({(depots?.length) || 47})
            </span>
          </label>

          {/* Depot Type Filter */}
          <select
            value={depotTypeFilter}
            onChange={(e) => setDepotTypeFilter(e.target.value)}
            className="bg-[#142217] text-gray-300 border border-[#233827] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
          >
            <option value="">All Depot Types</option>
            <option value="FRA_DEPOT">🏛️ FRA Depots</option>
            <option value="COOPERATIVE">🤝 Cooperatives</option>
            <option value="AGRO_DEALER">🏪 Agro Dealers</option>
            <option value="MILLER_DEPOT">🏭 Millers</option>
            <option value="EXPORT_HUB">🚢 Export Hubs</option>
          </select>
        </div>

        {/* Right: Health & Crop Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={activeStatusFilter}
            onChange={(e) => setActiveStatusFilter(e.target.value)}
            className="bg-[#142217] text-gray-300 border border-[#233827] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Health ({totalFarmCount})</option>
            <option value="healthy">Healthy Only ({healthyCount})</option>
            <option value="watch">Watch Only ({watchCount})</option>
            <option value="alert">Alert Only ({alertCount})</option>
          </select>

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
            <option value="Cassava">Cassava</option>
            <option value="Rice">Rice</option>
            <option value="Wheat">Wheat</option>
            <option value="Coffee">Coffee</option>
            <option value="Beans">Beans</option>
            <option value="Sorghum">Sorghum</option>
            <option value="Millet">Millet</option>
          </select>
        </div>
      </div>

      {/* Visual Legend Bar */}
      <div className="px-4 py-2 bg-[#0c140e] border-b border-[#1b2e1f] flex flex-wrap items-center justify-between gap-3 text-[11px]">
        {/* Farm & Hub status */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Healthy ({healthyCount})
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Watch ({watchCount})
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Alert ({alertCount})
          </span>
          <span className="flex items-center gap-1 text-red-300 font-medium">
            <Radio className="w-3.5 h-3.5 text-rose-500" /> {hubCount} LoRaWAN Hubs
          </span>
        </div>

        {/* 5 Depot Types Legend */}
        <div className="flex items-center gap-3 flex-wrap pl-3 border-l border-[#1f3523]">
          <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Depots:</span>
          <span className="flex items-center gap-1 text-blue-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1e40af] inline-block border border-white/60" /> FRA
          </span>
          <span className="flex items-center gap-1 text-emerald-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] inline-block border border-white/60" /> Cooperative
          </span>
          <span className="flex items-center gap-1 text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] inline-block border border-white/60" /> Agro Dealer
          </span>
          <span className="flex items-center gap-1 text-purple-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed] inline-block border border-white/60" /> Miller
          </span>
          <span className="flex items-center gap-1 text-rose-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] inline-block border border-white/60" /> Export Hub
          </span>
        </div>
      </div>

      {/* Main Map View & Slide-out Inspector */}
      <div className="relative w-full min-h-[560px] bg-[#0a120c] overflow-hidden flex">
        {/* Map Canvas */}
        {mapMode === 'google' ? (
          <div className="flex-1 h-[560px] relative">
            <GoogleFarmMap
              farms={filteredFarms}
              hubs={hubsWithLive}
              depots={depots}
              showDepots={showDepots}
              depotTypeFilter={depotTypeFilter}
              focusDistrict={focusDistrict}
              onFarmClick={(farm) => {
                setSelectedFarm(farm);
                setSelectedDepot(null);
              }}
            />
          </div>
        ) : (
          <div className="flex-1 h-full min-h-[520px] relative cursor-crosshair">
            <svg
              viewBox="0 0 800 540"
              className="w-full h-full select-none"
              style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}
            >
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

              {/* Province Silhouettes */}
              <g opacity="0.3" stroke="#25422a" strokeWidth="1.2" fill="#0d1b10">
                <path d="M 520 80 Q 720 120 740 280 T 560 380 Q 480 300 520 80 Z" />
                <path d="M 210 100 Q 420 110 450 260 T 260 320 Q 180 200 210 100 Z" />
                <path d="M 120 280 Q 320 290 340 440 T 160 480 Q 90 380 120 280 Z" />
              </g>

              {/* Hub Coverage Radius Circles */}
              {(hubs || []).map((hub) => {
                const { x, y } = mapProjection(hub.latitude, hub.longitude);
                return (
                  <g key={hub.id}>
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
                  </g>
                );
              })}

              {/* Depots Layer (Rendered below farms) */}
              {showDepots &&
                filteredDepots.map((depot: any) => {
                  const lat = Number(depot.lat ?? depot.latitude);
                  const lon = Number(depot.lon ?? depot.longitude);
                  if (isNaN(lat) || isNaN(lon)) return null;
                  const { x, y } = mapProjection(lat, lon);
                  const color = DEPOT_COLORS[depot.type] || '#16a34a';
                  const icon = DEPOT_ICONS[depot.type] || '📍';
                  const isSelected = selectedDepot?.name === depot.name;

                  return (
                    <g
                      key={depot.name}
                      onClick={() => {
                        setSelectedDepot(depot);
                        setSelectedFarm(null);
                      }}
                      className="cursor-pointer transition-transform hover:scale-125"
                      style={{ transformOrigin: `${x}px ${y}px` }}
                    >
                      {isSelected && (
                        <circle
                          cx={x}
                          cy={y}
                          r="14"
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          className="animate-ping"
                        />
                      )}
                      <circle cx={x} cy={y} r="8" fill={color} stroke="#ffffff" strokeWidth="2" />
                      <text
                        x={x}
                        y={y + 3.5}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#ffffff"
                        fontWeight="bold"
                      >
                        {icon}
                      </text>
                    </g>
                  );
                })}

              {/* Farm Markers */}
              {filteredFarms.map((farm) => {
                const { x, y } = mapProjection(farm.latitude, farm.longitude);
                const isSelected = selectedFarm?.id === farm.id;
                const color = getStatusColor(farm.health_status);

                return (
                  <g
                    key={farm.id}
                    onClick={() => {
                      setSelectedFarm(farm);
                      setSelectedDepot(null);
                    }}
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
                <span className="text-emerald-400 font-bold">{filteredFarms.length}</span> / {totalFarmCount} farms ·{' '}
                <span className="text-blue-400 font-bold">{filteredDepots.length}</span> depots
              </div>
              <div>
                <span className="text-gray-500">GATEWAY:</span>{' '}
                <span className="text-emerald-400 font-bold">LoRaWAN EU868</span>
              </div>
            </div>
          </div>
        )}

        {/* Slide-out Depot Details Inspector Drawer */}
        {selectedDepot && (
          <div className="w-80 md:w-96 bg-[#0f1a12] border-l border-[#1f3524] p-4 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right-4 duration-200">
            <div className="space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-[#1a2d1f]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{DEPOT_ICONS[selectedDepot.type] || '🏛️'}</span>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {selectedDepot.name}
                    </h3>
                  </div>
                  <span
                    className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                    style={{
                      backgroundColor: DEPOT_COLORS[selectedDepot.type] + '33',
                      color: DEPOT_COLORS[selectedDepot.type],
                      border: `1px solid ${DEPOT_COLORS[selectedDepot.type]}88`,
                    }}
                  >
                    {DEPOT_TYPE_LABELS[selectedDepot.type] || selectedDepot.type}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedDepot.district} District · {selectedDepot.province} Province
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDepot(null)}
                  className="text-gray-400 hover:text-white p-1 rounded transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#142318] border border-[#233a27]">
                  <span className="text-gray-400 block text-[10px] uppercase font-mono">Operator</span>
                  <span className="font-semibold text-white">{selectedDepot.operator}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#142318] border border-[#233a27]">
                  <span className="text-gray-400 block text-[10px] uppercase font-mono">Storage Capacity</span>
                  <span className="font-semibold text-emerald-400">
                    {(selectedDepot.capacity_tons || 0).toLocaleString()} tons
                  </span>
                </div>
                <div className="col-span-2 p-2.5 rounded-lg bg-[#142318] border border-[#233a27]">
                  <span className="text-gray-400 block text-[10px] uppercase font-mono">Handled Crops</span>
                  <span className="font-semibold text-white">
                    {(Array.isArray(selectedDepot.crops) ? selectedDepot.crops : []).join(', ')}
                  </span>
                </div>
              </div>

              {/* Direct Communications Links */}
              <div className="pt-2 space-y-2">
                <a
                  href={`tel:${selectedDepot.phone}`}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-950 transition"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Operator ({selectedDepot.phone})</span>
                </a>
                <a
                  href={`mailto:${selectedDepot.email}`}
                  className="w-full py-2.5 px-3 bg-[#142318] hover:bg-[#1a2d1f] text-emerald-300 border border-emerald-800/80 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Aggregator ({selectedDepot.email})</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Slide-out Farm Telemetry Inspector Drawer */}
        {selectedFarm && (
          <div className="w-80 md:w-96 bg-[#0f1a12] border-l border-[#1f3524] p-4 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right-4 duration-200">
            <div className="space-y-4">
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
                <div className="p-2.5 rounded-lg bg-[#142318] border border-[#233a27]">
                  <span className="text-gray-400 block text-[10px] uppercase font-mono">ZIAMIS ID</span>
                  <span className="font-semibold text-emerald-400">{selectedFarm.ziamis_id}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#142318] border border-[#233a27]">
                  <span className="text-gray-400 block text-[10px] uppercase font-mono">Plot Size</span>
                  <span className="font-semibold text-white">{selectedFarm.area_hectares} ha</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#142318] border border-[#233a27]">
                  <span className="text-gray-400 block text-[10px] uppercase font-mono">Primary Crop</span>
                  <span className="font-semibold text-white">{selectedFarm.crop}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#142318] border border-[#233a27]">
                  <span className="text-gray-400 block text-[10px] uppercase font-mono">Crop Stage</span>
                  <span className="font-semibold text-white">{selectedFarm.crop_stage}</span>
                </div>
              </div>

              {/* Sensor Soil Moisture */}
              <div className="p-3 bg-[#132016] border border-[#203625] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 font-semibold flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                    Soil Moisture (30cm)
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {selectedFarm.soil_moisture}%
                  </span>
                </div>
                <div className="w-full bg-[#1e3423] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      selectedFarm.soil_moisture > 30
                        ? 'bg-emerald-500'
                        : selectedFarm.soil_moisture > 20
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, (selectedFarm.soil_moisture / 50) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Quick SMS Dispatch */}
              <div className="p-3 bg-[#132016] border border-[#203625] rounded-xl space-y-2">
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
