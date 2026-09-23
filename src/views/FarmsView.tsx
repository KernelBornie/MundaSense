import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Farm, Province, HealthStatus } from '../types';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Droplets,
  Camera,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';

interface FarmsViewProps {
  onScreenFarm: (farmId: number) => void;
}

export const FarmsView: React.FC<FarmsViewProps> = ({ onScreenFarm }) => {
  const {
    farms,
    setSelectedFarm,
    activeProvinceFilter,
    setActiveProvinceFilter,
    activeCropFilter,
    setActiveCropFilter,
    activeStatusFilter,
    setActiveStatusFilter,
  } = useApp();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filteredFarms = useMemo(() => {
    return farms.filter((f) => {
      if (activeProvinceFilter !== 'all' && f.province !== activeProvinceFilter) return false;
      if (activeCropFilter !== 'all' && f.crop !== activeCropFilter) return false;
      if (activeStatusFilter !== 'all' && f.health_status !== activeStatusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.village.toLowerCase().includes(q) ||
          f.ziamis_id.toLowerCase().includes(q) ||
          f.phone.includes(q)
        );
      }
      return true;
    });
  }, [farms, activeProvinceFilter, activeCropFilter, activeStatusFilter, search]);

  const totalPages = Math.ceil(filteredFarms.length / pageSize) || 1;
  const currentFarms = filteredFarms.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-[#111e15] border border-[#1e3623] rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            108 Smallholder Farms Registry (Zambia)
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Synchronized with ZIAMIS (Zambia Integrated Agriculture Management Information System)
          </p>
        </div>

        {/* Status Breakdown Pills */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-2.5 py-1 rounded-lg bg-[#142618] border border-emerald-800 text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> 82 Healthy
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#272111] border border-amber-800 text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> 18 Watch
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#291316] border border-rose-800 text-rose-300 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" /> 8 Alert
          </span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-[#101b13] border border-[#1d3321] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search farmer name, village, ZIAMIS ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-[#142217] border border-[#233b28] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Province */}
          <select
            value={activeProvinceFilter}
            onChange={(e) => {
              setActiveProvinceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#142217] text-gray-300 border border-[#233b28] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Provinces (3)</option>
            <option value="Eastern">Eastern (Chipata - 40)</option>
            <option value="Lusaka">Lusaka (Chongwe - 35)</option>
            <option value="Central">Central (Mkushi - 33)</option>
          </select>

          {/* Health Status */}
          <select
            value={activeStatusFilter}
            onChange={(e) => {
              setActiveStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#142217] text-gray-300 border border-[#233b28] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Health Status</option>
            <option value="healthy">Healthy Only</option>
            <option value="watch">Watch Only</option>
            <option value="alert">Alert Only</option>
          </select>

          {/* Crop */}
          <select
            value={activeCropFilter}
            onChange={(e) => {
              setActiveCropFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#142217] text-gray-300 border border-[#233b28] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Crops</option>
            <option value="Maize">Maize</option>
            <option value="Groundnuts">Groundnuts</option>
            <option value="Soybeans">Soybeans</option>
            <option value="Sunflower">Sunflower</option>
            <option value="Cotton">Cotton</option>
          </select>
        </div>
      </div>

      {/* Farms Table */}
      <div className="bg-[#101b13] border border-[#1d3321] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0c150e] border-b border-[#1b2e1e] text-[11px] font-mono text-gray-400 uppercase">
              <tr>
                <th className="py-3 px-4">Plot #</th>
                <th className="py-3 px-4">Farmer / ZIAMIS</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Crop &amp; Stage</th>
                <th className="py-3 px-4">Soil Profile (30cm)</th>
                <th className="py-3 px-4">Disease Risk</th>
                <th className="py-3 px-4">Health Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#17281a]">
              {currentFarms.map((farm) => (
                <tr
                  key={farm.id}
                  className="hover:bg-[#142318]/70 transition cursor-pointer"
                  onClick={() => setSelectedFarm(farm)}
                >
                  {/* Plot # */}
                  <td className="py-3 px-4 font-mono font-bold text-gray-400">
                    #{farm.id}
                  </td>

                  {/* Farmer / ZIAMIS */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-xs">{farm.name}</div>
                    <div className="text-[10.5px] text-emerald-400 font-mono">
                      {farm.ziamis_id} · {farm.phone}
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4">
                    <div className="text-gray-200">{farm.village}</div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      {farm.district} ({farm.province})
                    </div>
                  </td>

                  {/* Crop & Stage */}
                  <td className="py-3 px-4">
                    <span className="font-semibold text-white">{farm.crop}</span>
                    <span className="text-gray-400 text-[10.5px] block">{farm.crop_stage}</span>
                  </td>

                  {/* Soil Moisture */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-mono font-bold text-white">
                        {farm.soil_moisture.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-24 bg-[#1b2d1d] h-1.5 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          farm.soil_moisture < 22
                            ? 'bg-rose-500'
                            : farm.soil_moisture < 32
                            ? 'bg-amber-500'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, farm.soil_moisture)}%` }}
                      />
                    </div>
                  </td>

                  {/* Disease Risk */}
                  <td className="py-3 px-4 font-mono">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        farm.disease_risk === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : farm.disease_risk === 'WATCH'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {farm.disease_risk}
                    </span>
                  </td>

                  {/* Health Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 w-fit ${
                        farm.health_status === 'healthy'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : farm.health_status === 'watch'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          farm.health_status === 'healthy'
                            ? 'bg-emerald-400'
                            : farm.health_status === 'watch'
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        }`}
                      />
                      {farm.health_status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onScreenFarm(farm.id)}
                      className="px-2.5 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg font-semibold text-[11px] flex items-center gap-1 ml-auto transition"
                      title="Run AI leaf screening for this farm"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Screen</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-[#0c150e] border-t border-[#1b2e1e] flex items-center justify-between text-xs text-gray-400">
          <div>
            Showing{' '}
            <span className="text-white font-bold">
              {Math.min(filteredFarms.length, (currentPage - 1) * pageSize + 1)}-
              {Math.min(filteredFarms.length, currentPage * pageSize)}
            </span>{' '}
            of <span className="text-white font-bold">{filteredFarms.length}</span> smallholder plots
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1 rounded bg-[#162719] hover:bg-[#203624] disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-semibold"
            >
              Previous
            </button>
            <span className="px-2 font-mono text-gray-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 rounded bg-[#162719] hover:bg-[#203624] disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
