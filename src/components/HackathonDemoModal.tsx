import React from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface HackathonDemoModalProps {
  setActiveTab: (tab: string) => void;
  onSelectSampleForScreening?: (sampleId: string) => void;
}

interface StepInfo {
  step: number;
  tab: string;
  title: string;
  description: string;
  actionLabel: string;
  rolePrompt: string;
}

export const HACKATHON_STEPS: StepInfo[] = [
  {
    step: 1,
    tab: 'dashboard',
    title: '1. Show 550+ Farms Across Zambia',
    description: 'Display 550+ smallholder farms monitored across 15 agro-ecological hubs covering all 10 Zambian provinces: Eastern, Lusaka, Central, Copperbelt, Southern, Western, Northern, Luapula, Muchinga, and North-Western. Notice the live Healthy (green), Watch (yellow), and Alert (red) status breakdown.',
    actionLabel: 'View Map & Telemetry',
    rolePrompt: 'Viewing as Admin / Agro-Extension Officer',
  },
  {
    step: 2,
    tab: 'sensors',
    title: '2. Show Sensor Readings',
    description: 'Inspect Community Hub HUB-MSEK-001 at Msekera. View 3-depth capacitive soil moisture probes (15cm, 30cm, 60cm), air temperature, humidity (78%), and rainfall.',
    actionLabel: 'Inspect Hub Telemetry',
    rolePrompt: 'Viewing Msekera LoRaWAN Telemetry',
  },
  {
    step: 3,
    tab: 'sensors',
    title: '3. Show Disease-Risk Alert',
    description: 'Environmental Disease-Risk engine evaluates high humidity (78%) + warm temperature (27.4°C) + flowering maize stage -> elevates Msekera cluster to "WATCH/HIGH" risk before lesions appear.',
    actionLabel: 'Review Disease Pressure',
    rolePrompt: 'Automated Risk Classification',
  },
  {
    step: 4,
    tab: 'disease',
    title: '4. Upload Crop Image',
    description: 'Farmer Chanda Mwape or extension officer photographs a suspicious leaf on Plot #14 with early cigar-shaped lesions.',
    actionLabel: 'Load Field Photo',
    rolePrompt: 'Switched to Farmer / Scout View',
  },
  {
    step: 5,
    tab: 'disease',
    title: '5. AI Returns Disease Screening',
    description: 'AI model evaluates symptoms: Returns "Northern Corn Leaf Blight (Exserohilum turcicum)", 87% confidence, moderate severity. Clearly labeled as AI-assisted screening with extension escalation.',
    actionLabel: 'Run AI Screening',
    rolePrompt: 'Multi-modal Pathological Model',
  },
  {
    step: 6,
    tab: 'dashboard',
    title: '6. Dashboard Creates Alert',
    description: 'Farm #14 status transitions to "ALERT". Operations map updates marker to red; advisory engine compiles targeted agronomic recommendations.',
    actionLabel: 'See Dashboard Alert',
    rolePrompt: 'Central Cooperative Operations',
  },
  {
    step: 7,
    tab: 'simulators',
    title: '7. Farmer Receives SMS',
    description: 'Automated outbound SMS dispatched to Chanda’s basic feature phone: "DISEASE ALERT: Your maize area has HIGH risk conditions. Inspect leaves. Reply DISEASE for details."',
    actionLabel: 'Open Farmer SMS Phone',
    rolePrompt: 'Farmer Mobile Gateway (+260970000002)',
  },
  {
    step: 8,
    tab: 'simulators',
    title: '8. Feature Phone Uses USSD (*2873#)',
    description: 'Farmer with zero internet access dials *2873# on their 2G Nokia phone to check soil moisture and local pest advisory menu.',
    actionLabel: 'Dial *2873# on USSD Phone',
    rolePrompt: 'Feature Phone Offline Session',
  },
  {
    step: 9,
    tab: 'marketplace',
    title: '9. Farmer Checks Market Price',
    description: 'Farmer reviews real-time commodity exchange prices in Zambian Kwacha (ZMW). White Maize SC647 trading at ZMW 6.20/kg at Msekera bulking shed.',
    actionLabel: 'View ZMW Market Prices',
    rolePrompt: 'Commodity Price Discovery',
  },
  {
    step: 10,
    tab: 'marketplace',
    title: '10. Farmer Lists Maize',
    description: 'Farmer Chanda Mwape lists 1,000 kg of dried Grade A Maize for sale at ZMW 6.40/kg on the cooperative digital marketplace.',
    actionLabel: 'Create Marketplace Listing',
    rolePrompt: 'Seller: Chanda Mwape (Msekera)',
  },
  {
    step: 11,
    tab: 'marketplace',
    title: '11. Buyer Places Order',
    description: 'Buyer (National Milling Corporation) locates the lot and places Order #218 for 1,000 kg Maize (Total ZMW 6,400).',
    actionLabel: 'Place Purchase Order #218',
    rolePrompt: 'Buyer: National Milling Corporation',
  },
  {
    step: 12,
    tab: 'simulators',
    title: '12. Farmer Receives Order SMS',
    description: 'Farmer receives inbound purchase order SMS: "NEW ORDER #218: 1000 kg Maize = ZMW 6,400. Reply YES 218 or NO 218." Farmer replies "YES 218"!',
    actionLabel: 'Check SMS & Confirm Order',
    rolePrompt: 'Farmer SMS Phone Interaction',
  },
  {
    step: 13,
    tab: 'transport',
    title: '13. Farmer Requests Transport',
    description: 'With order confirmed, transport request TR-42 is created: Haul 1,000 kg (20 bags) from Msekera Shed to National Milling Lusaka.',
    actionLabel: 'View Transport Request TR-42',
    rolePrompt: 'Logistics Aggregation',
  },
  {
    step: 14,
    tab: 'transport',
    title: '14. Transporter Bids',
    description: 'Local hauler ZamCargo Agri-Logistics bids ZMW 1,800 on Request TR-42 with their 3.5-Ton Canter truck (8h ETA).',
    actionLabel: 'Review Transporter Bids',
    rolePrompt: 'Transporter: ZamCargo Logistics',
  },
  {
    step: 15,
    tab: 'transport',
    title: '15. Farmer Accepts Bid',
    description: 'Farmer accepts ZamCargo’s ZMW 1,800 bid. Automated SMS confirmations dispatched to both parties. Full seed-to-sale cycle completed!',
    actionLabel: 'Accept Bid & Complete Demo',
    rolePrompt: 'End-to-End Cycle Complete 🏆',
  },
];

