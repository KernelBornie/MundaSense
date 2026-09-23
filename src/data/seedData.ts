import {
  Farm,
  SensorHub,
  SensorReading,
  StorageUnit,
  MarketplaceListing,
  Order,
  TransportRequest,
  TransportBid,
  SMSMessage,
  User,
  CropHealthReport,
  Advisory,
} from '../types';

export const DEMO_USERS: User[] = [
  {
    id: 1,
    email: 'admin@mundasense.zm',
    phone: '+260970000001',
    full_name: 'Dr. Joseph Banda (Admin)',
    role: 'admin',
    province: 'Lusaka',
    district: 'Lusaka Central',
    language: 'English',
  },
  {
    id: 2,
    email: 'farmer@mundasense.zm',
    phone: '+260970000002',
    full_name: 'Chanda Mwape (Smallholder)',
    role: 'farmer',
    village: 'Msekera',
    district: 'Chipata',
    province: 'Eastern',
    ziamis_id: 'ZM-EAS-84001',
    language: 'Bemba',
  },
  {
    id: 3,
    email: 'seller@mundasense.zm',
    phone: '+260970000004',
    full_name: 'Msekera Cooperative Union',
    role: 'seller',
    village: 'Msekera',
    district: 'Chipata',
    province: 'Eastern',
    language: 'Nyanja',
  },
  {
    id: 4,
    email: 'customer@mundasense.zm',
    phone: '+260970000003',
    full_name: 'National Milling Corporation (Buyer)',
    role: 'customer',
    province: 'Lusaka',
    district: 'Heavy Industrial',
    language: 'English',
  },
  {
    id: 5,
    email: 'transporter@mundasense.zm',
    phone: '+260970000005',
    full_name: 'ZamCargo Agri-Logistics',
    role: 'transporter',
    province: 'Eastern',
    district: 'Chipata Sub-depot',
    language: 'English',
  },
];

export const SENSOR_HUBS: SensorHub[] = [
  {
    id: 1,
    hub_code: 'HUB-MSEK-001',
    name: 'Msekera Cooperative Hub',
    province: 'Eastern',
    district: 'Chipata',
    latitude: -13.6333,
    longitude: 32.6500,
    coverage_radius_km: 8.5,
    battery: 94.2,
    solar_v: 5.85,
    signal_dbm: -88,
    uptime_h: 1420,
    last_seen: 'Just now (LoRaWAN)',
  },
  {
    id: 2,
    hub_code: 'HUB-CHONG-002',
    name: 'Chongwe Peri-Urban Hub',
    province: 'Lusaka',
    district: 'Chongwe',
    latitude: -15.3333,
    longitude: 28.6833,
    coverage_radius_km: 8.5,
    battery: 88.0,
    solar_v: 5.40,
    signal_dbm: -92,
    uptime_h: 960,
    last_seen: '2 mins ago (GSM/HTTP)',
  },
  {
    id: 3,
    hub_code: 'HUB-MKUS-003',
    name: 'Mkushi Agricultural Hub',
    province: 'Central',
    district: 'Mkushi',
    latitude: -13.6167,
    longitude: 29.3833,
    coverage_radius_km: 8.5,
    battery: 98.5,
    solar_v: 6.10,
    signal_dbm: -84,
    uptime_h: 2180,
    last_seen: 'Just now (LoRaWAN)',
  },
];

