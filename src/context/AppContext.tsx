import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Farm,
  SensorHub,
  SensorReading,
  StorageUnit,
  MarketplaceListing,
  Order,
  TransportRequest,
  TransportBid,
  Advisory,
  CropHealthReport,
  SMSMessage,
  User,
  Role,
  RiskLevel,
  SystemStats,
} from '../types';

interface AppContextType {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  setCurrentUserRole: (role: Role) => void;
  logout: () => void;

  // View state & helpers for legacy components/modals
  farms: Farm[];
  hubs: SensorHub[];
  hubReadings: Record<number, SensorReading[]>;
  storageUnits: StorageUnit[];
  marketplaceListings: MarketplaceListing[];
  orders: Order[];
  transportRequests: TransportRequest[];
  transportBids: TransportBid[];
  advisories: Advisory[];
  cropReports: CropHealthReport[];
  smsMessages: SMSMessage[];
  stats: SystemStats;
  selectedFarm: Farm | null;
  activeProvinceFilter: string;
  activeCropFilter: string;
  activeStatusFilter: string;
  demoStep: number;
  isDemoRunning: boolean;

  setSelectedFarm: (farm: Farm | null) => void;
  setActiveProvinceFilter: (p: string) => void;
  setActiveCropFilter: (c: string) => void;
  setActiveStatusFilter: (s: string) => void;

  pushSensorReading: (hubId: number, reading: Partial<SensorReading>) => void;
  runWeatherEvent: (type: 'rain' | 'drought' | 'heatwave') => void;
  analyzeDisease: (farmId: number, crop: string, imagePayload: string) => Promise<CropHealthReport>;
  generateAndDispatchAdvisories: () => number;
  publishListing: (listing: Omit<MarketplaceListing, 'id' | 'created_at' | 'status'>) => MarketplaceListing;
  createOrder: (listingId: number, quantityKg: number, buyerAddress?: string) => Order;
  handleOrderResponse: (orderId: number, confirmed: boolean) => void;
  createTransportRequest: (req: Omit<TransportRequest, 'id' | 'created_at' | 'status'>) => TransportRequest;
  submitTransportBid: (bid: Omit<TransportBid, 'id' | 'created_at' | 'status'>) => TransportBid;
  acceptTransportBid: (bidId: number) => void;
  sendInboundSMS: (phone: string, text: string) => string;
  queryUSSD: (phone: string, text: string) => { response: string; isEnd: boolean };
  resetDemoData: () => void;

  startGuidedDemo: () => void;
  advanceDemoStep: (step?: number) => void;
  stopGuidedDemo: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_USERS: Record<Role, User> = {
  admin: {
    id: 1,
    phone: '+260974684713',
    full_name: 'Dr. Mwamba Chilufya',
    role: 'admin',
    province: 'Eastern',
    village: 'Msekera',
    email: 'admin@mundasense.zm',
    language: 'English',
  },
  farmer: {
    id: 2,
    phone: '+260970000002',
    full_name: 'Chanda Mwape',
    role: 'farmer',
    province: 'Eastern',
    village: 'Msekera',
    email: 'farmer@mundasense.zm',
    language: 'Bemba',
  },
  seller: {
    id: 4,
    phone: '+260970000004',
    full_name: 'Eastern Province Cooperative Union',
    role: 'seller',
    province: 'Eastern',
    village: 'Chipata',
    email: 'seller@mundasense.zm',
    language: 'English',
  },
  customer: {
    id: 3,
    phone: '+260970000003',
    full_name: 'National Milling Corporation',
    role: 'customer',
    province: 'Lusaka',
    village: 'Industrial Area',
    email: 'buyer@mundasense.zm',
    language: 'English',
  },
  transporter: {
    id: 5,
    phone: '+260970000005',
    full_name: 'ZamCargo Logistics',
    role: 'transporter',
    province: 'Lusaka',
    village: 'Heavy Industrial Area',
    email: 'transporter@mundasense.zm',
    language: 'English',
  },
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USERS.admin);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [hubs, setHubs] = useState<SensorHub[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [activeProvinceFilter, setActiveProvinceFilter] = useState<string>('all');
  const [activeCropFilter, setActiveCropFilter] = useState<string>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [demoStep, setDemoStep] = useState<number>(0);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);

