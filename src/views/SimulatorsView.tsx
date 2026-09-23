import React, { useState } from 'react';
import { USSDSimulator } from '../components/USSDSimulator';
import { SMSSimulator } from '../components/SMSSimulator';
import { IVRSimulator } from '../components/IVRSimulator';
import { Phone, MessageSquare, Volume2, Radio, Info } from 'lucide-react';

export const SimulatorsView: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState<'ussd' | 'sms' | 'ivr'>('ussd');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111e15] border border-[#1e3623] rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Offline Last-Mile Cellular Gateway Simulators
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Demonstrates zero-internet access for smallholder farmers using basic 2G feature phones
          </p>
        </div>

        {/* Channel Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-[#142318] border border-[#233a27] rounded-xl text-xs">
          <button
            onClick={() => setActiveChannel('ussd')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeChannel === 'ussd'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>USSD (*2873#)</span>
          </button>

          <button
            onClick={() => setActiveChannel('sms')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeChannel === 'sms'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>SMS 2-Way</span>
          </button>

          <button
            onClick={() => setActiveChannel('ivr')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeChannel === 'ivr'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice IVR</span>
          </button>
        </div>
      </div>

      {/* Interactive Terminal Container */}
      <div className="bg-[#0e1710] border border-[#1d3120] rounded-3xl p-6 shadow-2xl">
        {activeChannel === 'ussd' && <USSDSimulator />}
        {activeChannel === 'sms' && <SMSSimulator />}
        {activeChannel === 'ivr' && <IVRSimulator />}
      </div>
    </div>
  );
};
