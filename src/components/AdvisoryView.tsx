import React, { useState } from 'react';
import { usePolling } from '../hooks/usePolling';
import {
  BellRing,
  Send,
  Phone,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Radio,
  Clock,
  Sparkles,
  MapPin,
} from 'lucide-react';

interface AdvisoryRow {
  id: number;
  farm_phone: string;
  channel: string;
  category: string;
  message: string;
  language?: string;
  status: string;
  created_at: string;
  farm_name?: string;
  village?: string;
  province?: string;
  crop?: string;
}

export function AdvisoryView() {
  const { data: advisories, refresh, loading, tick } = usePolling<AdvisoryRow[]>(
    '/api/advisories',
    5000
  );

  const [generating, setGenerating] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{ generated: number; pushed_sms: number } | null>(
    null
  );
  const [categoryFilter, setCategoryFilter] = useState('all');

  const handleGenerate = async () => {
    setGenerating(true);
    setDispatchResult(null);
    try {
      const res = await fetch('/api/advisories/generate', { method: 'POST' });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      setDispatchResult(data);
      refresh();
    } catch (err: any) {
      alert(`Advisory dispatch failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const filtered = (advisories || []).filter((a) => {
    if (categoryFilter !== 'all' && a.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                <BellRing className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Agronomic Advisory & Extension Dispatch
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Automated hyper-local micro-climate advice and disease warnings pushed to smallholder farmers via
              2G SMS and USSD notifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#152718] border border-[#234329] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold">LIVE · Tick #{tick}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400">{advisories?.length || 0} Advisories</span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition cursor-pointer"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating & Dispatching…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate & Dispatch Advisories
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Dispatch Result Banner */}
        {dispatchResult && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <strong className="text-white text-sm">
                  Generated {dispatchResult.generated} · Pushed {dispatchResult.pushed_sms} SMS
                </strong>
                <p className="text-emerald-300/80 text-[11px] mt-0.5">
                  Telemetry rule engine generated agronomic recommendations based on soil moisture and pest severity.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDispatchResult(null)}
              className="text-emerald-400 hover:text-white font-mono text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-[#101b13] border border-[#1e3623] rounded-2xl p-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'Irrigation', 'Disease', 'Storage', 'Market'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                categoryFilter.toLowerCase() === cat.toLowerCase()
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[#152418] text-gray-400 hover:text-white border border-[#223926]'
              }`}
            >
              {cat === 'all' ? 'All Advisories' : cat}
            </button>
          ))}
        </div>

        <button
          onClick={refresh}
          className="p-2 bg-[#152418] hover:bg-[#1f3724] text-emerald-400 border border-[#233f28] rounded-xl transition cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Advisories Table */}
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#142317] text-gray-400 uppercase text-[10px] border-b border-[#1e3623]">
              <tr>
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Farmer Contact</th>
                <th className="py-3 px-3">Location & Crop</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Advisory Message</th>
                <th className="py-3 px-3">Channel</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#18291c] text-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 italic font-sans">
                    No advisories found. Click "Generate & Dispatch Advisories" above to run the agronomy rule engine.
                  </td>
                </tr>
              ) : (
                filtered.map((adv) => (
                  <tr key={adv.id} className="hover:bg-[#152418] transition">
                    <td className="py-3 px-3 text-emerald-400 font-bold whitespace-nowrap">
                      #{adv.id}
                    </td>

                    <td className="py-3 px-3 text-gray-400 whitespace-nowrap text-[11px]">
                      {new Date(adv.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Farmer Contact Link */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-sans font-semibold text-white">
                        {adv.farm_name || 'Farmer'}
                      </div>
                      <a
                        href={`tel:${adv.farm_phone}`}
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline text-[11px]"
                      >
                        <Phone className="w-3 h-3 text-emerald-500" />
                        <span>{adv.farm_phone}</span>
                      </a>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-gray-200">{adv.village || 'Eastern'}</div>
                      <div className="text-[10px] text-gray-400 font-sans">{adv.crop || 'Maize'}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          adv.category === 'Disease'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : adv.category === 'Irrigation'
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                            : adv.category === 'Storage'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {adv.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-sans text-xs max-w-md">
                      <p className="text-gray-200 leading-snug">{adv.message}</p>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-lg bg-[#0f1b12] border border-[#1b3420] text-gray-300 text-[10px]">
                        {adv.channel}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                          adv.status === 'sent' || adv.status === 'delivered'
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {adv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
