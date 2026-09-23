import React, { useState, useEffect } from 'react';
import { Send, Sparkles, CheckCheck, MessageSquare } from 'lucide-react';

interface SMSRow {
  id: number;
  phone: string;
  direction: 'in' | 'out';
  message: string;
  status: string;
  created_at: string;
}

export const SMSSimulator: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('+260974684713');
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState<SMSRow[]>([]);
  const [busy, setBusy] = useState(false);

  /* Load real SMS log from DB */
  const loadLog = async () => {
    try {
      const res = await fetch(
        `/api/sms/log?phone=${encodeURIComponent(phoneNumber)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data);
    } catch {}
  };

  useEffect(() => {
    loadLog();
    const t = setInterval(loadLog, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [phoneNumber]);

  /* Send real inbound SMS via webhook */
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const txt = textInput.trim();
    if (!txt) return;
    setBusy(true);
    try {
      await fetch('/sms/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          from: phoneNumber,
          text: txt,
        }).toString(),
      });
      setTextInput('');
      setTimeout(loadLog, 400);
    } finally {
      setBusy(false);
    }
  };

  const quickCommand = (cmd: string) => setTextInput(cmd);

  return (
    <div className="flex flex-col xl:flex-row items-start justify-center gap-6">
      {/* Phone chassis */}
      <div className="w-[340px] md:w-[380px] bg-[#121c14] border-4 border-[#233827] rounded-[38px] p-4 shadow-2xl shadow-black/80 flex flex-col h-[580px] select-none relative overflow-hidden">
        <div className="w-full flex items-center justify-center mb-2">
          <div className="w-20 h-3 bg-[#0a120b] rounded-full" />
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-[#1f3523] px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-800/60 border border-emerald-600 flex items-center justify-center text-white text-xs font-bold font-mono">
              2873
            </div>
            <div>
              <div className="font-bold text-xs text-white">MundaSense Gateway</div>
              <div className="text-[10px] text-emerald-400 font-mono">
                SMS 2-Way · LIVE DB
              </div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 font-mono bg-[#162719] px-2 py-0.5 rounded border border-[#243f29]">
            {messages.length} msgs
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2.5 my-2 text-xs">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs italic">
              No messages for this phone. Send an SMS below.
            </div>
          ) : (
            messages.slice(-30).map((msg) => {
              const isInbound = msg.direction === 'in';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isInbound ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs leading-relaxed ${
                      isInbound
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-[#1a2d1e] text-gray-100 border border-[#28472d] rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <div
                      className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                        isInbound ? 'text-emerald-200' : 'text-gray-400'
                      }`}
                    >
                      <span>{isInbound ? 'Sent by farmer' : 'Server reply'}</span>
                      <span>·</span>
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <CheckCheck className="w-3 h-3 text-emerald-300" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="py-2 border-t border-[#1e3422] flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
          {['SOIL', 'PRICE MAIZE', 'YES 218', 'NO 218', 'HELP', 'BULK'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => quickCommand(cmd)}
              className="px-2 py-0.5 bg-[#172b1a] hover:bg-[#244229] text-emerald-300 border border-[#26462b] rounded-full whitespace-nowrap transition cursor-pointer"
            >
              {cmd}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            placeholder="Type SMS (e.g. SOIL)..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={busy}
            className="flex-1 bg-[#162719] border border-[#233e28] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={busy}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-md transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Side panel */}
      <div className="flex-1 space-y-4 max-w-lg">
        <div className="bg-[#111e14] border border-[#203625] rounded-2xl p-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            Real SMS Engine
          </h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Inbound SMS hits <code className="text-emerald-400">/sms/webhook</code>, writes
            to the <code className="text-emerald-400">sms_log</code> table, and replies
            via Africa's Talking.
          </p>

          <div className="mt-3">
            <label className="text-[11px] text-gray-400 block font-medium mb-1">
              Simulated farmer number:
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Currently set to <strong className="text-emerald-400">+260974684713</strong>.
            </p>
          </div>
        </div>

        <div className="bg-[#111e14] border border-[#203625] rounded-2xl p-4 text-xs space-y-3">
          <h4 className="font-bold text-gray-300 font-mono uppercase text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            SMS Commands
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
            {[
              { k: 'SOIL', d: 'Live soil moisture from DB' },
              { k: 'PRICE MAIZE', d: 'Current ZMW market price' },
              { k: 'YES 218', d: 'Confirm order (writes to DB)' },
              { k: 'NO 218', d: 'Decline order' },
              { k: 'BULK', d: 'Join Friday cooperative sale' },
              { k: 'HELP', d: 'Show all commands' },
            ].map((c) => (
              <div
                key={c.k}
                className="p-2 bg-[#16271b] rounded border border-[#243e2a]"
              >
                <span className="text-emerald-400 font-bold block">{c.k}</span>
                <span className="text-gray-400 text-[10.5px]">{c.d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
