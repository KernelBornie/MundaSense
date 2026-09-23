import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginView } from './auth/LoginView';
import { RegisterView } from './auth/RegisterView';
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
import { TrackTransportView } from './views/TrackTransportView';
import { StorageView } from './views/StorageView';
import { SimulatorsView } from './views/SimulatorsView';

function MainLayout() {
  const { user, loading, logout } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [screeningFarmId, setScreeningFarmId] = useState<number>(14);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a120c] flex items-center justify-center text-emerald-400">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-800 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium">Loading MundaSense…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <LoginView onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterView onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  const handleScreenFarm = (farmId: number) => {
    setScreeningFarmId(farmId);
    setActiveTab('disease');
  };

  return (
    <div className="min-h-screen bg-[#0a120c] text-gray-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSensorModal={() => setIsSensorModalOpen(true)}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onLogout={logout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView setActiveTab={setActiveTab} onScreenFarm={handleScreenFarm} />
        )}
        {activeTab === 'farms' && <FarmsView onScreenFarm={handleScreenFarm} />}
        {activeTab === 'sensors' && <SensorsView onOpenSensorModal={() => setIsSensorModalOpen(true)} />}
        {activeTab === 'disease' && <DiseaseScreeningView initialFarmId={screeningFarmId} />}
        {activeTab === 'advisories' && <AdvisoryView />}
        {activeTab === 'marketplace' && <MarketplaceView />}
        {activeTab === 'transport' && <TransportView />}
        {activeTab === 'tracking' && <TrackTransportView requestId={42} />}
        {activeTab === 'storage' && <StorageView />}
        {activeTab === 'simulators' && <SimulatorsView />}
      </main>

      <HackathonDemoModal setActiveTab={setActiveTab} />
      <SensorPacketModal isOpen={isSensorModalOpen} onClose={() => setIsSensorModalOpen(false)} />
      <CodeViewerModal isOpen={isCodeModalOpen} onClose={() => setIsCodeModalOpen(false)} />

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
}

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
