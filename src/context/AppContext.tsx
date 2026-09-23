import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
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
import {
  DEMO_USERS,
  SENSOR_HUBS,
  SEED_FARMS,
  INITIAL_READINGS,
  SEED_STORAGE_UNITS,
  SEED_MARKETPLACE_LISTINGS,
  SEED_ORDERS,
  SEED_TRANSPORT_REQUESTS,
  SEED_TRANSPORT_BIDS,
  SEED_ADVISORIES,
  SEED_REPORTS,
  SEED_SMS_MESSAGES,
} from '../data/seedData';
import { screenCropImage, assessEnvironmentalRisk } from '../services/diseaseEngine';
import { handleUSSDRequest } from '../services/ussdEngine';
import { processInboundSMS } from '../services/smsEngine';

interface AppContextType {
  // State
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
  currentUser: User;
  stats: SystemStats;
  selectedFarm: Farm | null;
  activeProvinceFilter: string;
  activeCropFilter: string;
  activeStatusFilter: string;
  demoStep: number;
  isDemoRunning: boolean;

  // Setters / Actions
  setCurrentUserRole: (role: Role) => void;
  setSelectedFarm: (farm: Farm | null) => void;
  setActiveProvinceFilter: (p: string) => void;
  setActiveCropFilter: (c: string) => void;
  setActiveStatusFilter: (s: string) => void;

  // Workflows
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