const FARMER_NAMES = [
  'Chanda Mwape', 'Grace Tembo', 'Brenda Phiri', 'Loveness Zulu', 'Malama Sakala',
  'Mutinta Siamachoka', 'Hachipuka Mweemba', 'Limbikani Banda', 'Ruth Mulenga',
  'Kondwani Ngoma', 'Eunice Chileshe', 'Agness Mbewe', 'Cosmas Lungu', 'Fredrick Kabwe',
  'Hellen Musonda', 'Natasha Chipili', 'Gift Nyirenda', 'Enock Siame', 'Idah Mwanza',
  'Oliver Kaunda', 'Veronicah Chilufya', 'Wamunyima Muleya', 'Xavier Sinkala',
  'Yvonne Bwalya', 'Zondani Kapata', 'Queen Mumba', 'Ulemu Chirwa', 'Moses Daka',
  'Loyce Kunda', 'Kelvin Mbulo', 'Joy Nkonde', 'Humphrey Simwanza', 'Godfrey Chola',
  'Florence Mukuka', 'Evelyn Nkandu', 'Davies Chibwe', 'Catherine Mweemba',
  'Beauty Hachipuka', 'Alice Siamachoka', 'Patrick Munsaka', 'Ostine Njobvu',
  'Mary Mwale', 'James Soko', 'Doreen Chomba', 'Peter Mwila', 'Charity Zimba',
  'Felix Gondwe', 'Theresa Kasapo', 'Benson Kalunga', 'Dorothy Sikazwe', 'Mathews Silwimba',
  'Beatrice Chola', 'George Sichone', 'Prudence Chanda', 'Elias Simukonda', 'Mercy Kampamba'
];

const CROPS = ['Maize', 'Groundnuts', 'Soybeans', 'Sunflower', 'Cotton'] as const;
const STAGES = ['Vegetative (V6)', 'VT (Tasseling)', 'Grain Fill (R3)', 'Flowering', 'Pod Fill', 'Maturity'] as const;
const SOILS = ['Sandy Loam', 'Clay Loam', 'Red Ferrosol', 'Alluvial Silt'];
const LANGUAGES = ['Bemba', 'Nyanja', 'Tonga', 'Lozi', 'English'];

const VILLAGES_EASTERN = ['Msekera', 'Kalongoma', 'Chikuwe', 'Kanjeza', 'Mnkhanya', 'Kapata Ward', 'Mwami Border', 'Feni', 'Chitandika', 'Msoro'];
const VILLAGES_LUSAKA = ['Chongwe Ward 4', 'Kafue Flats', 'Rufunsa East', 'Luangwa Feeder', 'Chilanga Valley', 'Palabana West', 'Shantumbu'];
const VILLAGES_CENTRAL = ['Mkushi Block A', 'Mumbwa Turnoff', 'Chibombo South', 'Serenje Road', 'Kapiri West', 'Kabwe Rural', 'Chalata'];

export function generate108Farms(): Farm[] {
  const farms: Farm[] = [];
  let id = 1;

  // Exact target health statuses: 82 healthy, 18 watch, 8 alert = 108 total
  const statuses: ('healthy' | 'watch' | 'alert')[] = [
    ...Array(82).fill('healthy'),
    ...Array(18).fill('watch'),
    ...Array(8).fill('alert'),
  ];

  // Specific distribution: Eastern: 40, Lusaka: 35, Central: 33 = 108
  const distribution: { province: 'Eastern' | 'Lusaka' | 'Central'; count: number; hubId: number; hubLat: number; hubLon: number; villages: string[] }[] = [
    { province: 'Eastern', count: 40, hubId: 1, hubLat: -13.6333, hubLon: 32.6500, villages: VILLAGES_EASTERN },
    { province: 'Lusaka', count: 35, hubId: 2, hubLat: -15.3333, hubLon: 28.6833, villages: VILLAGES_LUSAKA },
    { province: 'Central', count: 33, hubId: 3, hubLat: -13.6167, hubLon: 29.3833, villages: VILLAGES_CENTRAL },
  ];

  let statusIndex = 0;

  for (const group of distribution) {
    for (let i = 0; i < group.count; i++) {
      const status = statuses[statusIndex++];
      const name = FARMER_NAMES[(id - 1) % FARMER_NAMES.length] + (id > FARMER_NAMES.length ? ` ${String.fromCharCode(64 + Math.floor(id / FARMER_NAMES.length))}` : '');
      const village = group.villages[i % group.villages.length];
      const crop = CROPS[(id * 3 + i) % CROPS.length];
      const stage = STAGES[(id + i) % STAGES.length];
      const soilType = SOILS[(id * 2 + i) % SOILS.length];
      const language = group.province === 'Eastern' ? 'Nyanja' : (group.province === 'Central' ? 'Bemba' : 'English');

      // Controlled coordinates within ~7.5km radius of each hub
      const angle = (i / group.count) * 2 * Math.PI;
      const dist = 0.015 + ((i % 5) * 0.011);
      const lat = group.hubLat + Math.sin(angle) * dist;
      const lon = group.hubLon + Math.cos(angle) * dist;

      // Realistic soil moisture matched to health status
      let soilMoisture = 38.5;
      let diseaseRisk: 'LOW' | 'WATCH' | 'HIGH' = 'LOW';

      if (status === 'alert') {
        soilMoisture = Number((14.0 + (i % 6) * 1.5).toFixed(1)); // Very dry
        diseaseRisk = 'HIGH';
      } else if (status === 'watch') {
        soilMoisture = Number((26.0 + (i % 5) * 1.2).toFixed(1)); // Borderline
        diseaseRisk = 'WATCH';
      } else {
        soilMoisture = Number((34.0 + (i % 12) * 1.1).toFixed(1)); // Optimal
        diseaseRisk = 'LOW';
      }

      farms.push({
        id,
        farmer_id: id === 1 ? 2 : 100 + id,
        hub_id: group.hubId,
        ziamis_id: `ZM-${group.province.substring(0, 3).toUpperCase()}-${84000 + id}`,
        name,
        phone: `+26097${String(1000000 + id * 31).padStart(7, '0')}`,
        village,
        district: group.province === 'Eastern' ? 'Chipata' : (group.province === 'Lusaka' ? 'Chongwe' : 'Mkushi'),
        province: group.province,
        latitude: Number(lat.toFixed(4)),
        longitude: Number(lon.toFixed(4)),
        crop,
        crop_stage: stage,
        soil_type: soilType,
        area_hectares: Number((0.8 + ((id * 7) % 35) / 10).toFixed(1)),
        soil_moisture: soilMoisture,
        health_status: status,
        disease_risk: diseaseRisk,
        language,
        created_at: '2026-09-01T08:00:00Z',
      });
      id++;
    }
  }

  return farms;
}

