import React, { useState, useMemo } from 'react';
import {
  CloudSun,
  CloudRain,
  SunMedium,
  Wind,
  Droplets,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  MapPin,
  Calendar,
  Send,
  ShieldAlert,
  Thermometer,
  CloudLightning,
  Sparkles,
} from 'lucide-react';
import { usePolling } from '../hooks/usePolling';

interface DistrictForecast {
  day: string;
  date: string;
  tempMax: number;
  tempMin: number;
  condition: 'sunny' | 'partly-cloudy' | 'rain' | 'heavy-rain' | 'thunderstorm';
  rainMm: number;
  rainProb: number;
  humidity: number;
  windKmh: number;
  advisory: string;
}

const DISTRICT_WEATHER_DATA: Record<
  string,
  {
    province: string;
    droughtIndex: 'LOW' | 'WATCH' | 'HIGH';
    floodRisk: 'LOW' | 'WATCH' | 'ALERT';
    heatStress: 'LOW' | 'MODERATE' | 'HIGH';
    soilMoistureStatus: string;
    seasonSummary: string;
    forecast: DistrictForecast[];
    alerts: {
      type: 'drought' | 'flood' | 'heat' | 'pest';
      level: 'CRITICAL' | 'WARNING' | 'ADVISORY';
      title: string;
      description: string;
      action: string;
    }[];
  }
