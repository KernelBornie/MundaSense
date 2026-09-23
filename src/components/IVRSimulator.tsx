import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { playDTMF, speakText, stopSpeech } from '../services/audioEngine';
import { Phone, PhoneOff, Volume2, VolumeX, Mic, RotateCcw } from 'lucide-react';

export const IVRSimulator: React.FC = () => {
  const { farms, currentUser } = useApp();
  const [phoneNumber, setPhoneNumber] = useState('+260970000002');
  const [language, setLanguage] = useState<'English' | 'Bemba' | 'Nyanja' | 'Tonga'>('English');
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [voiceText, setVoiceText] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [callLog, setCallLog] = useState<string[]>([]);

  useEffect(() => {
    let timer: any;
    if (callState === 'connected') {
      timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const startCall = () => {
    setCallState('calling');
    setCallLog((l) => [...l, `[${new Date().toLocaleTimeString()}] Outbound IVR call initiated to ${phoneNumber} (${language})`]);

    setTimeout(() => {
      setCallState('connected');
      const intro = getIVRIntro(language);
      setVoiceText(intro);
      if (!isAudioMuted) speakText(intro);
    }, 1200);
  };

  const endCall = () => {
    stopSpeech();
    playDTMF('#');
    setCallState('ended');
    setVoiceText('Call ended. Zikomo kwa kwambiri.');
    setCallLog((l) => [...l, `[${new Date().toLocaleTimeString()}] Call completed (${callDuration} seconds)`]);
    setTimeout(() => setCallState('idle'), 2000);
  };

  const handleDigit = (digit: string) => {
    playDTMF(digit);
    const farm = farms.find((f) => f.phone === phoneNumber) || farms[0];
    let responseText = '';

    if (digit === '1') {
      // Irrigation advice
      if (language === 'Bemba') {
        responseText = `Amenshi mu mushili ni pachepa, pa 28 percent. Nshiteni amabala yenu mu nshiku shibili. Imfula ileisa pa Thursday.`;
      } else if (language === 'Nyanja') {
        responseText = `Madzi m'nthaka ndi 28 percent. Thirani chimanga masiku awiri. Mvula ikubwera Lachinayi.`;
      } else {
        responseText = `Your farm at ${farm.village} has soil moisture at 28.8 percent. Irrigation is advised within 48 hours. Light showers expected Thursday.`;
      }
    } else if (digit === '2') {
      // Storage status
      responseText = `Storage warning for Msekera Silo A: Grain moisture is 14.3 percent. Aflatoxin danger exists. Sun-dry your harvested bags before bagging.`;
    } else if (digit === '3') {
      // Market prices
      responseText = `Commodity prices today: Grade A White Maize is trading at 6 Kwacha 20 ngwee per kilogram. Groundnuts are 10 Kwacha 80 ngwee. Bulk trucks load Friday.`;
    } else if (digit === '0') {
      // Callback
      responseText = `Your callback request is confirmed. Extension Officer Cosmas Lungu will call your number within 24 hours. Zikomo!`;
    } else {
      responseText = `Invalid option. Press 1 for soil advisory, 2 for storage, 3 for market, or 0 for extension officer.`;
    }

    setVoiceText(responseText);
    setCallLog((l) => [...l, `[${new Date().toLocaleTimeString()}] Farmer pressed [${digit}] -> ${responseText.substring(0, 40)}...`]);
    if (!isAudioMuted) speakText(responseText);
  };

  function getIVRIntro(lang: string) {
    if (lang === 'Bemba') {
      return `Moni! Uyu ndi MundaSense. Tondekeni: Tindikeni 1 pa fya menshi mu mushili. Tindikeni 2 pa fya storage ya chimanga. Tindikeni 3 pa fyamutengo wa masamba. Nangu 0 ukulomba extension officer.`;
    }
    if (lang === 'Nyanja') {
      return `Moni! Uyu ndi MundaSense. Dinani 1 ya madzi m'nthaka. Dinani 2 ya zosungira chimanga. Dinani 3 ya mitengo pa msika. Dinani 0 kuti mulankhule ndi extension officer.`;
    }
    return `Welcome to MundaSense Voice Automated Advisory. Press 1 for soil moisture and irrigation. Press 2 for hermetic storage alerts. Press 3 for real-time Kwacha market prices. Press 0 to request an agricultural extension officer call.`;
  }

  return (
    <div className="flex flex-col xl:flex-row items-start justify-center gap-6">
      {/* IVR Voice Terminal Device */}
      <div className="w-[340px] md:w-[380px] bg-[#141e16] border-4 border-[#253e2a] rounded-[40px] p-6 shadow-2xl shadow-black/80 flex flex-col items-center select-none relative">
        {/* Calling Header */}
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {callState === 'connected' ? 'CALL IN PROGRESS' : callState === 'calling' ? 'CONNECTING...' : 'IVR GATEWAY READY'}
            </span>
          </div>
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="p-1.5 text-gray-400 hover:text-white bg-[#1a2d1f] rounded-lg border border-[#26442b]"
            title={isAudioMuted ? 'Unmute voice' : 'Mute voice'}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>

        {/* Audio Waveform Display Box */}
        <div className="w-full bg-[#0a130c] border-2 border-[#1c3522] rounded-2xl p-4 min-h-[180px] flex flex-col justify-between relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between text-[11px] text-gray-400 border-b border-[#1b3120] pb-1.5 font-mono">
            <span>TO: +260-MUNDA</span>
            <span>
              {Math.floor(callDuration / 60)
                .toString()
                .padStart(2, '0')}
              :{(callDuration % 60).toString().padStart(2, '0')}
            </span>
          </div>

          {/* Animated Audio Waveform */}
          <div className="my-3 flex items-center justify-center gap-1.5 h-10">
            {callState === 'connected' ? (
              [35, 75, 90, 50, 85, 40, 95, 60, 45, 80].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-emerald-400 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.8s',
                  }}
                />
              ))
            ) : (
              <div className="text-gray-500 text-xs italic font-mono flex items-center gap-2">
                <Mic className="w-4 h-4" /> Ready to speak
              </div>
            )}
          </div>

          {/* Voice Prompt Transcript */}
          <div className="bg-[#122216] border border-[#1e3824] rounded-lg p-2 text-emerald-300 font-mono text-[10.5px] leading-relaxed max-h-[85px] overflow-y-auto">
            {voiceText || 'Press "Dial In" to initiate interactive voice advisory session in selected language.'}
          </div>
        </div>

        {/* Action Buttons (Dial / Hangup) */}
        <div className="w-full grid grid-cols-2 gap-2 mt-4">
          {callState === 'idle' || callState === 'ended' ? (
            <button
              onClick={startCall}
              className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950 transition active:scale-95"
            >
              <Phone className="w-4 h-4 fill-current" />
              <span>Dial In (*2873# IVR)</span>
            </button>
          ) : (
            <button
              onClick={endCall}
              className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-extrabold text-xs shadow-lg shadow-rose-950 transition active:scale-95"
            >
              <PhoneOff className="w-4 h-4 fill-current" />
              <span>Hang Up</span>
            </button>
          )}
        </div>

        {/* DTMF Interactive Touchpad (1, 2, 3, 0) */}
        <div className="w-full grid grid-cols-4 gap-2 mt-3 text-xs">
          {[
            { k: '1', label: 'Soil' },
            { k: '2', label: 'Storage' },
            { k: '3', label: 'Market' },
            { k: '0', label: 'Officer' },
          ].map((btn) => (
            <button
              key={btn.k}
              onClick={() => handleDigit(btn.k)}
              disabled={callState !== 'connected'}
              className="py-3 rounded-xl bg-[#233526] hover:bg-[#2f4934] disabled:opacity-30 disabled:pointer-events-none border border-[#344e37] text-white flex flex-col items-center justify-center font-bold transition active:scale-95"
            >
              <span className="text-sm font-mono text-emerald-300">{btn.k}</span>
              <span className="text-[9px] text-gray-300 font-normal">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings and Call Logs */}
      <div className="flex-1 space-y-4 max-w-lg">
        <div className="bg-[#111e14] border border-[#203625] rounded-2xl p-4 shadow-xl">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>Interactive Voice Response (IVR) Engine</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Designed for low-literacy farmers. Speaks synthesized or pre-recorded audio in local Zambian languages over standard cellular voice channels.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
            <div>
              <label className="text-[11px] text-gray-400 block font-medium mb-1">
                Audio Language:
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 focus:outline-none"
              >
                <option value="English">English (Zambia)</option>
                <option value="Bemba">Bemba (Chibemba)</option>
                <option value="Nyanja">Nyanja (Chinyanja)</option>
                <option value="Tonga">Tonga (Chitonga)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-gray-400 block font-medium mb-1">
                Farmer Number:
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
              >
              </input>
            </div>
          </div>
        </div>

        {/* Live Call Trace */}
        <div className="bg-[#111e14] border border-[#203625] rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-gray-300 font-mono uppercase tracking-wider">
              IVR Gateway Call Trace
            </h4>
            <button
              onClick={() => setCallLog([])}
              className="text-[11px] text-gray-400 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 text-xs font-mono">
            {callLog.length === 0 ? (
              <p className="text-gray-500 text-[11px] italic">
                No active call logs. Dial in above to generate a trace.
              </p>
            ) : (
              callLog.map((log, idx) => (
                <div key={idx} className="p-2 rounded bg-[#16261b] text-emerald-300 border border-[#223926] text-[11px]">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
