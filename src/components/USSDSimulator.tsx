import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { playDTMF, playDialTone } from '../services/audioEngine';
import { Phone, PhoneOff, RotateCcw, Delete, Sparkles } from 'lucide-react';

export const USSDSimulator: React.FC = () => {
  const { queryUSSD, currentUser } = useApp();
  const [phoneNumber, setPhoneNumber] = useState('+260970000002');
  const [inputBuffer, setInputBuffer] = useState('*2873#');
  const [sessionPath, setSessionPath] = useState<string[]>([]);
  const [screenText, setScreenText] = useState<string>(
    'MundaSense Feature Phone\nReady to dial *2873#\nPress CALL/SEND to start.'
  );
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [sessionHistory, setSessionHistory] = useState<{ query: string; response: string }[]>([]);

  const handleKeyPress = (char: string) => {
    playDTMF(char);
    setInputBuffer((prev) => prev + char);
  };

  const handleBackspace = () => {
    setInputBuffer((prev) => prev.slice(0, -1));
  };

  const handleSend = () => {
    playDialTone();

    if (!isSessionActive) {
      // Starting session: expect *2873# or dial code
      const clean = inputBuffer.trim();
      if (clean === '*2873#' || clean === '*2873' || clean === '2873') {
        const res = queryUSSD(phoneNumber, '');
        setScreenText(res.response);
        setIsSessionActive(true);
        setSessionPath([]);
        setInputBuffer('');
        setSessionHistory([{ query: '*2873#', response: res.response }]);
      } else {
        setScreenText(`Invalid code: ${clean}\nDial *2873# to access MundaSense.`);
        setInputBuffer('');
      }
      return;
    }

    // Ongoing session
    const choice = inputBuffer.trim();
    const newPath = [...sessionPath, choice];
    const fullQuery = newPath.join('*');
    const res = queryUSSD(phoneNumber, fullQuery);

    setScreenText(res.response);
    setSessionHistory((prev) => [...prev, { query: choice || '(enter)', response: res.response }]);
    setInputBuffer('');

    if (res.isEnd) {
      setIsSessionActive(false);
      setSessionPath([]);
    } else {
      setSessionPath(newPath);
    }
  };

  const handleEndCall = () => {
    playDTMF('#');
    setIsSessionActive(false);
    setSessionPath([]);
    setInputBuffer('');
    setScreenText('Session terminated.\nDial *2873# to reconnect.');
  };

  const handleQuickDial = (code: string) => {
    setInputBuffer(code);
  };

  return (
    <div className="flex flex-col xl:flex-row items-start justify-center gap-6">
      {/* Retro Mobile Phone Chassis (Nokia Style) */}
      <div className="w-[300px] bg-[#1a201b] border-4 border-[#28382c] rounded-[44px] p-5 shadow-2xl shadow-black/80 flex flex-col items-center select-none relative">
        {/* Phone Earpiece */}
        <div className="w-16 h-1.5 bg-[#0a0f0b] rounded-full mb-4 border border-[#2a3a2e]" />

        {/* Brand Kicker */}
        <div className="text-[10px] tracking-[0.2em] font-extrabold text-emerald-500/80 mb-2 font-mono uppercase">
          MUNDA-2000 2G
        </div>

        {/* Backlit LCD Screen */}
        <div className="w-full bg-[#1b3d22] border-4 border-[#0e2113] rounded-xl p-3 text-[#58f37b] font-mono text-[11px] leading-relaxed min-h-[190px] shadow-inner relative overflow-hidden flex flex-col justify-between">
          {/* Scanline effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/5 to-transparent pointer-events-none opacity-40" />

          {/* Status bar */}
          <div className="flex items-center justify-between text-[9px] text-[#58f37b]/70 border-b border-[#285732] pb-1 mb-1 font-bold">
            <span>MTN-ZM 4G</span>
            <div className="flex items-center gap-1">
              <span>●●●●</span>
              <span>🔋98%</span>
            </div>
          </div>

          {/* Text Display */}
          <div className="whitespace-pre-wrap flex-1 overflow-y-auto max-h-[140px] text-shadow font-mono text-[10.5px]">
            {screenText}
          </div>

          {/* Input buffer line */}
          <div className="mt-1 pt-1 border-t border-[#285732] flex items-center justify-between text-[11px]">
            <span className="text-[#a7f3d0]">Input:</span>
            <span className="font-bold text-white bg-[#0e2414] px-2 py-0.5 rounded text-[11px]">
              {inputBuffer || '_'}
            </span>
          </div>
        </div>

        {/* Action Controls (Call / End / Clear) */}
        <div className="w-full grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={handleSend}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 active:translate-y-0.5 transition"
          >
            <Phone className="w-3.5 h-3.5 fill-current" />
            <span>{isSessionActive ? 'Send' : 'Call'}</span>
          </button>
          <button
            onClick={handleEndCall}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-950/50 active:translate-y-0.5 transition"
          >
            <PhoneOff className="w-3.5 h-3.5 fill-current" />
            <span>End</span>
          </button>
        </div>

        {/* 12-Key Number Pad */}
        <div className="w-full grid grid-cols-3 gap-2 mt-3 text-xs">
          {[
            { k: '1', sub: '.,' },
            { k: '2', sub: 'ABC' },
            { k: '3', sub: 'DEF' },
            { k: '4', sub: 'GHI' },
            { k: '5', sub: 'JKL' },
            { k: '6', sub: 'MNO' },
            { k: '7', sub: 'PQRS' },
            { k: '8', sub: 'TUV' },
            { k: '9', sub: 'WXYZ' },
            { k: '*', sub: 'DIAL' },
            { k: '0', sub: '+' },
            { k: '#', sub: 'CLR' },
          ].map((btn) => (
            <button
              key={btn.k}
              onClick={() => {
                if (btn.k === '#') {
                  handleBackspace();
                } else {
                  handleKeyPress(btn.k);
                }
              }}
              className="h-11 rounded-xl bg-[#253328] hover:bg-[#324536] border border-[#374c3b] text-white flex flex-col items-center justify-center font-bold shadow-md shadow-black/40 active:translate-y-0.5 transition group"
            >
              <span className="text-sm leading-none font-mono group-hover:text-emerald-300">
                {btn.k}
              </span>
              <span className="text-[8px] text-gray-400 font-mono font-normal">
                {btn.sub}
              </span>
            </button>
          ))}
        </div>

        {/* Microphone hole */}
        <div className="w-2 h-2 rounded-full bg-[#0d140e] mt-4" />
      </div>

      {/* Simulator Control Panel & Session Log */}
      <div className="flex-1 space-y-4 max-w-lg">
        <div className="bg-[#111e14] border border-[#203625] rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1b2e20]">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>USSD Gateway Simulator (*2873#)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  ACTIVE
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Simulates Africa's Talking / MTN / Airtel USSD Session Gateway
              </p>
            </div>
            <button
              onClick={() => {
                setIsSessionActive(false);
                setSessionPath([]);
                setInputBuffer('*2873#');
                setScreenText('MundaSense Feature Phone\nReady to dial *2873#\nPress CALL to start.');
              }}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 p-1"
              title="Reset phone"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SIM Card Phone Number Config */}
          <div className="mt-3 text-xs space-y-1.5">
            <label className="text-[11px] text-gray-400 block font-medium">
              Simulated Farmer MSISDN (Phone):
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Preset Demo Shortcuts */}
          <div className="mt-3 text-xs space-y-1.5">
            <span className="text-[11px] text-gray-400 block font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Quick Demo Shortcut Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '*2873# (Root)', code: '*2873#' },
                { label: '1 (Advisory)', code: '1' },
                { label: '2 (Disease Alert)', code: '2' },
                { label: '3 (Storage Silos)', code: '3' },
                { label: '4 (Market Prices)', code: '4' },
                { label: '6 (Sell Maize)', code: '6' },
                { label: '5 (Callback)', code: '5' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleQuickDial(preset.code)}
                  className="px-2.5 py-1 bg-[#18291c] hover:bg-[#233a28] text-emerald-300 border border-[#26412b] rounded-md font-mono text-[11px] transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Session Log */}
        <div className="bg-[#111e14] border border-[#203625] rounded-2xl p-4 shadow-xl">
          <h4 className="text-xs font-bold text-gray-300 uppercase font-mono tracking-wider mb-2">
            USSD Session Trace ({sessionHistory.length} exchanges)
          </h4>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs font-mono">
            {sessionHistory.length === 0 ? (
              <p className="text-gray-500 text-[11px] italic">
                No active session trace. Dial *2873# to begin.
              </p>
            ) : (
              sessionHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-[#152418] border border-[#223a27] space-y-1 text-[11px]"
                >
                  <div className="text-amber-400 flex items-center justify-between">
                    <span>Farmer Input &gt; {item.query}</span>
                    <span className="text-[10px] text-gray-500">Exchange #{idx + 1}</span>
                  </div>
                  <div className="text-emerald-300 whitespace-pre-wrap pl-2 border-l-2 border-emerald-600">
                    {item.response}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
