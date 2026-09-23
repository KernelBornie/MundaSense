import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HackathonDemoModal } from './components/HackathonDemoModal';
import { SensorPacketModal } from './components/SensorPacketModal';
import { CodeViewerModal } from './components/CodeViewerModal';

import { DashboardView } from './views/DashboardView';
import { FarmsView } from './views/FarmsView';
import { SensorsView } from './views/SensorsView';
import { DiseaseScreeningView } from './views/DiseaseScreeningView';
import { AdvisoryView } from './views/AdvisoryView';
import { MarketplaceView } from './views/MarketplaceView';
import { TransportView } from './views/TransportView';
import { StorageView } from './views/StorageView';
import { SimulatorsView } from './views/SimulatorsView';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [screeningFarmId, setScreeningFarmId] = useState<number>(14);

  const handleScreenFarm = (farmId: number) => {
    setScreeningFarmId(farmId);
    setActiveTab('disease');
  };

  return (
    <div className="min-h-screen bg-[#0a120c] text-gray-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSensorModal={() => setIsSensorModalOpen(true)}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView setActiveTab={setActiveTab} onScreenFarm={handleScreenFarm} />
        )}
        {activeTab === 'farms' && (
          <FarmsView onScreenFarm={handleScreenFarm} />
        )}
        {activeTab === 'sensors' && (
          <SensorsView onOpenSensorModal={() => setIsSensorModalOpen(true)} />
        )}
        {activeTab === 'disease' && (
          <DiseaseScreeningView initialFarmId={screeningFarmId} />
        )}
        {activeTab === 'advisories' && (
          <AdvisoryView />
        )}
        {activeTab === 'marketplace' && (
          <MarketplaceView />
        )}
        {activeTab === 'transport' && (
          <TransportView />
        )}
        {activeTab === 'storage' && (
          <StorageView />
        )}
        {activeTab === 'simulators' && (
          <SimulatorsView />
        )}
      </main>

      {/* Interactive 15-Step Hackathon Walkthrough Floating Controller */}
      <HackathonDemoModal setActiveTab={setActiveTab} />

      {/* Modals */}
      <SensorPacketModal
        isOpen={isSensorModalOpen}
        onClose={() => setIsSensorModalOpen(false)}
      />
      <CodeViewerModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[#1a2d1f] bg-[#0c140e] py-6 text-xs text-gray-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-300">MundaSense Zambia</span>
            <span>·</span>
            <span>AI-Assisted Smallholder Agricultural Intelligence Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>USSD: *2873#</span>
            <span>·</span>
            <span>LoRaWAN EU868</span>
            <span>·</span>
            <span className="text-emerald-400">108 Farms / 3 Hubs</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