> = {
  Lukulu: {
    province: 'Western',
    droughtIndex: 'WATCH',
    floodRisk: 'ALERT',
    heatStress: 'MODERATE',
    soilMoistureStatus: 'Saturated (Flooding risk along Zambezi & Luena floodplains)',
    seasonSummary: 'Heavy upstream precipitation causing rising river levels. Low-lying rice plots at risk of inundation.',
    alerts: [
      {
        type: 'flood',
        level: 'CRITICAL',
        title: 'Flash Flood & River Inundation Alert',
        description: 'Luena and Zambezi floodplains expected to swell by +1.4m over the next 48 hours following upper-catchment downpours.',
        action: 'Harvest early maturing lowland rice immediately; move harvested bags to high-ground depots (Lukulu District Coop or Lukulu FRA).',
      },
      {
        type: 'pest',
        level: 'ADVISORY',
        title: 'Stem Borer & Fungal Pressure',
        description: 'Persistent humidity above 82% increases blast pressure in wet cassava and paddy rice nurseries.',
        action: 'Ensure ridge drainage channels are unblocked to avoid stagnant ponding around cassava roots.',
      },
    ],
    forecast: [
      { day: 'Today', date: 'Sep 23', tempMax: 29, tempMin: 19, condition: 'heavy-rain', rainMm: 38, rainProb: 90, humidity: 86, windKmh: 14, advisory: 'Do not spray pesticides; heavy wash-off expected.' },
      { day: 'Tomorrow', date: 'Sep 24', tempMax: 28, tempMin: 18, condition: 'rain', rainMm: 22, rainProb: 75, humidity: 82, windKmh: 12, advisory: 'Clear furrows and reinforce storage tarpaulins.' },
      { day: 'Wed', date: 'Sep 25', tempMax: 30, tempMin: 18, condition: 'partly-cloudy', rainMm: 4, rainProb: 35, humidity: 72, windKmh: 10, advisory: 'Optimal window for weeding high-ground plots.' },
      { day: 'Thu', date: 'Sep 26', tempMax: 31, tempMin: 19, condition: 'sunny', rainMm: 0, rainProb: 10, humidity: 65, windKmh: 11, advisory: 'Sun-dry grain at collection points.' },
      { day: 'Fri', date: 'Sep 27', tempMax: 32, tempMin: 20, condition: 'sunny', rainMm: 0, rainProb: 15, humidity: 62, windKmh: 13, advisory: 'Check soil moisture at 30cm depth.' },
    ],
  },
  Chipata: {
    province: 'Eastern',
    droughtIndex: 'LOW',
    floodRisk: 'LOW',
    heatStress: 'LOW',
    soilMoistureStatus: 'Optimal (32% moisture @ 30cm depth across Msekera)',
    seasonSummary: 'Favorable agro-climatic conditions for maize grain filling and groundnut pod development.',
    alerts: [
      {
        type: 'pest',
        level: 'WARNING',
        title: 'Fall Armyworm Vector Window',
        description: 'Intermittent afternoon showers followed by warm sunshine create ideal egg-laying conditions in late-planted maize.',
        action: 'Scout whorls of maize; apply Neem extract or approved biocontrols if threshold exceeds 5% of stand.',
      },
    ],
    forecast: [
      { day: 'Today', date: 'Sep 23', tempMax: 27, tempMin: 16, condition: 'partly-cloudy', rainMm: 2, rainProb: 25, humidity: 68, windKmh: 10, advisory: 'Favorable field inspection weather.' },
      { day: 'Tomorrow', date: 'Sep 24', tempMax: 28, tempMin: 17, condition: 'partly-cloudy', rainMm: 6, rainProb: 40, humidity: 70, windKmh: 12, advisory: 'Good conditions for foliar spray.' },
      { day: 'Wed', date: 'Sep 25', tempMax: 27, tempMin: 16, condition: 'rain', rainMm: 14, rainProb: 65, humidity: 76, windKmh: 15, advisory: 'Rainfall beneficial for late maize.' },
      { day: 'Thu', date: 'Sep 26', tempMax: 26, tempMin: 15, condition: 'partly-cloudy', rainMm: 3, rainProb: 30, humidity: 71, windKmh: 11, advisory: 'Monitor for Northern Corn Leaf Blight.' },
      { day: 'Fri', date: 'Sep 27', tempMax: 29, tempMin: 17, condition: 'sunny', rainMm: 0, rainProb: 10, humidity: 64, windKmh: 9, advisory: 'Check grain moisture in on-farm cribs.' },
    ],
  },
  Choma: {
    province: 'Southern',
    droughtIndex: 'HIGH',
    floodRisk: 'LOW',
    heatStress: 'HIGH',
    soilMoistureStatus: 'Deficit (18% moisture @ 30cm depth — critical wilting margin)',
    seasonSummary: 'Extended 14-day dry spell across the southern plateau. Drought-tolerant practices essential.',
    alerts: [
      {
        type: 'drought',
        level: 'CRITICAL',
        title: 'Severe Agricultural Drought Warning',
        description: 'Persistent low rainfall anomaly with no significant precipitation modeled for the next 10 days. Crop water stress elevated.',
        action: 'Mulch aggressively around maize stalks; irrigate during night/early morning; prioritize drought-hardy sorghum/millet.',
      },
      {
        type: 'heat',
        level: 'WARNING',
        title: 'High Heat Wave Stress (>34°C)',
        description: 'Daytime temperatures exceeding 34°C during peak tasseling will cause pollen desiccation.',
        action: 'Avoid mid-day chemical spraying. Conserve ground cover moisture.',
      },
    ],
    forecast: [
      { day: 'Today', date: 'Sep 23', tempMax: 34, tempMin: 20, condition: 'sunny', rainMm: 0, rainProb: 5, humidity: 38, windKmh: 18, advisory: 'Severe moisture loss. Apply mulch immediately.' },
      { day: 'Tomorrow', date: 'Sep 24', tempMax: 35, tempMin: 21, condition: 'sunny', rainMm: 0, rainProb: 5, humidity: 35, windKmh: 20, advisory: 'High evaporative demand.' },
      { day: 'Wed', date: 'Sep 25', tempMax: 33, tempMin: 19, condition: 'partly-cloudy', rainMm: 1, rainProb: 15, humidity: 42, windKmh: 16, advisory: 'Scout for stalk borer signs.' },
      { day: 'Thu', date: 'Sep 26', tempMax: 34, tempMin: 20, condition: 'sunny', rainMm: 0, rainProb: 10, humidity: 40, windKmh: 14, advisory: 'Preserve groundwater pump resources.' },
      { day: 'Fri', date: 'Sep 27', tempMax: 36, tempMin: 22, condition: 'sunny', rainMm: 0, rainProb: 5, humidity: 33, windKmh: 17, advisory: 'Prepare shade shelters for young livestock.' },
    ],
  },
  Chongwe: {
    province: 'Lusaka',
    droughtIndex: 'WATCH',
    floodRisk: 'LOW',
    heatStress: 'MODERATE',
    soilMoistureStatus: 'Moderate (27% moisture @ 30cm depth)',
    seasonSummary: 'Normal to slightly below-normal rainfall. Timely weeding and fertilizer maintenance recommended.',
    alerts: [
      {
        type: 'pest',
        level: 'ADVISORY',
        title: 'Moderate Aphid and Hopper Activity',
        description: 'Warmer dry spells between light showers encourage aphid colonies on horticultural beds and young legumes.',
        action: 'Apply yellow sticky traps and inspect leaf undersides.',
      },
    ],
    forecast: [
      { day: 'Today', date: 'Sep 23', tempMax: 29, tempMin: 17, condition: 'partly-cloudy', rainMm: 3, rainProb: 30, humidity: 58, windKmh: 13, advisory: 'Favorable for top-dressing fertilizer.' },
      { day: 'Tomorrow', date: 'Sep 24', tempMax: 30, tempMin: 18, condition: 'partly-cloudy', rainMm: 8, rainProb: 55, humidity: 64, windKmh: 14, advisory: 'Good light rain for soil absorption.' },
      { day: 'Wed', date: 'Sep 25', tempMax: 28, tempMin: 17, condition: 'rain', rainMm: 12, rainProb: 65, humidity: 70, windKmh: 12, advisory: 'Do not drive heavy equipment on wet field.' },
      { day: 'Thu', date: 'Sep 26', tempMax: 29, tempMin: 16, condition: 'sunny', rainMm: 0, rainProb: 10, humidity: 55, windKmh: 11, advisory: 'Inspect maize fields for weed emergence.' },
      { day: 'Fri', date: 'Sep 27', tempMax: 31, tempMin: 18, condition: 'sunny', rainMm: 0, rainProb: 5, humidity: 50, windKmh: 10, advisory: 'Check grain moisture at Chongwe bulking shed.' },
    ],
  },
  Mkushi: {
    province: 'Central',
    droughtIndex: 'LOW',
    floodRisk: 'LOW',
    heatStress: 'LOW',
    soilMoistureStatus: 'Optimal (35% moisture @ 30cm depth)',
    seasonSummary: 'Commercial farming block telemetry indicates strong grain fill stage with balanced precipitation.',
    alerts: [
      {
        type: 'pest',
        level: 'ADVISORY',
        title: 'Fungal Rust Warning for Soybeans',
        description: 'Morning dew combined with high relative humidity (>75%) requires preventive rust inspection.',
        action: 'Spray prophylactic triazole fungicide if soybean rust pustules detected on lower leaves.',
      },
    ],
    forecast: [
      { day: 'Today', date: 'Sep 23', tempMax: 28, tempMin: 16, condition: 'partly-cloudy', rainMm: 5, rainProb: 40, humidity: 70, windKmh: 11, advisory: 'Optimal condition for center pivot monitoring.' },
      { day: 'Tomorrow', date: 'Sep 24', tempMax: 27, tempMin: 16, condition: 'rain', rainMm: 18, rainProb: 75, humidity: 78, windKmh: 15, advisory: 'Irrigation can be paused for 48 hours.' },
      { day: 'Wed', date: 'Sep 25', tempMax: 26, tempMin: 15, condition: 'rain', rainMm: 10, rainProb: 60, humidity: 75, windKmh: 12, advisory: 'Check soil drainage in low spots.' },
      { day: 'Thu', date: 'Sep 26', tempMax: 28, tempMin: 16, condition: 'partly-cloudy', rainMm: 2, rainProb: 20, humidity: 65, windKmh: 10, advisory: 'Resume scouting operations.' },
      { day: 'Fri', date: 'Sep 27', tempMax: 30, tempMin: 17, condition: 'sunny', rainMm: 0, rainProb: 5, humidity: 58, windKmh: 9, advisory: 'Full field mobility restored.' },
    ],
  },
};

