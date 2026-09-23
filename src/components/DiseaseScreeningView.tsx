import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  ShieldAlert,
  UserCheck,
  Info,
  Clock,
  Loader2,
  Image as ImageIcon,
  X,
  RefreshCw,
  Send,
  FlaskConical,
  Leaf,
  DollarSign,
  TrendingDown,
  Shield,
  Activity,
  MapPin,
  CloudSun,
} from 'lucide-react';
import type { DiseaseTreatmentPlan, TreatmentOption } from '../data/treatmentReference';

interface CropItem {
  crop: string;
  diseaseCount: number;
}

interface DiseaseAnalysisResult {
  crop: string;
  prediction: string;
  pathogen: string;
  confidence: number;
  severity: string;
  risk: string;
  stage: string;
  spread_risk: string;
  symptoms: string;
  yield_impact: string;
  immediate_actions: string[];
  treatment_priority: string;
  treatment_reasoning: string;
  needs_expert_review: boolean;
  mode: 'gemini' | 'fallback' | 'error';
  report_id?: number;
  treatment_plan?: DiseaseTreatmentPlan;
  estimated_cost_zmw?: {
    chemical: number;
    organic: number;
    recommended: number;
  };
}

interface StoredReport {
  id: number;
  farm_id: number | null;
  phone: string | null;
  crop: string;
  prediction: string;
  pathogen: string | null;
  confidence: number;
  severity: string | null;
  risk: string | null;
  stage?: string | null;
  spread_risk?: string | null;
  yield_impact?: string | null;
  treatment_priority?: string | null;
  treatment_reasoning?: string | null;
  needs_review: number;
  created_at: string;
}

const ZAMBIAN_PROVINCES = [
  'Eastern',
  'Lusaka',
  'Central',
  'Southern',
  'Copperbelt',
  'Northern',
  'Luapula',
  'North-Western',
  'Muchinga',
  'Western',
];

