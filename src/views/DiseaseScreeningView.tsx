import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SAMPLE_LEAVES, SampleLeaf } from '../data/sampleImages';
import { CropHealthReport, RiskLevel } from '../types';
import {
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  ShieldAlert,
  Send,
  UserCheck,
  Info,
  Clock,
} from 'lucide-react';

interface DiseaseScreeningViewProps {
  initialFarmId?: number;
}

export const DiseaseScreeningView: React.FC<DiseaseScreeningViewProps> = ({ initialFarmId }) => {
  const { farms, cropReports, analyzeDisease, sendInboundSMS } = useApp();

  const [selectedFarmId, setSelectedFarmId] = useState<number>(initialFarmId || 14);
  const [selectedCrop, setSelectedCrop] = useState<string>('Maize');
  const [selectedSample, setSelectedSample] = useState<SampleLeaf | null>(SAMPLE_LEAVES[0]);
  const [customImageUri, setCustomImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestReport, setLatestReport] = useState<CropHealthReport | null>(null);
  const [officerCalled, setOfficerCalled] = useState(false);

  const activeFarm = farms.find((f) => f.id === selectedFarmId) || farms[13];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCustomImageUri(dataUrl);
      setSelectedSample(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRunScreening = async () => {
    setIsAnalyzing(true);
    setOfficerCalled(false);

    try {
      const payload = customImageUri || selectedSample?.id || 'sample-maize-blight';
      const report = await analyzeDisease(selectedFarmId, selectedCrop, payload);
      setLatestReport(report);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEscalateOfficer = () => {
    setOfficerCalled(true);
    sendInboundSMS(
      activeFarm.phone,
      `MundaSense Escalation: Extension Officer Cosmas Lungu has been dispatched for leaf inspection on Plot #${activeFarm.id}. Expected call within 4 hours.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner: AI-Assisted Screening */}
      <div className="bg-[#1b2512] border-2 border-amber-500/70 rounded-2xl p-4 shadow-xl flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm tracking-tight">
              AI-Assisted Screening Protocol
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-bold uppercase">
              Field Screening Only
            </span>
          </div>
          <p className="text-gray-300 mt-1 leading-relaxed">
            This module provides <strong>preliminary screening</strong>, not a definitive laboratory diagnosis.
            Recommendations include confidence thresholds, visible foliar symptoms, and mandatory extension-officer escalation when confidence falls below 75% or severe blights are suspected.
          </p>
        </div>
      </div>

      {/* Main Grid: Upload & Inspection Card vs Screening Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sample Selector & File Upload */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Select or Upload Leaf Image</span>
            </h3>

            {/* Farm Target Selection */}
            <div>
              <label className="text-[11px] text-gray-400 block font-medium mb-1">
                Target Plot / Farmer:
              </label>
              <select
                value={selectedFarmId}
                onChange={(e) => {
                  const id = parseInt(e.target.value, 10);
                  setSelectedFarmId(id);
                  const f = farms.find((farm) => farm.id === id);
                  if (f) setSelectedCrop(f.crop);
                }}
                className="w-full bg-[#152418] border border-[#233f28] rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none"
              >
                {farms.slice(0, 30).map((f) => (
                  <option key={f.id} value={f.id}>
                    Plot #{f.id}: {f.name} ({f.village}) · {f.crop}
                  </option>
                ))}
              </select>
            </div>

            {/* Preset Samples Selector */}
            <div>
              <label className="text-[11px] text-gray-400 block font-medium mb-1.5 flex items-center justify-between">
                <span>Agronomic Test Leaves (Click to test):</span>
                <span className="text-[10px] text-emerald-400 font-mono">8 Presets</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_LEAVES.map((sample) => {
                  const isPicked = selectedSample?.id === sample.id && !customImageUri;
                  return (
                    <button
                      key={sample.id}
                      onClick={() => {
                        setSelectedSample(sample);
                        setCustomImageUri(null);
                        setSelectedCrop(sample.crop);
                      }}
                      className={`p-2 rounded-xl text-left border transition relative overflow-hidden flex flex-col justify-between ${
                        isPicked
                          ? 'bg-[#18311e] border-emerald-500 ring-1 ring-emerald-500/60'
                          : 'bg-[#132217] border-[#223d27] hover:bg-[#1a2d1f]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase">
                          {sample.crop}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 rounded ${
                            sample.expectedRisk === 'HIGH'
                              ? 'bg-rose-950 text-rose-300'
                              : sample.expectedRisk === 'WATCH'
                              ? 'bg-amber-950 text-amber-300'
                              : 'bg-emerald-950 text-emerald-300'
                          }`}
                        >
                          {sample.expectedRisk}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-white line-clamp-1">
                        {sample.name}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                        {sample.disease}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drag & Drop Real Photo Upload */}
            <div className="pt-2 border-t border-[#1b3120]">
              <label className="text-[11px] text-gray-400 block font-medium mb-1.5">
                Or Upload Live Field Photo (Camera / File):
              </label>
              <label className="border-2 border-dashed border-[#26442b] hover:border-emerald-500/70 bg-[#0d1710] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                <Upload className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition mb-1" />
                <span className="text-xs text-gray-300 font-semibold">
                  {customImageUri ? 'Photo Selected (Click to change)' : 'Upload leaf image or capture with camera'}
                </span>
                <span className="text-[10px] text-gray-500 mt-0.5">
                  JPEG, PNG, WebP up to 10MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Run Action Button */}
            <button
              onClick={handleRunScreening}
              disabled={isAnalyzing}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAnalyzing ? 'Analyzing Foliar Patterns...' : 'Run AI Screening'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Screening Results Output Card */}
        <div className="lg:col-span-7">
          {latestReport ? (
            <div className="bg-[#101b13] border-2 border-emerald-600/70 rounded-2xl p-6 shadow-2xl space-y-5 text-xs animate-in fade-in duration-200">
              {/* Report Header */}
              <div className="flex items-start justify-between border-b border-[#1c3522] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                      Report #{latestReport.id}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(latestReport.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight mt-1.5">
                    {latestReport.predicted_disease}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Plot: {activeFarm.name} ({activeFarm.village}) · Crop: {latestReport.crop}
                  </p>
                </div>

                {/* Risk Level Badge */}
                <div className="text-right">
                  <span
                    className={`text-xs px-3 py-1 rounded-lg font-bold font-mono uppercase ${
                      latestReport.risk_level === 'HIGH'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : latestReport.risk_level === 'WATCH'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {latestReport.risk_level} RISK
                  </span>
                </div>
              </div>

              {/* Metrics Row: Confidence + Severity */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Confidence Meter */}
                <div className="p-3 bg-[#142318] rounded-xl border border-[#223d27]">
                  <span className="text-[10.5px] text-gray-400 block mb-1">
                    Screening Confidence
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-white font-mono">
                      {Math.round(latestReport.confidence * 100)}%
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {latestReport.confidence >= 0.75 ? 'Reliable' : 'Low Confidence'}
                    </span>
                  </div>
                  <div className="w-full bg-[#1b3321] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        latestReport.confidence >= 0.75 ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${latestReport.confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Severity Badge */}
                <div className="p-3 bg-[#142318] rounded-xl border border-[#223d27]">
                  <span className="text-[10.5px] text-gray-400 block mb-1">
                    Pathological Severity
                  </span>
                  <div className="text-lg font-black text-white uppercase font-mono mt-1">
                    {latestReport.severity}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Canopy impact grade
                  </span>
                </div>

                {/* Expert Review Flag */}
                <div className="p-3 bg-[#142318] rounded-xl border border-[#223d27] col-span-2 sm:col-span-1">
                  <span className="text-[10.5px] text-gray-400 block mb-1">
                    Officer Escalation
                  </span>
                  <div className="text-xs font-bold mt-1">
                    {latestReport.needs_expert_review ? (
                      <span className="text-rose-400 flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-3.5 h-3.5" /> ESCALATE
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ROUTINE
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {latestReport.needs_expert_review
                      ? 'Low confidence or severe'
                      : 'Self-manageable'}
                  </span>
                </div>
              </div>

              {/* Symptoms Detected */}
              <div className="p-3.5 bg-[#142318] rounded-xl border border-[#223d27] space-y-1">
                <span className="text-[11px] font-bold text-gray-300 block">
                  Visible Symptoms Identified:
                </span>
                <p className="text-xs text-gray-200 leading-relaxed">
                  {latestReport.symptoms}
                </p>
              </div>

              {/* Recommended Agronomic Actions */}
              <div className="p-3.5 bg-[#142318] rounded-xl border border-[#223d27] space-y-1">
                <span className="text-[11px] font-bold text-emerald-400 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Recommended Next Steps (Smallholder Protocol):
                </span>
                <p className="text-xs text-white leading-relaxed">
                  {latestReport.recommendation}
                </p>
              </div>

              {/* Escalation Notification Bar */}
              {latestReport.needs_expert_review && (
                <div className="p-3.5 bg-rose-950/70 border border-rose-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-white block">
                        Extension Officer Escalation Triggered
                      </span>
                      <span className="text-[11px] text-rose-200">
                        {officerCalled
                          ? 'Escalation logged. Agricultural Extension Officer Cosmas Lungu notified.'
                          : 'Confidence threshold or pathogen severity requires field validation.'}
                      </span>
                    </div>
                  </div>

                  {!officerCalled && (
                    <button
                      onClick={handleEscalateOfficer}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition active:scale-95 whitespace-nowrap shadow-md shadow-black"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Notify Officer</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-3 min-h-[380px]">
              <div className="w-14 h-14 rounded-2xl bg-[#152518] border border-[#223d27] flex items-center justify-center text-emerald-400">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                No Screening Run Yet
              </h3>
              <p className="text-xs text-gray-400 max-w-sm">
                Select an agronomic test sample on the left or upload a photo from your device, then click <strong>Run AI Screening</strong>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Historical Screening Reports Table */}
      <div className="bg-[#101b13] border border-[#1d3321] rounded-2xl p-4 shadow-xl space-y-3 text-xs">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Screening Records &amp; Extension Review Audit Log</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0c150e] border-b border-[#1b2e1e] text-[11px] font-mono text-gray-400 uppercase">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Plot / Farmer</th>
                <th className="py-2.5 px-3">Crop</th>
                <th className="py-2.5 px-3">Predicted Disease</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Risk</th>
                <th className="py-2.5 px-3">Escalation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#17281a]">
              {cropReports.map((r) => (
                <tr key={r.id} className="hover:bg-[#142318]">
                  <td className="py-2.5 px-3 font-mono text-gray-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-white">
                    {r.farm_name || `Plot #${r.farm_id}`}
                  </td>
                  <td className="py-2.5 px-3">{r.crop}</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-300">
                    {r.predicted_disease}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {Math.round(r.confidence * 100)}%
                  </td>
                  <td className="py-2.5 px-3 uppercase font-mono text-gray-300">
                    {r.severity}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[9.5px] px-2 py-0.5 rounded font-bold font-mono ${
                        r.risk_level === 'HIGH'
                          ? 'bg-rose-950 text-rose-300'
                          : r.risk_level === 'WATCH'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-emerald-950 text-emerald-300'
                      }`}
                    >
                      {r.risk_level}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {r.needs_expert_review ? (
                      <span className="text-rose-400 font-bold text-[10.5px]">
                        Officer Assigned
                      </span>
                    ) : (
                      <span className="text-gray-500 text-[10.5px]">
                        None Required
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