export const SEED_FARMS: Farm[] = generate108Farms();

export function generate24HourReadings(hubId: number): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = new Date('2026-09-23T09:00:00Z').getTime();

  for (let hr = 23; hr >= 0; hr--) {
    const ts = new Date(now - hr * 3600 * 1000).toISOString();
    const cycle = Math.sin((24 - hr) / 24 * Math.PI * 2);
    const temp = Number((21.5 + cycle * 6.5 + (hubId * 0.4)).toFixed(1));
    const hum = Number((78.0 - cycle * 22.0 + ((hr % 3) * 1.2)).toFixed(1));
    const soil15 = Number((24.5 + cycle * 2.0).toFixed(1));
    const soil30 = Number((28.8 + cycle * 1.2).toFixed(1));
    const soil60 = Number((33.2 + cycle * 0.5).toFixed(1));
    const rain = hr === 4 || hr === 5 ? 4.2 : 0;

    readings.push({
      id: 1000 - hr + (hubId * 100),
      hub_id: hubId,
      soil_moisture_15cm: soil15,
      soil_moisture_30cm: soil30,
      soil_moisture_60cm: soil60,
      temperature: temp,
      humidity: hum,
      rainfall: rain,
      recorded_at: ts,
    });
  }

  return readings;
}

export const INITIAL_READINGS: Record<number, SensorReading[]> = {
  1: generate24HourReadings(1),
  2: generate24HourReadings(2),
  3: generate24HourReadings(3),
};

export const SEED_STORAGE_UNITS: StorageUnit[] = [
  {
    id: 1,
    name: 'Msekera Community Hermetic Silo A',
    location: 'Cooperative Depot, Zone 1',
    province: 'Eastern',
    crop: 'Maize',
    bags: 1420,
    capacity: 2000,
    grain_moisture: 14.3,
    temperature: 24.2,
    air_humidity: 74,
    status: 'critical',
    updated_at: '10 mins ago',
  },
  {
    id: 2,
    name: 'Kalongoma Aggregation Silo B',
    location: 'Kalongoma Feeder Depot',
    province: 'Eastern',
    crop: 'Maize',
    bags: 1180,
    capacity: 1500,
    grain_moisture: 16.8,
    temperature: 28.5,
    air_humidity: 84,
    status: 'critical',
    updated_at: '15 mins ago',
  },
  {
    id: 3,
    name: 'Chikuwe Pulses Hermetic Store',
    location: 'Chikuwe Agri-Bulking Shed',
    province: 'Eastern',
    crop: 'Groundnuts',
    bags: 620,
    capacity: 800,
    grain_moisture: 11.0,
    temperature: 23.0,
    air_humidity: 69,
    status: 'ok',
    updated_at: '25 mins ago',
  },
];