export function DiseaseScreeningView({ initialFarmId = 14 }: { initialFarmId?: number }) {
  const [farmId, setFarmId] = useState<number>(initialFarmId);
  const [farmHectares, setFarmHectares] = useState<number>(1);
  const [province, setProvince] = useState<string>('Eastern');
  const [weatherNotes, setWeatherNotes] = useState<string>('Warm mornings, intermittent afternoon rain showers, high humidity.');

  const [crops, setCrops] = useState<CropItem[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('Maize');
  const [geminiEnabled, setGeminiEnabled] = useState<boolean>(true);
  const [geminiModel, setGeminiModel] = useState<string>('gemini-2.5-flash');

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<DiseaseAnalysisResult | null>(null);
  const [officerNotified, setOfficerNotified] = useState<boolean>(false);

  const [reports, setReports] = useState<StoredReport[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load crop list from API
  useEffect(() => {
    async function loadCrops() {
      try {
        const res = await fetch('/api/disease/crops');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.crops) && data.crops.length > 0) {
            setCrops(data.crops);
            if (!data.crops.some((c: CropItem) => c.crop === selectedCrop)) {
              setSelectedCrop(data.crops[0].crop);
            }
          }
          if (data.gemini) {
            setGeminiEnabled(Boolean(data.gemini.enabled));
            if (data.gemini.model) setGeminiModel(data.gemini.model);
          }
        }
      } catch (err) {
        console.warn('Could not load crops list from API:', err);
      }
    }
    loadCrops();
  }, []);

  // Load reports list
  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch('/api/disease/reports?limit=25');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.warn('Could not load disease reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // File handling
  const processFile = (file: File) => {
    setValidationError(null);

    if (!file.type.startsWith('image/')) {
      setValidationError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    // 8 MB max
    if (file.size > 8 * 1024 * 1024) {
      setValidationError('Image size exceeds 8 MB limit. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageDataUrl(dataUrl);
      setImageFileName(file.name);
      setResult(null);
      setOfficerNotified(false);
    };
    reader.onerror = () => {
      setValidationError('Failed to read image file. Please try another photo.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const clearImage = () => {
    setImageDataUrl(null);
    setImageFileName('');
    setValidationError(null);
  };

  // Run AI Screening
  const handleAnalyze = async () => {
    if (!imageDataUrl || isAnalyzing) return;

    setIsAnalyzing(true);
    setValidationError(null);
    setOfficerNotified(false);

    try {
      const farmContext = `Farm #${farmId} (${farmHectares} ha plot in ${province} Province, smallholder cooperative)`;
      const res = await fetch('/api/disease/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_data: imageDataUrl,
          crop: selectedCrop,
          farm_id: farmId,
          farm_context: farmContext,
          weather_context: weatherNotes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `Server returned ${res.status}`);
      }

      const data: DiseaseAnalysisResult = await res.json();
      setResult(data);
      loadReports();
    } catch (err: any) {
      console.error('Screening failed:', err);
      setValidationError(`AI screening failed: ${err.message}. Check network connection and retry.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Escalate to extension officer
  const handleNotifyOfficer = async () => {
    setOfficerNotified(true);
    try {
      await fetch('/sms/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          from: '+260974684713',
          text: `DISEASE ALERT: Farm #${farmId} (${province}, ${farmHectares}ha) flagged ${result?.prediction} (${result?.severity}, stage: ${result?.stage}). Requesting field inspection.`,
        }).toString(),
      });
    } catch (e) {
      console.warn('Could not post webhook for officer alert:', e);
    }
  };

  const plan = result?.treatment_plan;
  const scaledChemicalCost = (result?.estimated_cost_zmw?.chemical || 0) * farmHectares;
  const scaledOrganicCost = (result?.estimated_cost_zmw?.organic || 0) * farmHectares;

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                AI Crop Disease Screening & Treatment Planner
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Agronomy diagnostics powered by <strong className="text-emerald-300">Gemini 2.5 Flash</strong>.
              Delivers prescription-grade chemical & organic treatment protocols with local Zambian dosages,
              depot availability, and ZMW cost models.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-[#152718] border border-[#234329] text-xs font-mono">
              <span className="text-gray-400">Pathology Engine: </span>
              {geminiEnabled ? (
                <span className="text-emerald-400 font-semibold">{geminiModel}</span>
              ) : (
                <span className="text-amber-400 font-semibold">Rule-Based Fallback</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Controls + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Upload (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              Leaf Photo & Parameters
            </h2>

            {/* Farm ID & Crop Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                  Farm ID
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={farmId}
                  onChange={(e) => setFarmId(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                  Crop Type
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {crops.length > 0 ? (
                    crops.map((c) => (
                      <option key={c.crop} value={c.crop}>
                        {c.crop} ({c.diseaseCount} diseases)
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Maize">Maize (7 diseases)</option>
                      <option value="Groundnuts">Groundnuts (5 diseases)</option>
                      <option value="Soybeans">Soybeans (4 diseases)</option>
                      <option value="Tomato">Tomato (6 diseases)</option>
                      <option value="Cassava">Cassava (4 diseases)</option>
                      <option value="Cotton">Cotton (4 diseases)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Farm Details: Hectares & Province */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#1e3623]">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                  Plot Size (Hectares)
                </label>
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  max="50"
                  value={farmHectares}
                  onChange={(e) => setFarmHectares(Math.max(0.1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                  Province
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {ZAMBIAN_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p} Province
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Weather Notes */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1 flex items-center gap-1">
                <CloudSun className="w-3.5 h-3.5 text-emerald-400" />
                Weather & Moisture Context
              </label>
              <textarea
                rows={2}
                value={weatherNotes}
                onChange={(e) => setWeatherNotes(e.target.value)}
                placeholder="Recent rain, temperature, or canopy moisture notes..."
                className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Upload Zone */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1.5">
                Plant or Leaf Photo
              </label>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!imageDataUrl ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
                    isDragging
                      ? 'border-emerald-400 bg-emerald-950/30'
                      : 'border-[#244229] hover:border-emerald-600 bg-[#142317]'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-white">
                    Drag and drop leaf photo here, or click to browse
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 font-mono">
                    Supports JPEG, PNG, WebP up to 8 MB
                  </p>

                  <div className="flex items-center justify-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3 py-1.5 bg-[#1a311f] hover:bg-[#25462c] text-emerald-300 border border-[#2e5636] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Take Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-[#1a311f] hover:bg-[#25462c] text-emerald-300 border border-[#2e5636] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Choose File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-[#244229] bg-[#0c160f] p-2">
                  <div className="relative aspect-video max-h-64 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                    <img
                      src={imageDataUrl}
                      alt="Selected Leaf"
                      className="max-h-64 w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2 px-1 text-[11px] font-mono text-gray-400">
                    <span className="truncate max-w-[200px]">{imageFileName || 'Selected leaf image'}</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                    >
                      Replace
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!imageDataUrl || isAnalyzing}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Screening Leaf & Formulating Treatment…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run AI Screening & Generate Treatment Plan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Results Panel (7 cols) */}
        <div className="lg:col-span-7">
          {isAnalyzing ? (
            <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-12 text-center h-full min-h-[380px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-950 border-t-emerald-400 animate-spin mb-4" />
              <h3 className="text-base font-bold text-white mb-1">
                Analyzing Foliar Morphology…
              </h3>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                Gemini 2.5 Flash is inspecting chlorotic margins, pustules, necrotic lesions, and stage progression
                for {selectedCrop} in {province} Province.
              </p>
            </div>
          ) : result ? (
            <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl space-y-5">
              {/* 1. Header — prediction, pathogen, mode badge, stage badge, risk badge */}
              <div className="space-y-3 pb-4 border-b border-[#1e3623]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      REPORT #{result.report_id || 'PENDING'}
                    </span>
                    <span className="text-xs text-gray-500">·</span>
                    <span className="text-xs text-gray-400 font-mono">
                      Farm #{farmId} ({farmHectares} ha · {province})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Stage Badge */}
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-950/80 text-blue-300 border border-blue-700">
                      Stage: {result.stage}
                    </span>
                    {/* Mode Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        result.mode === 'gemini'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                          : 'bg-amber-950/80 text-amber-300 border-amber-700'
                      }`}
                    >
                      {result.mode === 'gemini' ? 'Gemini 2.5 Flash' : 'Rule-Based Fallback'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-mono">
                      Screening Result · {result.crop}
                    </div>
                    <h3 className="text-xl font-bold text-white mt-0.5">{result.prediction}</h3>
                    {result.pathogen && result.pathogen !== 'Unknown' && (
                      <p className="text-xs text-emerald-400/90 italic font-mono mt-0.5">
                        Pathogen: {result.pathogen}
                      </p>
                    )}
                  </div>

                  {/* Risk Badge */}
                  <div>
                    {result.risk === 'HIGH' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-300 font-mono font-bold text-xs">
                        <AlertOctagon className="w-4 h-4 text-rose-400" />
                        HIGH RISK
                      </span>
                    ) : result.risk === 'WATCH' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-700 text-amber-300 font-mono font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        WATCH RISK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-mono font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        LOW RISK
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Metrics Row — confidence, severity, spread risk, yield impact */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-[#142317] border border-[#223e28]">
                {/* Confidence */}
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Confidence</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                    {(result.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="w-full h-1.5 bg-[#0c160f] rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.max(5, result.confidence * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Severity */}
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Severity</div>
                  <div className="text-sm font-mono font-bold uppercase text-white mt-0.5 flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        result.severity === 'critical' || result.severity === 'high'
                          ? 'bg-rose-500'
                          : result.severity === 'moderate'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    {result.severity}
                  </div>
                </div>

                {/* Spread Risk */}
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-mono">7-Day Spread Risk</div>
                  <div className="text-sm font-mono font-bold uppercase text-amber-300 mt-0.5">
                    {result.spread_risk}
                  </div>
                </div>

                {/* Yield Impact */}
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Untreated Loss</div>
                  <div className="text-sm font-mono font-bold text-rose-300 mt-0.5 truncate">
                    {result.yield_impact}
                  </div>
                </div>
              </div>

              {/* Visible Symptoms */}
              <div className="p-3.5 rounded-xl bg-[#142317] border border-[#223e28] text-xs">
                <div className="font-bold text-gray-300 font-mono uppercase text-[11px] mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-400" />
                  Visible Symptoms
                </div>
                <p className="text-gray-200 leading-relaxed">{result.symptoms}</p>
              </div>

              {/* 3. Immediate Actions Checklist (Numbered List) */}
              <div className="p-3.5 rounded-xl bg-[#142317] border border-[#223e28] text-xs space-y-2">
                <div className="font-bold text-emerald-300 font-mono uppercase text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Immediate Actions Required Today
                </div>
                <div className="space-y-1.5">
                  {result.immediate_actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-gray-200 leading-snug">{action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Treatment Plan Tables (Chemical & Organic) */}
              {plan && (
                <div className="space-y-4">
                  {/* Chemical Options */}
                  <div className="p-3.5 rounded-xl bg-[#142317] border border-[#223e28] text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white font-mono uppercase text-[11px] flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                        Chemical Control Options (Depot Registered)
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">Per 1-Hectare Plot</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400 border-b border-[#223d27] text-[11px]">
                            <th className="text-left py-2">Product</th>
                            <th className="text-left py-2">Dose/ha</th>
                            <th className="text-left py-2">Interval</th>
                            <th className="text-left py-2">PHI</th>
                            <th className="text-left py-2">Availability</th>
                            <th className="text-right py-2">Cost/ha</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a2d1f]">
                          {plan.chemicalOptions.map((opt, i) => (
                            <tr key={i} className="hover:bg-[#18291c] transition">
                              <td className="py-2.5 pr-2">
                                <div className="font-bold text-white">{opt.product}</div>
                                <div className="text-[10px] text-gray-400 font-mono">{opt.activeIngredient}</div>
                              </td>
                              <td className="py-2.5 pr-2 text-gray-200">{opt.dosePerHectare}</td>
                              <td className="py-2.5 pr-2 text-gray-300 text-[11px]">{opt.interval}</td>
                              <td className="py-2.5 pr-2 text-amber-300 font-mono text-[11px]">{opt.phi} days</td>
                              <td className="py-2.5 pr-2 text-gray-300 text-[11px]">{opt.availability}</td>
                              <td className="py-2.5 text-right text-emerald-300 font-mono font-bold whitespace-nowrap">
                                ZMW {opt.estimatedCostZMW}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Organic Options */}
                  <div className="p-3.5 rounded-xl bg-[#142317] border border-[#223e28] text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-emerald-300 font-mono uppercase text-[11px] flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                        Organic & Low-Cost Alternatives
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">Zero Residue / Eco-Friendly</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400 border-b border-[#223d27] text-[11px]">
                            <th className="text-left py-2">Option</th>
                            <th className="text-left py-2">Dose / Preparation</th>
                            <th className="text-left py-2">Interval</th>
                            <th className="text-left py-2">PHI</th>
                            <th className="text-left py-2">Source</th>
                            <th className="text-right py-2">Cost/ha</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a2d1f]">
                          {plan.organicOptions.map((opt, i) => (
                            <tr key={i} className="hover:bg-[#18291c] transition">
                              <td className="py-2.5 pr-2">
                                <div className="font-bold text-emerald-200">{opt.product}</div>
                                <div className="text-[10px] text-gray-400 font-mono">{opt.activeIngredient}</div>
                              </td>
                              <td className="py-2.5 pr-2 text-gray-200">{opt.dosePerHectare}</td>
                              <td className="py-2.5 pr-2 text-gray-300 text-[11px]">{opt.interval}</td>
                              <td className="py-2.5 pr-2 text-emerald-400 font-mono text-[11px]">{opt.phi} days</td>
                              <td className="py-2.5 pr-2 text-gray-300 text-[11px]">{opt.availability}</td>
                              <td className="py-2.5 text-right text-emerald-300 font-mono font-bold whitespace-nowrap">
                                ZMW {opt.estimatedCostZMW}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cultural Controls & Prevention Bullets */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#142317] border border-[#223e28] text-xs space-y-2">
                      <div className="font-bold text-gray-300 font-mono uppercase text-[11px] flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        Cultural Field Management
                      </div>
                      <ul className="space-y-1 text-gray-300 list-disc list-inside">
                        {plan.culturalControls.map((c, i) => (
                          <li key={i} className="leading-snug">{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#142317] border border-[#223e28] text-xs space-y-2">
                      <div className="font-bold text-gray-300 font-mono uppercase text-[11px] flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        Next-Season Prevention
                      </div>
                      <ul className="space-y-1 text-gray-300 list-disc list-inside">
                        {plan.prevention.map((p, i) => (
                          <li key={i} className="leading-snug">{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Cost Summary Card (Chemical vs Organic scaled to farmHectares) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#122415] to-[#162b1a] border border-[#27492c] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white font-mono uppercase text-[11px] flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Estimated Treatment Cost For {farmHectares} Hectare{farmHectares > 1 ? 's' : ''}
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">Zambian Kwacha (ZMW)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-[#0e1b11] border border-[#1b3420]">
                    <div className="text-[10px] text-gray-400 uppercase font-mono">Organic Protocol</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      ZMW {scaledOrganicCost.toFixed(0)}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Low-cost / homemade inputs with zero chemical residue risk.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0e1b11] border border-[#1b3420]">
                    <div className="text-[10px] text-gray-400 uppercase font-mono">Chemical Protocol</div>
                    <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
                      ZMW {scaledChemicalCost.toFixed(0)}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Targeted depot fungicide/insecticide for rapid disease arrest.
                    </p>
                  </div>
                </div>
              </div>

              {/* 6. Economic Threshold & Yield Loss Card */}
              {plan && (
                <div className="p-3.5 rounded-xl bg-[#142317] border border-[#223e28] text-xs space-y-2">
                  <div className="font-bold text-gray-300 font-mono uppercase text-[11px] flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                    Economic Threshold & Agronomic Advice
                  </div>
                  <p className="text-gray-200">
                    <strong className="text-amber-300">Action Threshold:</strong> {plan.economicThreshold}
                  </p>
                  <p className="text-gray-300">
                    <strong className="text-rose-300">Potential Yield Loss:</strong> {plan.yieldLossIfUntreated}
                  </p>
                </div>
              )}

              {/* 7. Escalation Alert & CTA */}
              {result.needs_expert_review ? (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-200 block">
                        Extension Officer Escalation Recommended
                      </span>
                      <span className="text-amber-300/80">
                        {result.confidence < 0.75
                          ? 'Confidence below 75% threshold — physical verification advised.'
                          : 'High severity or advanced stage warrants rapid containment inspection.'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNotifyOfficer}
                    disabled={officerNotified}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-emerald-800 text-white font-bold text-xs whitespace-nowrap flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {officerNotified ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        Officer Notified
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Notify Officer
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/60 text-xs flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Routine Monitoring: Pathology severity is within manageable baseline.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-12 text-center h-full min-h-[380px] flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-[#152418] border border-[#233f28] flex items-center justify-center text-emerald-500 mb-3">
                <ImageIcon className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">No Screening Yet</h3>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                Capture or select a clear photo of an affected leaf, enter your farm plot size and province,
                then click <strong className="text-emerald-400">Run AI Screening</strong> to generate an
                actionable treatment prescription.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Screening Records Table */}
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Recent Screening Records ({reports.length})
            </h2>
            <p className="text-xs text-gray-400">
              Audit log of plant health screenings recorded in SQLite with staging & treatment tags.
            </p>
          </div>

          <button
            type="button"
            onClick={loadReports}
            disabled={loadingReports}
            className="px-3 py-1.5 bg-[#152418] hover:bg-[#1d3322] text-emerald-300 border border-[#233f28] rounded-xl text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingReports ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1e3623]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#142317] text-gray-400 uppercase text-[10px] border-b border-[#1e3623]">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Farm</th>
                <th className="py-2.5 px-3">Crop</th>
                <th className="py-2.5 px-3">Prediction</th>
                <th className="py-2.5 px-3">Pathogen</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Stage</th>
                <th className="py-2.5 px-3">Risk</th>
                <th className="py-2.5 px-3">Escalation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#18291c] text-gray-200">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-gray-500 italic">
                    No screening records found in database yet. Run your first screening above.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-[#152418] transition">
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">#{r.id}</td>
                    <td className="py-2.5 px-3 text-gray-400 text-[11px]">
                      {new Date(r.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-gray-300">#{r.farm_id || '—'}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{r.crop}</td>
                    <td className="py-2.5 px-3 text-emerald-300 max-w-[180px] truncate">
                      {r.prediction}
                    </td>
                    <td className="py-2.5 px-3 text-gray-400 italic max-w-[140px] truncate">
                      {r.pathogen || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-bold">
                      {(r.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-3 uppercase text-[10.5px]">
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          r.severity === 'critical' || r.severity === 'high'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : r.severity === 'moderate'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {r.severity || 'normal'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 uppercase text-[10.5px]">
                      <span className="text-gray-300 font-mono">{r.stage || '—'}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold">
                      <span
                        className={`${
                          r.risk === 'HIGH'
                            ? 'text-rose-400'
                            : r.risk === 'WATCH'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {r.risk || 'LOW'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {r.needs_review ? (
                        <span className="text-amber-400 flex items-center gap-1 font-semibold">
                          <AlertTriangle className="w-3 h-3" /> Flagged
                        </span>
                      ) : (
                        <span className="text-gray-500">Routine</span>
                      )}
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
