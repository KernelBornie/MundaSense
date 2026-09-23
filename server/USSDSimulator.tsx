import { useState } from 'react';
import { Phone, PhoneOff, RotateCcw, Zap, Lock, Unlock } from 'lucide-react';

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 900;
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
}

export function USSDSimulator() {
  const [phone, setPhone] = useState('+260970000099');
  const [buffer, setBuffer] = useState('*2873#');
  const [screenText, setScreenText] = useState(
    'MundaSense Feature Phone\n\nReady.\n\nDial *2873#'
  );
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [trace, setTrace] = useState<{ input: string; output: string; raw: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [registeredPin, setRegisteredPin] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const reset = () => {
    setBuffer('*2873#');
    setScreenText('MundaSense Feature Phone\n\nReady.\n\nDial *2873#');
    setIsActive(false);
    setSessionId('');
    setTrace([]);
    setRegisteredPin(null);
    setIsAuthenticated(false);
  };

  const callUssd = async (accumulatedPath: string) => {
    setBusy(true);
    try {
      const sid =
        sessionId || `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      if (!sessionId) setSessionId(sid);

      const body = new URLSearchParams({
        sessionId: sid,
        serviceCode: '*384*2873#',
        phoneNumber: phone,
        text: accumulatedPath,
      });

      const res = await fetch('/ussd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      const raw = await res.text();
      const cleaned = raw.replace(/^(CON|END)\s+/, '');
      const isEnd = raw.startsWith('END');

      setScreenText(cleaned);
      setIsActive(!isEnd);
      setTrace((t) => [...t, { input: accumulatedPath || '(dial)', output: cleaned, raw }]);

      // Auth state tracking
      if (raw.includes('Enter your 4-digit PIN')) {
        setIsAuthenticated(false);
      }
      if (raw.includes('Invalid PIN') || raw.includes('Logged out')) {
        setIsAuthenticated(false);
      }
      if (
        raw.startsWith('CON') &&
        (raw.includes('MundaSense ·') ||
          raw.includes('Crop Advisory') ||
          raw.includes('Sell My Crop'))
      ) {
        setIsAuthenticated(true);
      }

      // PIN capture
      if (raw.includes('Your PIN is:')) {
        const m = raw.match(/Your PIN is:\s*(\d{4})/);
        if (m) setRegisteredPin(m[1]);
      }

      if (isEnd) setSessionId('');
      return { raw, isEnd };
    } catch (e: any) {
      setScreenText(`Network error: ${e.message}`);
      setIsActive(false);
      return { raw: 'END error', isEnd: true };
    } finally {
      setBusy(false);
    }
  };

  const handleCall = async () => {
    beep();
    const dialed = buffer.trim();

    if (!isActive) {
      if (dialed === '*2873#' || dialed === '*2873' || dialed === '2873') {
        setTrace([]);
        setIsAuthenticated(false);
        setBuffer('');
        await callUssd('');
      } else {
        setScreenText(`Invalid code: ${dialed}\n\nDial *2873#`);
      }
      return;
    }

    if (!dialed) return;
    const pathParts = trace.map((t) => t.input).filter((x) => x !== '(dial)');
    const newPath = [...pathParts, dialed].join('*');
    setBuffer('');
    await callUssd(newPath);
  };

  const handleEnd = () => {
    beep();
    setScreenText('Session ended.\n\nDial *2873#');
    setIsActive(false);
    setSessionId('');
    setIsAuthenticated(false);
    setBuffer('*2873#');
  };

  const pressKey = (k: string) => {
    beep();
    setBuffer((b) => b + k);
  };

  const backspace = () => setBuffer((b) => b.slice(0, -1));
  const quick = (code: string) => setBuffer(code);

  const pathStr =
    trace.length > 0
      ? trace
          .map((t) => t.input)
          .filter((x) => x !== '(dial)')
          .join('*') + (buffer ? '*' + buffer : '')
      : buffer;

  return (
    <div className="flex flex-col xl:flex-row items-start justify-center gap-8">
      {/* ============== FEATURE PHONE ============== */}
      <div className="w-[320px] flex-shrink-0">
        <div className="bg-gradient-to-b from-[#2a2f2c] to-[#1a1e1c] border-4 border-[#101411] rounded-[46px] p-5 shadow-2xl shadow-black/80">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-1.5 bg-[#0a0f0b] rounded-full" />
          </div>
          <div className="text-center text-[9px] tracking-[0.35em] text-emerald-600/80 font-mono mb-2">
            MUNDA-2000 · 2G
          </div>

          <div className="bg-[#182e1a] border-[5px] border-[#0a1410] rounded-lg p-3 shadow-inner relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,120,0.1) 2px, rgba(0,255,120,0.1) 3px)',
              }}
            />
            <div className="flex justify-between items-center text-[9px] text-emerald-400/70 border-b border-emerald-900/40 pb-1 mb-1.5 font-mono font-bold">
              <span className="flex items-center gap-1">
                {isAuthenticated ? (
                  <>
                    <Unlock className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="text-emerald-400">AUTH</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-2.5 h-2.5" />
                    <span>LOCKED</span>
                  </>
                )}
              </span>
              <span>▲▲▲ 98%</span>
            </div>
            <div className="text-[#5cf37a] font-mono text-[11px] leading-[1.5] whitespace-pre-wrap min-h-[210px] max-h-[230px] overflow-y-auto">
              {busy ? 'Sending…' : screenText}
            </div>
            <div className="mt-2 pt-1.5 border-t border-emerald-900/40 flex justify-between text-[10px] font-mono">
              <span className="text-emerald-500/70">{isActive ? 'Reply:' : 'Dial:'}</span>
              <span className="bg-[#0d1f11] px-2 py-0.5 rounded text-white font-bold min-w-[80px] text-right">
                {buffer || ' '}
              </span>
            </div>
            <div className="mt-1.5 text-[9px] text-emerald-500/60 font-mono truncate">
              text={pathStr || '(dial *2873#)'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={handleCall}
              disabled={busy}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg active:scale-95 transition cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 fill-current" />
              {isActive ? 'SEND' : 'CALL'}
            </button>
            <button
              onClick={handleEnd}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-lg active:scale-95 transition cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5 fill-current" />
              END
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-3">
            {[
              { k: '1', s: '.,' },
              { k: '2', s: 'ABC' },
              { k: '3', s: 'DEF' },
              { k: '4', s: 'GHI' },
              { k: '5', s: 'JKL' },
              { k: '6', s: 'MNO' },
              { k: '7', s: 'PQRS' },
              { k: '8', s: 'TUV' },
              { k: '9', s: 'WXYZ' },
              { k: '*', s: '★' },
              { k: '0', s: '⎵' },
              { k: '#', s: '⌫' },
            ].map((b) => (
              <button
                key={b.k}
                onClick={() => (b.k === '#' ? backspace() : pressKey(b.k))}
                className="h-11 rounded-xl bg-[#2c3530] hover:bg-[#3a453e] border border-[#3d4a42] text-white flex flex-col items-center justify-center font-bold shadow-md active:scale-95 transition cursor-pointer"
              >
                <span className="text-[13px] leading-none">{b.k}</span>
                <span className="text-[7px] text-gray-500 font-mono mt-0.5">{b.s}</span>
              </button>
            ))}
          </div>

          <button
            onClick={reset}
            className="w-full mt-3 text-[10px] text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1 font-mono cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset phone
          </button>
        </div>
      </div>

      {/* ============== PANEL ============== */}
      <div className="flex-1 max-w-lg space-y-4">
        <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-emerald-400" />
              Real USSD Gateway
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                LIVE · POST /ussd
              </span>
            </h3>
            <p className="text-xs text-gray-400">
              Every keypress POSTs to the actual Africa's Talking webhook. Sessions and
              registrations persist in SQLite. Users enter their PIN to access services.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">
              Simulated SIM number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#152418] border border-[#233f28] rounded-lg text-sm text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Change to register a new farmer or login an existing one.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase block mb-2">
              Quick dial
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['*2873#', '1', '2', '3'].map((code) => (
                <button
                  key={code}
                  onClick={() => quick(code)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg font-mono font-bold border transition cursor-pointer ${
                    code === '*2873#'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600'
                      : 'bg-[#18291c] hover:bg-[#223a28] text-emerald-300 border-[#26412b]'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {registeredPin && (
          <div className="bg-emerald-950/60 border-2 border-emerald-700 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">✅</div>
              <div className="text-xs">
                <div className="font-bold text-white text-sm mb-1">
                  Account created in SQLite
                </div>
                <p className="text-emerald-200 mb-2">
                  Log in on the web app with this phone + PIN, OR dial *2873# again to
                  enter the PIN.
                </p>
                <div className="inline-block bg-black/40 border border-emerald-700 px-3 py-1.5 rounded-lg font-mono text-base text-emerald-300 font-bold">
                  PIN: {registeredPin}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-300 uppercase font-mono">
              Session trace ({trace.length})
            </h4>
            {trace.length > 0 && (
              <button
                onClick={reset}
                className="text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {trace.length === 0 ? (
              <p className="text-[11px] text-gray-500 italic py-3">
                No session yet. Dial *2873# → CALL.
              </p>
            ) : (
              trace.map((t, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-[#152418] border border-[#223a27] text-[11px] font-mono space-y-1.5"
                >
                  <div className="text-amber-400">
                    → User sent: <strong>{t.input}</strong>
                  </div>
                  <div className="text-emerald-300 whitespace-pre-wrap pl-3 border-l-2 border-emerald-700">
                    {t.output}
                  </div>
                  <div className="text-[9.5px] text-gray-500">
                    Raw: {t.raw.slice(0, 60)}
                    {t.raw.length > 60 ? '…' : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-4 text-xs space-y-2">
          <h4 className="font-bold text-gray-300 flex items-center gap-2">
            📖 How PIN-based USSD login works
          </h4>
          <ol className="space-y-1 text-gray-400 list-decimal list-inside leading-relaxed">
            <li>Farmer dials <code className="text-emerald-400">*384*2873#</code></li>
            <li>Server checks if the phone is in the <code>users</code> table</li>
            <li>If YES → asks for 4-digit PIN</li>
            <li>Server verifies PIN hash against the DB</li>
            <li>If valid → unlocks full menu (sell, hire, advisories)</li>
            <li>If invalid → <em>Invalid PIN</em> and session ends</li>
          </ol>
          <p className="text-[10.5px] text-gray-500 pt-2 border-t border-[#1e3623]">
            All from a 2G feature phone. No internet, no app, no smartphone.
          </p>
        </div>
      </div>
    </div>
  );
}
