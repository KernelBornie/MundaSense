import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Radio, X, Send, CloudRain, Sun, Droplets, Check } from 'lucide-react';

interface SensorPacketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SensorPacketModal: React.FC<SensorPacketModalProps> = ({ isOpen, onClose }) => {
  const { pushSensorReading, runWeatherEvent } = useApp();
  const [selectedHub, setSelectedHub] = useState<number>(1);
  const [soil15, setSoil15] = useState(24.5);
  const [soil30, setSoil30] = useState(27.8);
  const [soil60, setSoil60] = useState(31.2);
  const [temperature, setTemperature] = useState(27.4);
  const [humidity, setHumidity] = useState(78.2);
  const [rainfall, setRainfall] = useState(4.2);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSend = () => {
    pushSensorReading(selectedHub, {
      soil_moisture_15cm: soil15,
      soil_moisture_30cm: soil30,
      soil_moisture_60cm: soil60,
      temperature,
      humidity,
      rainfall,
    });
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 1200);
  };

  const applyPreset = (type: 'rain' | 'drought' | 'normal') => {
    if (type === 'rain') {
      setSoil15(36.0);
      setSoil30(38.5);
      setSoil60(41.0);
      setTemperature(23.0);
      setHumidity(89.0);
      setRainfall(14.5);
      runWeatherEvent('rain');
    } else if (type === 'drought') {
      setSoil15(13.5);
      setSoil30(17.2);
      setSoil60(22.0);
      setTemperature(33.0);
      setHumidity(32.0);
      setRainfall(0);
      runWeatherEvent('drought');
    } else {
      setSoil15(25.0);
      setSoil30(28.5);
      setSoil60(32.0);
      setTemperature(27.0);
      setHumidity(75.0);
      setRainfall(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111e15] border-2 border-emerald-600/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 px-5 py-3.5 flex items-center justify-between text-white border-b border-[#233d28]">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-300" />
            <span className="font-bold text-sm tracking-tight">
              Inject ESP32 Sensor Telemetry Packet
            </span>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-gray-300 leading-relaxed text-[11.5px]">
            Simulates an incoming HTTP POST / LoRaWAN packet from the ESP32 field hub. Watch how connected farms adjust soil moisture and disease risk in real time.
          </p>

          {/* Hub selection */}
          <div>
            <label className="text-[11px] text-gray-400 block font-medium mb-1">
              Target IoT Sensor Hub:
            </label>
            <select
              value={selectedHub}
              onChange={(e) => setSelectedHub(parseInt(e.target.value, 10))}
              className="w-full bg-[#16271a] border border-[#26412b] rounded-lg px-3 py-2 text-xs text-emerald-300 font-semibold focus:outline-none"
            >
              <option value={1}>HUB-MSEK-001 (Chipata, Eastern Province)</option>
              <option value={2}>HUB-CHONG-002 (Chongwe, Lusaka Province)</option>
              <option value={3}>HUB-MKUS-003 (Mkushi, Central Province)</option>
            </select>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium text-[11px]">Presets:</span>
            <button
              onClick={() => applyPreset('rain')}
              className="px-2.5 py-1 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded-md flex items-center gap-1 font-semibold"
            >
              <CloudRain className="w-3 h-3" /> Heavy Rain (High Risk)
            </button>
            <button
              onClick={() => applyPreset('drought')}
              className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-md flex items-center gap-1 font-semibold"
            >
              <Sun className="w-3 h-3" /> Dry Spell (Low Soil)
            </button>
          </div>

          {/* Telemetry Sliders */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#152518] rounded-xl border border-[#233f28]">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-400">Soil 30cm (Root)</span>
                <span className="font-mono font-bold text-emerald-400">{soil30}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="65"
                step="0.5"
                value={soil30}
                onChange={(e) => setSoil30(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-400">Relative Humidity</span>
                <span className="font-mono font-bold text-emerald-400">{humidity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="98"
                step="0.5"
                value={humidity}
                onChange={(e) => setHumidity(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-400">Air Temperature</span>
                <span className="font-mono font-bold text-emerald-400">{temperature}°C</span>
              </div>
              <input
                type="range"
                min="16"
                max="42"
                step="0.5"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-400">Rainfall (24h)</span>
                <span className="font-mono font-bold text-emerald-400">{rainfall} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="0.5"
                value={rainfall}
                onChange={(e) => setRainfall(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* JSON Payload Preview */}
          <div className="bg-[#0b140d] p-3 rounded-lg border border-[#1b311f] font-mono text-[10px] text-emerald-400/90 leading-relaxed overflow-x-auto">
            {JSON.stringify(
              {
                hub_id: selectedHub === 1 ? 'HUB-MSEK-001' : selectedHub === 2 ? 'HUB-CHONG-002' : 'HUB-MKUS-003',
                soil_moisture_15cm: soil15,
                soil_moisture_30cm: soil30,
                soil_moisture_60cm: soil60,
                temperature,
                humidity,
                rainfall,
              },
              null,
              2
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1c3321]">
            <button
              onClick={onClose}
              className="px-3 py-2 text-gray-300 hover:text-white rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sentSuccess}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition active:scale-95"
            >
              {sentSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Telemetry Broadcasted!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Broadcast Packet</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
