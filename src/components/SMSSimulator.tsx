import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Send, Sparkles, CheckCheck, MessageSquare, Phone } from 'lucide-react';

export const SMSSimulator: React.FC = () => {
  const { smsMessages, sendInboundSMS } = useApp();
  const [phoneNumber, setPhoneNumber] = useState('+260970000002');
  const [textInput, setTextInput] = useState('');

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;
    sendInboundSMS(phoneNumber, textInput.trim());
    setTextInput('');
  };

  const handleQuickCommand = (cmd: string) => {
    setTextInput(cmd);
  };

  // Filter messages for current phone or all
  const filteredMessages = smsMessages.filter(
    (m) => m.phone === phoneNumber || phoneNumber === 'all'
  );

  return (
    <div className="flex flex-col xl:flex-row items-start justify-center gap-6">
      {/* Smartphone SMS Messenger View */}
      <div className="w-[340px] md:w-[380px] bg-[#121c14] border-4 border-[#233827] rounded-[38px] p-4 shadow-2xl shadow-black/80 flex flex-col h-[580px] select-none relative overflow-hidden">
        {/* Device Notch & Speaker */}
        <div className="w-full flex items-center justify-center mb-2">
          <div className="w-20 h-3 bg-[#0a120b] rounded-full" />
        </div>

        {/* SMS Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1f3523] px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-800/60 border border-emerald-600 flex items-center justify-center text-white text-xs font-bold font-mono">
              2873
            </div>
            <div>
              <div className="font-bold text-xs text-white">MundaSense Gateway</div>
              <div className="text-[10px] text-emerald-400 font-mono">Shortcode: *2873#</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 font-mono bg-[#162719] px-2 py-0.5 rounded border border-[#243f29]">
            SMS 2-Way
          </div>
        </div>

        {/* Message Bubble Thread */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2.5 my-2 text-xs">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs italic">
              No message history for this phone. Send an SMS below.
            </div>
          ) : (
            filteredMessages.slice(0, 30).map((msg) => {
              const isFarmerInbound = msg.direction === 'in';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isFarmerInbound ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs leading-relaxed ${
                      isFarmerInbound
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-[#1a2d1e] text-gray-100 border border-[#28472d] rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <div
                      className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                        isFarmerInbound ? 'text-emerald-200' : 'text-gray-400'
                      }`}
                    >
                      <span>{msg.category || (isFarmerInbound ? 'Inbound' : 'Outbound')}</span>
                      <span>·</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <CheckCheck className="w-3 h-3 text-emerald-300" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Command Chips */}
        <div className="py-2 border-t border-[#1e3422] flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
          {[
            'SOIL',
            'PRICE MAIZE',
            'YES 218',
            'NO 218',
            'DISEASE',
            'BULK',
            'HELP',
          ].map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleQuickCommand(cmd)}
              className="px-2 py-0.5 bg-[#172b1a] hover:bg-[#244229] text-emerald-300 border border-[#26462b] rounded-full whitespace-nowrap transition active:scale-95"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* SMS Input Box */}
        <form onSubmit={handleSend} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            placeholder="Type SMS command (e.g. SOIL)..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="flex-1 bg-[#162719] border border-[#233e28] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950 transition active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Control Details and Documentation */}
      <div className="flex-1 space-y-4 max-w-lg">
        <div className="bg-[#111e14] border border-[#203625] rounded-2xl p-4 shadow-xl">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Outbound &amp; Inbound SMS Engine</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            MundaSense pushes automated disease alerts, soil telemetry digests, and order confirmation requests to farmers without requiring mobile data.
          </p>

          <div className="mt-3 text-xs space-y-1.5">
            <label className="text-[11px] text-gray-400 block font-medium">
              Simulated Farmer Mobile Number:
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Command Reference Card */}
        <div className="bg-[#111e14] border border-[#203625] rounded-2xl p-4 shadow-xl text-xs space-y-3">
          <h4 className="font-bold text-gray-300 font-mono uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Supported SMS Keywords
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="p-2 bg-[#16271b] rounded border border-[#243e2a]">
              <span className="text-emerald-400 font-bold block">SOIL</span>
              <span className="text-gray-400 text-[10.5px]">Returns capacitive soil moisture at 15/30/60cm</span>
            </div>
            <div className="p-2 bg-[#16271b] rounded border border-[#243e2a]">
              <span className="text-emerald-400 font-bold block">PRICE MAIZE</span>
              <span className="text-gray-400 text-[10.5px]">Queries real-time ZMW commodity price</span>
            </div>
            <div className="p-2 bg-[#16271b] rounded border border-[#243e2a]">
              <span className="text-emerald-400 font-bold block">YES 218</span>
              <span className="text-gray-400 text-[10.5px]">Confirms purchase order from buyer</span>
            </div>
            <div className="p-2 bg-[#16271b] rounded border border-[#243e2a]">
              <span className="text-emerald-400 font-bold block">NO 218</span>
              <span className="text-gray-400 text-[10.5px]">Declines order; restores lot to exchange</span>
            </div>
            <div className="p-2 bg-[#16271b] rounded border border-[#243e2a]">
              <span className="text-emerald-400 font-bold block">BULK</span>
              <span className="text-gray-400 text-[10.5px]">Registers harvest for Friday cooperative truck</span>
            </div>
            <div className="p-2 bg-[#16271b] rounded border border-[#243e2a]">
              <span className="text-emerald-400 font-bold block">HELP</span>
              <span className="text-gray-400 text-[10.5px]">Displays full command directory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
