import React, { useState, useMemo } from 'react';
import { usePolling } from '../hooks/usePolling';
import {
  Tractor,
  Phone,
  Search,
  Camera,
  Activity,
  Droplet,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  MapPin,
} from 'lucide-react';

interface FarmRow {
  id: number;
  farmer_phone: string;
  name: string;
  village: string;
  district?: string;
  province: string;
  latitude: number;
  longitude: number;
  crop: string;
  crop_stage?: string;
  soil_moisture: number;
  health_status: 'healthy' | 'watch' | 'alert';
  disease_risk: 'LOW' | 'WATCH' | 'HIGH';
  ziamis_id?: string;
  created_at?: string;
}

interface FarmsViewProps {
  onScreenFarm?: (farmId: number) => void;
}

export function FarmsView({ onScreenFarm }: FarmsViewProps) {
  const { data: farms, loading, refresh, tick } = usePolling<FarmRow[]>('/api/farms', 5000);

  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [cropFilter, setCropFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return (farms || []).filter((f) => {
      if (provinceFilter !== 'all' && f.province !== provinceFilter) return false;
      if (cropFilter !== 'all' && f.crop !== cropFilter) return false;
      if (statusFilter !== 'all' && f.health_status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchName = (f.name || '').toLowerCase().includes(q);
        const matchPhone = (f.farmer_phone || '').includes(q);
        const matchLoc = (f.village || '').toLowerCase().includes(q) || (f.province || '').toLowerCase().includes(q);
        const matchZiamis = (f.ziamis_id || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchLoc && !matchZiamis) return false;
      }
      return true;
    });
  }, [farms, provinceFilter, cropFilter, statusFilter, search]);

  const uniqueCrops = useMemo(() => {
    const set = new Set<string>();
    (farms || []).forEach((f) => {
      if (f.crop) set.add(f.crop);
    });
    return Array.from(set);
  }, [farms]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                <Tractor className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Smallholder Farm Registry & Telemetry
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Real-time monitoring of registered farmer plots across Zambia. Telemetry feeds from low-cost soil
              probes and USSD field registrations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* LIVE Tick Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#152718] border border-[#234329] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold">LIVE · Tick #{tick}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400">{farms?.length || 0} Farms</span>
            </div>

            <button
              onClick={refresh}
              className="p-2 bg-[#152418] hover:bg-[#1f3724] text-emerald-400 border border-[#233f28] rounded-xl transition cursor-pointer"
              title="Refresh farm list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Province Filter */}
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#142318] border border-[#233a27] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Provinces (10)</option>
            <option value="Central">Central</option>
            <option value="Copperbelt">Copperbelt</option>
            <option value="Eastern">Eastern</option>
            <option value="Luapula">Luapula</option>
            <option value="Lusaka">Lusaka</option>
            <option value="Muchinga">Muchinga</option>
            <option value="Northern">Northern</option>
            <option value="North-Western">North-Western</option>
            <option value="Southern">Southern</option>
            <option value="Western">Western</option>
          </select>

          {/* Crop Filter */}
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#142318] border border-[#233a27] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Crops</option>
            {uniqueCrops.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#142318] border border-[#233a27] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Health Statuses</option>
            <option value="healthy">Healthy</option>
            <option value="watch">Watch</option>
            <option value="alert">Alert</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search farmer, phone, ZIAMIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#142318] border border-[#233a27] rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Farms Table */}
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#142317] text-gray-400 uppercase text-[10px] border-b border-[#1e3623]">
              <tr>
                <th className="py-3 px-3">Plot #</th>
                <th className="py-3 px-3">Farmer / ZIAMIS</th>
                <th className="py-3 px-3">Farmer Contact</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Crop & Stage</th>
                <th className="py-3 px-3">Soil @30cm</th>
                <th className="py-3 px-3">Disease Risk</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#18291c] text-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500 italic">
                    No farm records found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((farm) => {
                  const soilVal = Number(farm.soil_moisture);
                  return (
                    <tr key={farm.id} className="hover:bg-[#152418] transition">
                      {/* Plot # */}
                      <td className="py-3 px-3 text-emerald-400 font-bold whitespace-nowrap">
                        #{farm.id}
                      </td>

                      {/* Farmer / ZIAMIS */}
                      <td className="py-3 px-3">
                        <div className="font-sans font-bold text-white text-xs">{farm.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {farm.ziamis_id || `ZM-${farm.id}`}
                        </div>
                      </td>

                      {/* Farmer Phone (Clickable tel: link) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <a
                          href={`tel:${farm.farmer_phone}`}
                          className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 hover:underline"
                        >
                          <Phone className="w-3 h-3 text-emerald-500" />
                          <span>{farm.farmer_phone}</span>
                        </a>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3">
                        <div className="text-gray-200">{farm.village}</div>
                        <div className="text-[10px] text-gray-400">{farm.province}</div>
                      </td>

                      {/* Crop & Stage */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-white">{farm.crop}</span>
                        <div className="text-[10px] text-gray-400 capitalize">{farm.crop_stage || 'vegetative'}</div>
                      </td>

                      {/* Soil 30cm */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Droplet
                            className={`w-3.5 h-3.5 ${
                              soilVal < 22 ? 'text-rose-400' : soilVal < 32 ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          />
                          <span className="font-bold">{soilVal.toFixed(1)}%</span>
                        </div>
                      </td>

                      {/* Disease Risk */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            farm.disease_risk === 'HIGH'
                              ? 'text-rose-400'
                              : farm.disease_risk === 'WATCH'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {farm.disease_risk || 'LOW'}
                        </span>
                      </td>

                      {/* Health Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                            farm.health_status === 'healthy'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : farm.health_status === 'watch'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}
                        >
                          {farm.health_status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => onScreenFarm?.(farm.id)}
                          className="px-2.5 py-1 bg-[#1a311f] hover:bg-emerald-700 text-emerald-300 hover:text-white border border-[#2e5636] rounded-lg text-[11px] font-sans font-bold inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          Screen
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