export const SEED_MARKETPLACE_LISTINGS: MarketplaceListing[] = [
  {
    id: 1,
    seller_id: 3,
    seller_name: 'Msekera Cooperative Union',
    crop: 'Maize',
    variety: 'SC647 (White Non-GMO)',
    grade: 'Grade A',
    quantity_kg: 30000,
    price_per_kg_zmw: 6.20,
    village: 'Msekera',
    district: 'Chipata',
    province: 'Eastern',
    description: 'Freshly bulked white maize from 18 cooperative farms, grain moisture tested at 12.6%. Ready for warehouse collection.',
    status: 'available',
    created_at: '2026-09-22T14:00:00Z',
  },
  {
    id: 2,
    seller_id: 3,
    seller_name: 'Kalongoma Smallholders',
    crop: 'Maize',
    variety: 'Pan53 Early Maturity',
    grade: 'Grade A',
    quantity_kg: 22000,
    price_per_kg_zmw: 6.10,
    village: 'Kalongoma',
    district: 'Chipata',
    province: 'Eastern',
    description: 'Cleaned and bagged in standard 50kg polypropylene bags, certified aflatoxin-free.',
    status: 'available',
    created_at: '2026-09-22T16:30:00Z',
  },
  {
    id: 3,
    seller_id: 2,
    seller_name: 'Chanda Mwape (Msekera Farm 01)',
    crop: 'Maize',
    variety: 'SC647 Premium',
    grade: 'Grade A',
    quantity_kg: 1000,
    price_per_kg_zmw: 6.40,
    village: 'Msekera',
    district: 'Chipata',
    province: 'Eastern',
    description: 'Harvested directly from Msekera farm plot #01. Sun-dried to 12.4% moisture.',
    status: 'available',
    created_at: '2026-09-23T07:15:00Z',
  },
  {
    id: 4,
    seller_id: 3,
    seller_name: 'Chikuwe Women Agro-Group',
    crop: 'Groundnuts',
    variety: 'MGV4 Confectionery',
    grade: 'Export Confectionery',
    quantity_kg: 8000,
    price_per_kg_zmw: 10.80,
    village: 'Chikuwe',
    district: 'Chipata',
    province: 'Eastern',
    description: 'Hand-sorted, uniform large kernels, low aflatoxin guaranteed for peanut paste processors.',
    status: 'available',
    created_at: '2026-09-21T11:00:00Z',
  },
  {
    id: 5,
    seller_id: 1,
    seller_name: 'Chongwe Green Farms',
    crop: 'Soybeans',
    variety: 'Tikolore High Oil',
    grade: 'Grade A',
    quantity_kg: 15000,
    price_per_kg_zmw: 8.50,
    village: 'Chongwe Ward 4',
    district: 'Chongwe',
    province: 'Lusaka',
    description: 'High oil extraction percentage, cleaned and destoned.',
    status: 'available',
    created_at: '2026-09-22T09:20:00Z',
  },
  {
    id: 6,
    seller_id: 1,
    seller_name: 'Mkushi Commercial Aggregator',
    crop: 'Sunflower',
    variety: 'Milika Black Seed',
    grade: 'Oil Pressing Grade',
    quantity_kg: 6000,
    price_per_kg_zmw: 7.60,
    village: 'Mkushi Block A',
    district: 'Mkushi',
    province: 'Central',
    description: 'Fully sun-cured black sunflower seeds, high crushing yield.',
    status: 'available',
    created_at: '2026-09-20T10:00:00Z',
  },
];