export const HackathonDemoModal: React.FC<HackathonDemoModalProps> = ({
  setActiveTab,
}) => {
  const {
    demoStep,
    isDemoRunning,
    advanceDemoStep,
    stopGuidedDemo,
    setCurrentUserRole,
    analyzeDisease,
    createOrder,
    sendInboundSMS,
    acceptTransportBid,
  } = useApp();

  if (!isDemoRunning || demoStep === 0) return null;

  const current = HACKATHON_STEPS[demoStep - 1] || HACKATHON_STEPS[0];

  const handleExecuteAndNext = async () => {
    // Perform programmatic action matching the step
    switch (demoStep) {
      case 1:
        setActiveTab('dashboard');
        setCurrentUserRole('admin');
        break;
      case 2:
        setActiveTab('sensors');
        break;
      case 3:
        setActiveTab('sensors');
        break;
      case 4:
        setActiveTab('disease');
        setCurrentUserRole('farmer');
        break;
      case 5:
        setActiveTab('disease');
        await analyzeDisease(14, 'Maize', 'sample-maize-blight');
        break;
      case 6:
        setActiveTab('dashboard');
        setCurrentUserRole('admin');
        break;
      case 7:
        setActiveTab('simulators');
        setCurrentUserRole('farmer');
        break;
      case 8:
        setActiveTab('simulators');
        break;
      case 9:
        setActiveTab('marketplace');
        break;
      case 10:
        setActiveTab('marketplace');
        setCurrentUserRole('farmer');
        break;
      case 11:
        setActiveTab('marketplace');
        setCurrentUserRole('customer');
        createOrder(3, 1000);
        break;
      case 12:
        setActiveTab('simulators');
        setCurrentUserRole('farmer');
        sendInboundSMS('+260970000002', 'YES 218');
        break;
      case 13:
        setActiveTab('transport');
        setCurrentUserRole('farmer');
        break;
      case 14:
        setActiveTab('transport');
        setCurrentUserRole('transporter');
        break;
      case 15:
        setActiveTab('transport');
        acceptTransportBid(101);
        break;
      default:
        break;
    }

    if (demoStep < 15) {
      advanceDemoStep(demoStep + 1);
    } else {
      stopGuidedDemo();
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[480px] z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-[#122216] border-2 border-emerald-500 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 px-4 py-2.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="font-extrabold text-xs uppercase tracking-wider">
              Hackathon Presentation Flow
            </span>
            <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full font-mono text-emerald-200">
              Step {demoStep} of 15
            </span>
          </div>
          <button
            onClick={stopGuidedDemo}
            className="text-emerald-200 hover:text-white p-1 rounded transition"
            title="Exit guided tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#182e1d] h-1.5">
          <div
            className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-300"
            style={{ width: `${(demoStep / 15) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          <div>
            <div className="text-[11px] font-mono text-emerald-400 mb-0.5">
              {current.rolePrompt}
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {current.title}
            </h3>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              {current.description}
            </p>
          </div>

          {/* Step navigator dots */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {HACKATHON_STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => {
                  setActiveTab(s.tab);
                  advanceDemoStep(s.step);
                }}
                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition flex-shrink-0 ${
                  s.step === demoStep
                    ? 'bg-amber-400 text-black font-extrabold ring-2 ring-amber-300'
                    : s.step < demoStep
                    ? 'bg-emerald-700 text-emerald-100'
                    : 'bg-[#1e3423] text-gray-400 hover:bg-[#2a4731]'
                }`}
                title={s.title}
              >
                {s.step}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1e3623] text-xs">
            <button
              onClick={() => {
                if (demoStep > 1) {
                  const prev = demoStep - 1;
                  setActiveTab(HACKATHON_STEPS[prev - 1].tab);
                  advanceDemoStep(prev);
                }
              }}
              disabled={demoStep <= 1}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleExecuteAndNext}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shadow-lg shadow-emerald-900/40 transition active:scale-95"
            >
              <span>{demoStep === 15 ? 'Finish Demo' : current.actionLabel}</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