  // Guided demo controls
  startGuidedDemo: () => void;
  advanceDemoStep: (step?: number) => void;
  stopGuidedDemo: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY_PREFIX = 'mundasense_v1_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS[0]); // Default admin
  const [farms, setFarms] = useState<Farm[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}farms`);
      return saved ? JSON.parse(saved) : SEED_FARMS;
    } catch {
      return SEED_FARMS;
    }
  });

  const [hubs, setHubs] = useState<SensorHub[]>(SENSOR_HUBS);
  const [hubReadings, setHubReadings] = useState<Record<number, SensorReading[]>>(INITIAL_READINGS);
  const [storageUnits, setStorageUnits] = useState<StorageUnit[]>(SEED_STORAGE_UNITS);
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}listings`);
      return saved ? JSON.parse(saved) : SEED_MARKETPLACE_LISTINGS;
    } catch {
      return SEED_MARKETPLACE_LISTINGS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [transportRequests, setTransportRequests] = useState<TransportRequest[]>(SEED_TRANSPORT_REQUESTS);
  const [transportBids, setTransportBids] = useState<TransportBid[]>(SEED_TRANSPORT_BIDS);
  const [advisories, setAdvisories] = useState<Advisory[]>(SEED_ADVISORIES);
  const [cropReports, setCropReports] = useState<CropHealthReport[]>(SEED_REPORTS);
  const [smsMessages, setSmsMessages] = useState<SMSMessage[]>(SEED_SMS_MESSAGES);

  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [activeProvinceFilter, setActiveProvinceFilter] = useState<string>('all');
  const [activeCropFilter, setActiveCropFilter] = useState<string>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');

  const [demoStep, setDemoStep] = useState<number>(0);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);

  // Sync key items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}farms`, JSON.stringify(farms));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}listings`, JSON.stringify(marketplaceListings));
    } catch {}
  }, [farms, marketplaceListings]);

  // Derived statistics
  const stats = useMemo<SystemStats>(() => {
    const totalFarms = farms.length;
    const healthyFarms = farms.filter((f) => f.health_status === 'healthy').length;
    const watchFarms = farms.filter((f) => f.health_status === 'watch').length;
    const alertFarms = farms.filter((f) => f.health_status === 'alert').length;

    const avgSoilMoisture = Number(
      (farms.reduce((acc, f) => acc + f.soil_moisture, 0) / (totalFarms || 1)).toFixed(1)
    );

    const highCount = farms.filter((f) => f.disease_risk === 'HIGH').length;
    const watchRiskCount = farms.filter((f) => f.disease_risk === 'WATCH').length;
    const diseaseRiskOverview: RiskLevel = highCount > 5 ? 'HIGH' : watchRiskCount > 15 ? 'WATCH' : 'LOW';

    const storageAlerts = storageUnits.filter((s) => s.status === 'critical').length;
    const openOrders = orders.filter((o) => o.status === 'pending').length;
    const openTransport = transportRequests.filter((t) => t.status === 'open').length;

    const provinces = {
      Eastern: farms.filter((f) => f.province === 'Eastern').length,
      Lusaka: farms.filter((f) => f.province === 'Lusaka').length,
      Central: farms.filter((f) => f.province === 'Central').length,
    };

    return {
      totalFarms,
      healthyFarms,
      watchFarms,
      alertFarms,
      avgSoilMoisture,
      diseaseRiskOverview,
      storageAlerts,
      openOrders,
      transportRequests: openTransport,
      provinces,
    };
  }, [farms, storageUnits, orders, transportRequests]);

  const setCurrentUserRole = useCallback((role: Role) => {
    const user = DEMO_USERS.find((u) => u.role === role) || DEMO_USERS[0];
    setCurrentUser(user);
  }, []);

  // Sensor reading injection (simulating ESP32 HTTP POST packet)
  const pushSensorReading = useCallback((hubId: number, reading: Partial<SensorReading>) => {
    const now = new Date().toISOString();
    const newEntry: SensorReading = {
      id: Date.now(),
      hub_id: hubId,
      soil_moisture_15cm: reading.soil_moisture_15cm ?? 24.5,
      soil_moisture_30cm: reading.soil_moisture_30cm ?? 28.0,
      soil_moisture_60cm: reading.soil_moisture_60cm ?? 32.0,
      temperature: reading.temperature ?? 27.4,
      humidity: reading.humidity ?? 78.2,
      rainfall: reading.rainfall ?? 0,
      recorded_at: now,
    };

    setHubReadings((prev) => {
      const existing = prev[hubId] || [];
      return {
        ...prev,
        [hubId]: [...existing.slice(-23), newEntry],
      };
    });

    // Cascade to all farms attached to this hub
    setFarms((prev) =>
      prev.map((farm) => {
        if (farm.hub_id !== hubId) return farm;

        const offset = ((farm.id % 7) - 3) * 0.8;
        const newMoisture = Math.max(10, Math.min(65, Number((newEntry.soil_moisture_30cm + offset).toFixed(1))));

        // Recompute environmental risk
        const { risk } = assessEnvironmentalRisk(
          newEntry.humidity,
          newEntry.temperature,
          newEntry.rainfall,
          newMoisture,
          farm.crop_stage
        );

        let newHealth: 'healthy' | 'watch' | 'alert' = 'healthy';
        if (newMoisture < 20 || risk === 'HIGH') {
          newHealth = 'alert';
        } else if (newMoisture < 30 || risk === 'WATCH') {
          newHealth = 'watch';
        }

        return {
          ...farm,
          soil_moisture: newMoisture,
          disease_risk: risk,
          health_status: newHealth,
        };
      })
    );
  }, []);

  // Weather simulation
  const runWeatherEvent = useCallback(
    (type: 'rain' | 'drought' | 'heatwave') => {
      if (type === 'rain') {
        pushSensorReading(1, {
          soil_moisture_15cm: 36.5,
          soil_moisture_30cm: 39.2,
          soil_moisture_60cm: 42.0,
          temperature: 23.5,
          humidity: 89.0,
          rainfall: 14.8,
        });
      } else if (type === 'drought') {
        pushSensorReading(1, {
          soil_moisture_15cm: 14.2,
          soil_moisture_30cm: 18.5,
          soil_moisture_60cm: 23.0,
          temperature: 32.8,
          humidity: 34.0,
          rainfall: 0,
        });
      } else {
        pushSensorReading(1, {
          soil_moisture_15cm: 21.0,
          soil_moisture_30cm: 25.4,
          soil_moisture_60cm: 29.0,
          temperature: 35.2,
          humidity: 42.0,
          rainfall: 0,
        });
      }
    },
    [pushSensorReading]
  );

  // Disease screening pipeline
  const analyzeDisease = useCallback(
    async (farmId: number, crop: string, imagePayload: string): Promise<CropHealthReport> => {
      const report = await screenCropImage(crop, imagePayload, farmId);
      const farm = farms.find((f) => f.id === farmId);
      report.farm_name = farm ? farm.name : `Farm #${farmId}`;

      setCropReports((prev) => [report, ...prev]);

      // Update the farm's risk & health status based on the screening
      setFarms((prev) =>
        prev.map((f) => {
          if (f.id !== farmId) return f;
          let newStatus = f.health_status;
          if (report.risk_level === 'HIGH') newStatus = 'alert';
          else if (report.risk_level === 'WATCH' && newStatus === 'healthy') newStatus = 'watch';

          return {
            ...f,
            disease_risk: report.risk_level,
            health_status: newStatus,
          };
        })
      );

      // Trigger automatic SMS alert to the farmer
      const farmerPhone = farm?.phone || '+260970000002';
      const alertMsg = `MundaSense Screening (${report.crop}): ${report.predicted_disease} (${Math.round(report.confidence * 100)}% confidence). ${report.recommendation}`;
      setSmsMessages((prev) => [
        {
          id: Date.now(),
          phone: farmerPhone,
          direction: 'out',
          message: alertMsg,
          category: 'Disease Screening',
          status: 'delivered',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      return report;
    },
    [farms]
  );

  // Advisory generator
  const generateAndDispatchAdvisories = useCallback(() => {
    const generated: Advisory[] = [];
    const now = new Date().toISOString();

    farms.forEach((farm) => {
      // Irrigation advisory
      if (farm.soil_moisture < 25) {
        generated.push({
          id: Date.now() + generated.length,
          farm_id: farm.id,
          farm_name: farm.name,
          village: farm.village,
          province: farm.province,
          crop: farm.crop,
          channel: 'SMS',
          category: 'Irrigation',
          message:
            farm.language === 'Bemba'
              ? `Amenshi mu mushili pa 30cm ni pachepa (${farm.soil_moisture}%). Nshiteni ${farm.crop} yenu mu nshiku shibili.`
              : farm.language === 'Nyanja'
              ? `Madzi m'nthaka pa 30cm ndi ochepa (${farm.soil_moisture}%). Thirani ${farm.crop} masiku awiri.`
              : `Soil moisture at 30cm is critically low (${farm.soil_moisture}%). Irrigate your ${farm.crop} within 24 hours.`,
          language: farm.language,
          status: 'delivered',
          created_at: now,
        });
      }

      // Disease advisory
      if (farm.disease_risk === 'HIGH') {
        generated.push({
          id: Date.now() + generated.length + 1000,
          farm_id: farm.id,
          farm_name: farm.name,
          village: farm.village,
          province: farm.province,
          crop: farm.crop,
          channel: 'SMS',
          category: 'Disease',
          message: `DISEASE ALERT: Environmental conditions favor rapid foliar disease spread in ${farm.village}. Inspect ${farm.crop} leaves for unusual lesions today.`,
          language: farm.language,
          status: 'delivered',
          created_at: now,
        });
      }
    });

    setAdvisories((prev) => [...generated, ...prev]);
    return generated.length;
  }, [farms]);

  // Marketplace: create listing
  const publishListing = useCallback(
    (item: Omit<MarketplaceListing, 'id' | 'created_at' | 'status'>) => {
      const newListing: MarketplaceListing = {
        ...item,
        id: Date.now(),
        status: 'available',
        created_at: new Date().toISOString(),
      };
      setMarketplaceListings((prev) => [newListing, ...prev]);
      return newListing;
    },
    []
  );

  // Marketplace: place order
  const createOrder = useCallback(
    (listingId: number, quantityKg: number, buyerAddress = 'National Milling Lusaka Central') => {
      const listing = marketplaceListings.find((l) => l.id === listingId);
      if (!listing) throw new Error('Listing not found');

      const totalZmw = Number((quantityKg * listing.price_per_kg_zmw).toFixed(2));
      const newOrder: Order = {
        id: 218, // Preset ID for demo flow or Date.now()
        listing_id: listing.id,
        crop: listing.crop,
        buyer_id: currentUser.id,
        buyer_name: currentUser.full_name,
        seller_name: listing.seller_name,
        quantity_kg: quantityKg,
        total_zmw: totalZmw,
        delivery_address: buyerAddress,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== 218)]);

      // Mark listing reserved
      setMarketplaceListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, status: 'reserved' } : l))
      );

      // Dispatch SMS to seller
      const sellerPhone = '+260970000002'; // Demo farmer
      const orderSMS = `NEW ORDER #218: ${quantityKg.toLocaleString()} kg ${listing.crop}. Total: ZMW ${totalZmw.toLocaleString()}. Reply: YES 218 or NO 218.`;
      setSmsMessages((prev) => [
        {
          id: Date.now(),
          phone: sellerPhone,
          direction: 'out',
          message: orderSMS,
          category: 'Order Notification',
          status: 'delivered',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      return newOrder;
    },
    [marketplaceListings, currentUser]
  );

  // Handle Order YES / NO confirmation
  const handleOrderResponse = useCallback((orderId: number, confirmed: boolean) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: confirmed ? 'confirmed' : 'cancelled',
            }
          : o
      )
    );
  }, []);

  // Transport requests & bidding
  const createTransportRequest = useCallback(
    (req: Omit<TransportRequest, 'id' | 'created_at' | 'status'>) => {
      const newReq: TransportRequest = {
        ...req,
        id: 42, // Preset demo ID
        status: 'open',
        created_at: new Date().toISOString(),
      };
      setTransportRequests((prev) => [newReq, ...prev.filter((r) => r.id !== 42)]);

      // Dispatch alert SMS to transporters
      const smsText = `NEW TRANSPORT REQUEST TR-42: ${newReq.pickup_location} -> ${newReq.dropoff_location}, ${newReq.weight_kg}kg. Budget: ZMW ${newReq.budget_zmw}. Submit bids on MundaSense dashboard.`;
      setSmsMessages((prev) => [
        {
          id: Date.now(),
          phone: '+260970000005',
          direction: 'out',
          message: smsText,
          category: 'Transport Broadcast',
          status: 'delivered',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      return newReq;
    },
    []
  );

  const submitTransportBid = useCallback(
    (bid: Omit<TransportBid, 'id' | 'created_at' | 'status'>) => {
      const newBid: TransportBid = {
        ...bid,
        id: Date.now(),
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      setTransportBids((prev) => [newBid, ...prev]);
      return newBid;
    },
    []
  );

  const acceptTransportBid = useCallback(
    (bidId: number) => {
      const bid = transportBids.find((b) => b.id === bidId);
      if (!bid) return;

      setTransportBids((prev) =>
        prev.map((b) => {
          if (b.id === bidId) return { ...b, status: 'accepted' };
          if (b.request_id === bid.request_id) return { ...b, status: 'rejected' };
          return b;
        })
      );

      setTransportRequests((prev) =>
        prev.map((r) => (r.id === bid.request_id ? { ...r, status: 'assigned' } : r))
      );

      // Dispatch SMS to both parties
      const req = transportRequests.find((r) => r.id === bid.request_id);
      const transporterSMS = `JOB CONFIRMED TR-${bid.request_id}: Pickup at ${req?.pickup_location || 'Msekera'}. Price: ZMW ${bid.price_zmw}. Customer phone: +260970000002.`;
      const farmerSMS = `TRANSPORT ASSIGNED TR-${bid.request_id}: Transporter ${bid.transporter_name} accepted for ZMW ${bid.price_zmw}. ETA: ${bid.eta_hours}h.`;

      setSmsMessages((prev) => [
        {
          id: Date.now(),
          phone: bid.transporter_phone,
          direction: 'out',
          message: transporterSMS,
          category: 'Transport Confirmation',
          status: 'delivered',
          created_at: new Date().toISOString(),
        },
        {
          id: Date.now() + 1,
          phone: '+260970000002',
          direction: 'out',
          message: farmerSMS,
          category: 'Transport Confirmation',
          status: 'delivered',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [transportBids, transportRequests]
  );

  // Inbound SMS parser & processor
  const sendInboundSMS = useCallback(
    (phone: string, text: string): string => {
      // Record inbound
      setSmsMessages((prev) => [
        {
          id: Date.now(),
          phone,
          direction: 'in',
          message: text,
          category: 'Inbound SMS',
          status: 'received',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      const result = processInboundSMS(phone, text, farms, marketplaceListings, orders);

      if (result.orderAction) {
        handleOrderResponse(result.orderAction.orderId, result.orderAction.confirmed);
      }

      // Record outbound reply
      setSmsMessages((prev) => [
        {
          id: Date.now() + 1,
          phone,
          direction: 'out',
          message: result.reply,
          category: 'System Reply',
          status: 'delivered',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      return result.reply;
    },
    [farms, marketplaceListings, orders, handleOrderResponse]
  );

  // USSD query handler
  const queryUSSD = useCallback(
    (phone: string, text: string) => {
      return handleUSSDRequest(
        text,
        phone,
        farms,
        marketplaceListings,
        (p) => {
          // Extension officer callback hook
          setSmsMessages((prev) => [
            {
              id: Date.now(),
              phone: p,
              direction: 'out',
              message: 'MundaSense: Callback request logged. Officer Cosmas Lungu will call you today.',
              category: 'Callback',
              status: 'delivered',
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]);
        },
        (p, crop, qty) => {
          // Sell listing hook
          publishListing({
            seller_id: 2,
            seller_name: 'Chanda Mwape',
            crop: crop as any,
            grade: 'Grade A',
            quantity_kg: qty,
            price_per_kg_zmw: crop === 'Maize' ? 6.2 : 10.5,
            village: 'Msekera',
            district: 'Chipata',
            province: 'Eastern',
            description: `Bulked through USSD session from ${p}. Quality guaranteed.`,
          });
        }
      );
    },
    [farms, marketplaceListings, publishListing]
  );

  // Reset to initial demo baseline
  const resetDemoData = useCallback(() => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}farms`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}listings`);
    setFarms(SEED_FARMS);
    setHubs(SENSOR_HUBS);
    setHubReadings(INITIAL_READINGS);
    setStorageUnits(SEED_STORAGE_UNITS);
    setMarketplaceListings(SEED_MARKETPLACE_LISTINGS);
    setOrders(SEED_ORDERS);
    setTransportRequests(SEED_TRANSPORT_REQUESTS);
    setTransportBids(SEED_TRANSPORT_BIDS);
    setAdvisories(SEED_ADVISORIES);
    setCropReports(SEED_REPORTS);
    setSmsMessages(SEED_SMS_MESSAGES);
    setSelectedFarm(null);
    setDemoStep(0);
    setIsDemoRunning(false);
  }, []);

  // Guided demo walkthrough controls
  const startGuidedDemo = useCallback(() => {
    setIsDemoRunning(true);
    setDemoStep(1);
  }, []);

  const advanceDemoStep = useCallback((step?: number) => {
    setDemoStep((curr) => {
      const next = step !== undefined ? step : curr + 1;
      if (next > 15) {
        setIsDemoRunning(false);
        return 0;
      }
      return next;
    });
  }, []);

  const stopGuidedDemo = useCallback(() => {
    setIsDemoRunning(false);
    setDemoStep(0);
  }, []);

  return (
    <AppContext.Provider
      value={{
        farms,
        hubs,
        hubReadings,
        storageUnits,
        marketplaceListings,
        orders,
        transportRequests,
        transportBids,
        advisories,
        cropReports,
        smsMessages,
        currentUser,
        stats,
        selectedFarm,
        activeProvinceFilter,
        activeCropFilter,
        activeStatusFilter,
        demoStep,
        isDemoRunning,
        setCurrentUserRole,
        setSelectedFarm,
        setActiveProvinceFilter,
        setActiveCropFilter,
        setActiveStatusFilter,
        pushSensorReading,
        runWeatherEvent,
        analyzeDisease,
        generateAndDispatchAdvisories,
        publishListing,
        createOrder,
        handleOrderResponse,
        createTransportRequest,
        submitTransportBid,
        acceptTransportBid,
        sendInboundSMS,
        queryUSSD,
        resetDemoData,
        startGuidedDemo,
        advanceDemoStep,
        stopGuidedDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