export const SEED_ORDERS: Order[] = [
  {
    id: 218,
    listing_id: 3,
    crop: 'Maize',
    buyer_id: 4,
    buyer_name: 'National Milling Corporation',
    seller_name: 'Chanda Mwape',
    quantity_kg: 1000,
    total_zmw: 6400,
    delivery_address: 'National Milling Lusaka Depot, Cairo Road',
    status: 'pending',
    created_at: '2026-09-23T08:15:00Z',
  },
  {
    id: 217,
    listing_id: 4,
    crop: 'Groundnuts',
    buyer_id: 4,
    buyer_name: 'Olympic Milling Chipata',
    seller_name: 'Chikuwe Women Agro-Group',
    quantity_kg: 4000,
    total_zmw: 43200,
    delivery_address: 'Olympic Depot, Great East Road',
    status: 'confirmed',
    created_at: '2026-09-22T11:45:00Z',
  },
];

export const SEED_TRANSPORT_REQUESTS: TransportRequest[] = [
  {
    id: 42,
    customer_id: 2,
    customer_name: 'Chanda Mwape',
    order_id: 218,
    pickup_location: 'Msekera Cooperative Shed, Chipata',
    dropoff_location: 'National Milling Depot, Lusaka',
    cargo_description: '20 bags (1,000 kg) Maize Grain SC647',
    weight_kg: 1000,
    pickup_date: '2026-09-24',
    budget_zmw: 1900,
    status: 'open',
    created_at: '2026-09-23T08:30:00Z',
  },
  {
    id: 41,
    customer_id: 3,
    customer_name: 'Msekera Cooperative Union',
    pickup_location: 'Msekera Silo A, Chipata',
    dropoff_location: 'Food Reserve Agency (FRA) Central Depot',
    cargo_description: '600 bags (30,000 kg) White Maize',
    weight_kg: 30000,
    pickup_date: '2026-09-25',
    budget_zmw: 24000,
    status: 'assigned',
    created_at: '2026-09-22T17:00:00Z',
  },
];

export const SEED_TRANSPORT_BIDS: TransportBid[] = [
  {
    id: 101,
    request_id: 42,
    transporter_id: 5,
    transporter_name: 'ZamCargo Agri-Logistics',
    transporter_phone: '+260970000005',
    price_zmw: 1800,
    vehicle: 'Canter 3.5-Ton Tarpaulin Bed',
    eta_hours: 8,
    note: 'Returning empty from Chipata to Lusaka tomorrow morning. Fully tarped.',
    status: 'pending',
    created_at: '2026-09-23T08:45:00Z',
  },
  {
    id: 102,
    request_id: 42,
    transporter_id: 105,
    transporter_name: 'Luangwa FastFreight',
    transporter_phone: '+260971234567',
    price_zmw: 2100,
    vehicle: 'Isuzu NPR 5-Ton Box Truck',
    eta_hours: 7,
    note: 'Enclosed cargo box, GPS tracked route.',
    status: 'pending',
    created_at: '2026-09-23T09:00:00Z',
  },
];

export const SEED_ADVISORIES: Advisory[] = [
  {
    id: 1,
    farm_id: 42,
    farm_name: 'Msekera Farm #42 (Chanda Mwape)',
    village: 'Msekera',
    province: 'Eastern',
    crop: 'Maize',
    channel: 'SMS',
    category: 'Disease',
    message: 'DISEASE ALERT: High humidity (78%) and warm temps detected around Msekera. Inspect lower maize leaves for cigar-shaped blight lesions.',
    language: 'English',
    status: 'delivered',
    created_at: '2026-09-23T07:30:00Z',
  },
  {
    id: 2,
    farm_id: 14,
    farm_name: 'Kalongoma Farm #14',
    village: 'Kalongoma',
    province: 'Eastern',
    crop: 'Maize',
    channel: 'SMS',
    category: 'Irrigation',
    message: 'Amenshi mu mushili pa 30cm ni pachepa (22%). Nshiteni amabala yenu mu nshiku shibili. Imfula ileisa pa Thursday.',
    language: 'Bemba',
    status: 'delivered',
    created_at: '2026-09-23T06:00:00Z',
  },
  {
    id: 3,
    farm_id: 27,
    farm_name: 'Chikuwe Farm #27',
    village: 'Chikuwe',
    province: 'Eastern',
    crop: 'Groundnuts',
    channel: 'SMS',
    category: 'Storage',
    message: 'CHENJEZO LA STORAGE: Silo A chinyezi chapita 14%. Yumitsani chimanga dzuwa lisanalowe kupewa aflatoxin.',
    language: 'Nyanja',
    status: 'delivered',
    created_at: '2026-09-23T05:15:00Z',
  },
];