  // Poll /api/farms and /api/sensors/hubs for live data across legacy components (e.g. FarmMap)
  useEffect(() => {
    let alive = true;
    const fetchRealData = async () => {
      try {
        const [farmRes, hubRes] = await Promise.all([
          fetch('/api/farms'),
          fetch('/api/sensors/hubs'),
        ]);
        if (alive && farmRes.ok) {
          const farmData = await farmRes.json();
          setFarms(farmData);
        }
        if (alive && hubRes.ok) {
          const hubData = await hubRes.json();
          setHubs(hubData);
        }
      } catch (e) {
        // silent catch
      }
    };

    fetchRealData();
    const interval = setInterval(fetchRealData, 5000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  const setCurrentUserRole = useCallback((role: Role) => {
    const user = DEFAULT_USERS[role] || DEFAULT_USERS.admin;
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ms_token');
    setCurrentUser(DEFAULT_USERS.admin);
  }, []);

  const stats = useMemo<SystemStats>(() => {
    const totalFarms = farms.length;
    const healthyFarms = farms.filter((f) => f.health_status === 'healthy').length;
    const watchFarms = farms.filter((f) => f.health_status === 'watch').length;
    const alertFarms = farms.filter((f) => f.health_status === 'alert').length;

    const avgSoilMoisture = Number(
      (farms.reduce((acc, f) => acc + (Number(f.soil_moisture) || 0), 0) / (totalFarms || 1)).toFixed(1)
    );

    const highCount = farms.filter((f) => f.disease_risk === 'HIGH').length;
    const watchRiskCount = farms.filter((f) => f.disease_risk === 'WATCH').length;
    const diseaseRiskOverview: RiskLevel = highCount > 5 ? 'HIGH' : watchRiskCount > 15 ? 'WATCH' : 'LOW';

    return {
      totalFarms,
      healthyFarms,
      watchFarms,
      alertFarms,
      avgSoilMoisture,
      diseaseRiskOverview,
      storageAlerts: 0,
      openOrders: 0,
      transportRequests: 0,
      provinces: {
        Central: farms.filter((f) => f.province === 'Central').length,
        Copperbelt: farms.filter((f) => f.province === 'Copperbelt').length,
        Eastern: farms.filter((f) => f.province === 'Eastern').length,
        Luapula: farms.filter((f) => f.province === 'Luapula').length,
        Lusaka: farms.filter((f) => f.province === 'Lusaka').length,
        Muchinga: farms.filter((f) => f.province === 'Muchinga').length,
        Northern: farms.filter((f) => f.province === 'Northern').length,
        'North-Western': farms.filter((f) => f.province === 'North-Western').length,
        Southern: farms.filter((f) => f.province === 'Southern').length,
        Western: farms.filter((f) => f.province === 'Western').length,
      },
    };
  }, [farms]);

  const value: AppContextType = {
    currentUser,
    setCurrentUser,
    setCurrentUserRole,
    logout,
    farms,
    hubs,
    hubReadings: {},
    storageUnits: [],
    marketplaceListings: [],
    orders: [],
    transportRequests: [],
    transportBids: [],
    advisories: [],
    cropReports: [],
    smsMessages: [],
    stats,
    selectedFarm,
    activeProvinceFilter,
    activeCropFilter,
    activeStatusFilter,
    demoStep,
    isDemoRunning,
    setSelectedFarm,
    setActiveProvinceFilter,
    setActiveCropFilter,
    setActiveStatusFilter,
    pushSensorReading: () => {},
    runWeatherEvent: () => {},
    analyzeDisease: async () => ({} as any),
    generateAndDispatchAdvisories: () => 0,
    publishListing: () => ({} as any),
    createOrder: () => ({} as any),
    handleOrderResponse: () => {},
    createTransportRequest: () => ({} as any),
    submitTransportBid: () => ({} as any),
    acceptTransportBid: () => {},
    sendInboundSMS: () => 'OK',
    queryUSSD: () => ({ response: 'OK', isEnd: true }),
    resetDemoData: () => {},
    startGuidedDemo: () => setIsDemoRunning(true),
    advanceDemoStep: (step) => setDemoStep(step ?? 0),
    stopGuidedDemo: () => setIsDemoRunning(false),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