export const ClimateAlerts: React.FC = () => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Lukulu');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const currentData = useMemo(() => {
    return (
      DISTRICT_WEATHER_DATA[selectedDistrict] ||
      DISTRICT_WEATHER_DATA['Lukulu']
    );
  }, [selectedDistrict]);

  const handleBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 4000);
  };

  const getConditionIcon = (cond: string) => {
    switch (cond) {
      case 'heavy-rain':
      case 'thunderstorm':
        return <CloudLightning className="w-5 h-5 text-indigo-400" />;
      case 'rain':
        return <CloudRain className="w-5 h-5 text-blue-400" />;
      case 'partly-cloudy':
        return <CloudSun className="w-5 h-5 text-amber-300" />;
      case 'sunny':
      default:
        return <SunMedium className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                <CloudSun className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Agro-Climate Intelligence & Weather Risk Radar
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              District-level microclimate predictions, drought and flood early warnings, and automated agronomic
              action plans for Zambian smallholder farmers.
            </p>
          </div>

          {/* District Selector & Action */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[#142318] border border-[#233a27] rounded-xl px-3 py-1.5 text-xs">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-gray-400">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent text-emerald-300 font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="Lukulu" className="bg-[#101b13] text-white">Lukulu (Western · Flood Watch)</option>
                <option value="Chipata" className="bg-[#101b13] text-white">Chipata (Eastern · Msekera Hub)</option>
                <option value="Choma" className="bg-[#101b13] text-white">Choma (Southern · Drought Alert)</option>
                <option value="Chongwe" className="bg-[#101b13] text-white">Chongwe (Lusaka · Basin Hub)</option>
                <option value="Mkushi" className="bg-[#101b13] text-white">Mkushi (Central · Commercial)</option>
              </select>
            </div>

            <button
              onClick={handleBroadcast}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast SMS Warning</span>
            </button>
          </div>
        </div>

        {broadcastSent && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-600 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Weather risk bulletin dispatched via 2G SMS to 52 registered farmers in <b>{selectedDistrict} District</b>.
            </span>
          </div>
        )}
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Flood Risk */}
        <div className="bg-[#101b13] border border-[#1e3623] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Flood Inundation Risk</div>
            <div className={`text-lg font-extrabold mt-1 ${
              currentData.floodRisk === 'ALERT' ? 'text-rose-400' : currentData.floodRisk === 'WATCH' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {currentData.floodRisk}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">Catchment runoff model</div>
          </div>
          <div className={`p-2.5 rounded-xl border ${
            currentData.floodRisk === 'ALERT' ? 'bg-rose-950/50 border-rose-800 text-rose-400' : 'bg-emerald-950/50 border-emerald-800 text-emerald-400'
          }`}>
            <Droplets className="w-5 h-5" />
          </div>
        </div>

        {/* Drought Risk */}
        <div className="bg-[#101b13] border border-[#1e3623] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Drought Index</div>
            <div className={`text-lg font-extrabold mt-1 ${
              currentData.droughtIndex === 'HIGH' ? 'text-rose-400' : currentData.droughtIndex === 'WATCH' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {currentData.droughtIndex}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">14-day dry spell forecast</div>
          </div>
          <div className={`p-2.5 rounded-xl border ${
            currentData.droughtIndex === 'HIGH' ? 'bg-rose-950/50 border-rose-800 text-rose-400' : 'bg-amber-950/50 border-amber-800 text-amber-400'
          }`}>
            <SunMedium className="w-5 h-5" />
          </div>
        </div>

        {/* Heat Stress */}
        <div className="bg-[#101b13] border border-[#1e3623] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Heat Stress Level</div>
            <div className={`text-lg font-extrabold mt-1 ${
              currentData.heatStress === 'HIGH' ? 'text-rose-400' : currentData.heatStress === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {currentData.heatStress}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">Crop anthesis index</div>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-950/50 border border-orange-800 text-orange-400">
            <Thermometer className="w-5 h-5" />
          </div>
        </div>

        {/* Soil Moisture */}
        <div className="bg-[#101b13] border border-[#1e3623] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Soil Profile Status</div>
            <div className="text-sm font-bold text-emerald-300 mt-1 line-clamp-1">
              {currentData.soilMoistureStatus.split('(')[0]}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">SDI-12 probe network</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Impending Risks Banner List */}
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Active Impending Climate &amp; Weather Risks · {selectedDistrict} District</span>
          </h2>
          <span className="text-[11px] font-mono text-gray-400">
            Source: Zambian Meteorological Dept &amp; MundaSense LoRaWAN Network
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {currentData.alerts.map((alert, idx) => {
            const isCritical = alert.level === 'CRITICAL';
            const isWarning = alert.level === 'WARNING';
            const borderColor = isCritical ? 'border-rose-700/80 bg-rose-950/20' : isWarning ? 'border-amber-700/80 bg-amber-950/20' : 'border-blue-700/80 bg-blue-950/20';
            const badgeColor = isCritical ? 'bg-rose-900/60 text-rose-300 border-rose-700' : isWarning ? 'bg-amber-900/60 text-amber-300 border-amber-700' : 'bg-blue-900/60 text-blue-300 border-blue-700';

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${borderColor} flex flex-col sm:flex-row items-start justify-between gap-4`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${badgeColor}`}>
                      {alert.level}
                    </span>
                    <h3 className="text-sm font-bold text-white">{alert.title}</h3>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{alert.description}</p>
                  <div className="text-xs text-emerald-400 bg-[#0d160f] p-2.5 rounded-lg border border-[#1d3322] mt-2">
                    <span className="font-bold text-white">Recommended Smallholder Action:</span> {alert.action}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5-Day Weather Forecast Strip */}
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>5-Day Local Agronomic Forecast · {selectedDistrict}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Rainfall accumulation, wind drift risks, and field accessibility index
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {currentData.forecast.map((f, i) => (
            <div
              key={i}
              className="bg-[#142318] border border-[#233a27] rounded-xl p-3 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{f.day}</span>
                  <span className="text-[11px] font-mono text-gray-400">{f.date}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {getConditionIcon(f.condition)}
                  <span className="text-base font-extrabold text-white">
                    {f.tempMax}° / <span className="text-gray-400 text-xs font-normal">{f.tempMin}°</span>
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] font-mono border-t border-[#1d3221] pt-2">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-1 text-blue-400">
                    <Droplets className="w-3 h-3" /> Rain:
                  </span>
                  <span>{f.rainMm} mm ({f.rainProb}%)</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-1 text-gray-400">
                    <Wind className="w-3 h-3" /> Wind:
                  </span>
                  <span>{f.windKmh} km/h</span>
                </div>
              </div>

              <div className="text-[11px] text-emerald-300 bg-[#0c140e] p-2 rounded-lg border border-[#1b2d1d] italic">
                "{f.advisory}"
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
