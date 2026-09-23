import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdvisoryCategory } from '../types';
import {
  Send,
  Sparkles,
  MessageSquare,
  Globe,
  Radio,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export const AdvisoryView: React.FC = () => {
  const { advisories, generateAndDispatchAdvisories, farms } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [dispatchedCount, setDispatchedCount] = useState<number | null>(null);

  const handleGenerate = () => {
    const count = generateAndDispatchAdvisories();
    setDispatchedCount(count);
    setTimeout(() => setDispatchedCount(null), 3000);
  };

  const filteredAdvisories = advisories.filter((a) => {
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    if (selectedChannel !== 'all' && a.channel !== selectedChannel) return false;
    if (selectedLanguage !== 'all' && a.language !== selectedLanguage) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111e15] border border-[#1e3623] rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Multi-Lingual Agronomic Advisory Engine
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Generates personalized, localized advisories in Zambian vernaculars (Bemba, Nyanja, Tonga, English)
          </p>
        </div>

        <button
          onClick={handleGenerate}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate &amp; Dispatch Advisories</span>
        </button>
      </div>

      {/* Dispatched Notification Banner */}
      {dispatchedCount !== null && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>
            Successfully generated and queued <strong>{dispatchedCount}</strong> targeted advisories across SMS and USSD channels!
          </span>
        </div>
      )}

      {/* Filtering Row */}
      <div className="bg-[#101b13] border border-[#1d3321] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#142217] text-gray-300 border border-[#233b28] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Irrigation">Irrigation Advisories</option>
            <option value="Disease">Disease Alerts</option>
            <option value="Storage">Storage &amp; Aflatoxin</option>
            <option value="Market">Market &amp; Bulking</option>
          </select>

          {/* Channel */}
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="bg-[#142217] text-gray-300 border border-[#233b28] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="SMS">SMS Cellular</option>
            <option value="USSD">USSD Session</option>
            <option value="IVR">Voice IVR</option>
          </select>

          {/* Language */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-[#142217] text-gray-300 border border-[#233b28] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Languages</option>
            <option value="Bemba">Bemba (Chibemba)</option>
            <option value="Nyanja">Nyanja (Chinyanja)</option>
            <option value="Tonga">Tonga (Chitonga)</option>
            <option value="English">English</option>
          </select>
        </div>

        <span className="text-gray-400 font-mono text-[11px]">
          Showing {filteredAdvisories.length} Dispatched Messages
        </span>
      </div>

      {/* Advisory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {filteredAdvisories.map((advisory) => (
          <div
            key={advisory.id}
            className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1a2d1f]">
                <span className="font-bold text-white text-xs">
                  {advisory.farm_name} ({advisory.village})
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {advisory.crop}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 rounded bg-[#162719] text-gray-300 border border-[#243e29] text-[10px] font-mono">
                  {advisory.channel}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    advisory.category === 'Disease'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : advisory.category === 'Irrigation'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {advisory.category}
                </span>
                <span className="text-[10px] text-gray-400 ml-auto font-mono">
                  {advisory.language}
                </span>
              </div>

              <p className="text-gray-200 mt-2 leading-relaxed text-xs">
                {advisory.message}
              </p>
            </div>

            <div className="pt-2 border-t border-[#1a2d1f] flex items-center justify-between text-[10.5px] text-gray-400 font-mono">
              <span className="text-emerald-400">STATUS: DELIVERED</span>
              <span>{new Date(advisory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