export const SEED_REPORTS: CropHealthReport[] = [
  {
    id: 1,
    farm_id: 14,
    farm_name: 'Kalongoma Farm #14',
    image_url: 'sample-maize-blight',
    crop: 'Maize',
    predicted_disease: 'Northern Corn Leaf Blight',
    confidence: 0.87,
    severity: 'moderate',
    risk_level: 'WATCH',
    symptoms: 'Elongated grey-green cigar-shaped elliptical lesions across lower leaves, 25mm to 100mm in length.',
    recommendation: 'Inspect surrounding plants. Avoid overhead irrigation. Remove severely affected lower leaves. Request extension officer confirmation.',
    needs_expert_review: false,
    reviewed_by_officer: false,
    created_at: '2026-09-23T07:15:00Z',
  },
  {
    id: 2,
    farm_id: 27,
    farm_name: 'Chikuwe Farm #27',
    image_url: 'sample-maize-rust',
    crop: 'Maize',
    predicted_disease: 'Common Rust (Puccinia sorghi)',
    confidence: 0.91,
    severity: 'high',
    risk_level: 'HIGH',
    symptoms: 'Dense cinnamon-brown to reddish powdery pustules appearing on both upper and lower leaf surfaces.',
    recommendation: 'Immediate alert: apply approved fungicide (e.g. azoxystrobin/difenoconazole) if pustules reach upper leaves during grain fill. Extension officer notified.',
    needs_expert_review: false,
    reviewed_by_officer: true,
    created_at: '2026-09-22T15:20:00Z',
  },
  {
    id: 3,
    farm_id: 31,
    farm_name: 'Chongwe Farm #31',
    image_url: 'sample-tomato-early-blight',
    crop: 'Tomato',
    predicted_disease: 'Tomato Early Blight (Alternaria solani)',
    confidence: 0.79,
    severity: 'moderate',
    risk_level: 'WATCH',
    symptoms: 'Concentric dark target-board rings on oldest leaves with chlorotic yellow surrounding haloes.',
    recommendation: 'Prune infected lower foliage immediately and burn away from field. Apply copper oxychloride spray.',
    needs_expert_review: false,
    reviewed_by_officer: false,
    created_at: '2026-09-22T11:40:00Z',
  },
];

export const SEED_SMS_MESSAGES: SMSMessage[] = [
  {
    id: 1,
    phone: '+260970000002',
    direction: 'out',
    message: 'MundaSense: DISEASE ALERT! Your Msekera maize area has HIGH risk conditions. Check leaves for cigar-shaped spots. Dial *2873# or reply DISEASE.',
    category: 'Disease Alert',
    status: 'delivered',
    created_at: '2026-09-23T07:30:00Z',
  },
  {
    id: 2,
    phone: '+260970000002',
    direction: 'in',
    message: 'SOIL',
    category: 'Farmer Query',
    status: 'received',
    created_at: '2026-09-23T07:32:00Z',
  },
  {
    id: 3,
    phone: '+260970000002',
    direction: 'out',
    message: 'MundaSense Telemetry: Farm #01 Msekera. Soil moisture 15cm: 24.5% (Low), 30cm: 28.8% (Watch), 60cm: 33.2% (Adequate). Light rain forecasted.',
    category: 'Telemetry Reply',
    status: 'delivered',
    created_at: '2026-09-23T07:32:05Z',
  },
  {
    id: 4,
    phone: '+260970000002',
    direction: 'out',
    message: 'NEW ORDER #218: 1,000 kg Maize SC647 from National Milling. Total: ZMW 6,400. Reply YES 218 to confirm or NO 218 to decline.',
    category: 'Order Notification',
    status: 'delivered',
    created_at: '2026-09-23T08:15:00Z',
  },
];
