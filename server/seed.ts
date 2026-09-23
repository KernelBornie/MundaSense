/**
 * MundaSense — Nationwide Database Seeder
 * Expands to all 10 Zambian provinces and 113 districts:
 * - 551 farms (at least 4 farms per district)
 * - 15 solar LoRaWAN / GSM sensor hubs
 * - 15 storage silos (one per hub)
 * - 20 active marketplace listings
 * - 15 user accounts (5 role demo accounts + 10 farmer accounts)
 */
import { db, hashPin } from './db.ts';
import crypto from 'crypto';

export const ZAMBIA_DISTRICTS: Record<
  string,
  {
    code: string;
    capital: string;
    hub_lat: number;
    hub_lon: number;
    districts: string[];
    count: number;
    farmsPerDistrict: number;
  }
> = {
  Central: {
    code: 'CTR',
    capital: 'Kabwe',
    hub_lat: -14.2833,
    hub_lon: 28.6833,
    districts: [
      'Chibombo', 'Chisamba', 'Chitambo', 'Kabwe', 'Kapiri Mposhi',
      'Luano', 'Mkushi', 'Mumbwa', 'Ngabwe', 'Serenje', 'Shibuyunji',
    ], // 11 districts * 5 = 55
    count: 55,
    farmsPerDistrict: 5,
  },
  Copperbelt: {
    code: 'CBT',
    capital: 'Ndola',
    hub_lat: -12.9587,
    hub_lon: 28.6366,
    districts: [
      'Chililabombwe', 'Chingola', 'Kalulushi', 'Kitwe', 'Luanshya',
      'Lufwanyama', 'Masaiti', 'Mpongwe', 'Mufulira', 'Ndola',
    ], // 10 districts * 5 = 50
    count: 50,
    farmsPerDistrict: 5,
  },
  Eastern: {
    code: 'EAS',
    capital: 'Chipata',
    hub_lat: -13.6333,
    hub_lon: 32.6500,
    districts: [
      'Chadiza', 'Chasefu', 'Chipangali', 'Chipata', 'Kasenengwa',
      'Katete', 'Lumezi', 'Lundazi', 'Lusangazi', 'Mambwe',
      'Nyimba', 'Petauke', 'Sinda', 'Vubwi',
    ], // 14 districts * 5 = 70
    count: 70,
    farmsPerDistrict: 5,
  },
  Luapula: {
    code: 'LUA',
    capital: 'Mansa',
    hub_lat: -11.2000,
    hub_lon: 28.8833,
    districts: [
      'Chembe', 'Chiengi', 'Chifunabuli', 'Chipili', 'Kawambwa',
      'Lunga', 'Mansa', 'Milenge', 'Mwansabombwe', 'Mwense',
      'Nchelenge', 'Samfya',
    ], // 12 districts * 4 = 48
    count: 48,
    farmsPerDistrict: 4,
  },
  Lusaka: {
    code: 'LUS',
    capital: 'Lusaka',
    hub_lat: -15.3333,
    hub_lon: 28.6833,
    districts: [
      'Chilanga', 'Chongwe', 'Kafue', 'Luangwa', 'Lusaka', 'Rufunsa',
    ], // 6 districts * 8 = 48
    count: 48,
    farmsPerDistrict: 8,
  },
  Muchinga: {
    code: 'MUC',
    capital: 'Chinsali',
    hub_lat: -10.5500,
    hub_lon: 32.0667,
    districts: [
      'Chinsali', 'Isoka', 'Kanchibiya', 'Lavushimanda', 'Mafinga',
      'Mpika', 'Nakonde', "Shiwang'andu",
    ], // 8 districts * 6 = 48
    count: 48,
    farmsPerDistrict: 6,
  },
  Northern: {
    code: 'NOR',
    capital: 'Kasama',
    hub_lat: -10.2167,
    hub_lon: 31.1833,
    districts: [
      'Chilubi', 'Kaputa', 'Kasama', 'Lunte', 'Lupososhi',
      'Luwingu', 'Mbala', 'Mporokoso', 'Mpulungu', 'Mungwi',
      'Nsama', 'Senga Hill',
    ], // 12 districts * 4 = 48
    count: 48,
    farmsPerDistrict: 4,
  },
  'North-Western': {
    code: 'NWP',
    capital: 'Solwezi',
    hub_lat: -12.1833,
    hub_lon: 26.4000,
    districts: [
      'Chavuma', 'Ikelenge', 'Kabompo', 'Kalumbila', 'Kasempa',
      'Manyinga', 'Mufumbwe', 'Mwinilunga', 'Mushindamo', 'Solwezi',
      'Zambezi',
    ], // 11 districts * 5 = 55
    count: 55,
    farmsPerDistrict: 5,
  },
  Southern: {
    code: 'SOU',
    capital: 'Choma',
    hub_lat: -16.8000,
    hub_lon: 26.9833,
    districts: [
      'Chikankata', 'Choma', 'Gwembe', 'Kalomo', 'Kazungula',
      'Livingstone', 'Mazabuka', 'Monze', 'Namwala', 'Pemba',
      'Sinazongwe', 'Siavonga', 'Zimba',
    ], // 13 districts * 5 = 65
    count: 65,
    farmsPerDistrict: 5,
  },
  Western: {
    code: 'WES',
    capital: 'Mongu',
    hub_lat: -15.2500,
    hub_lon: 23.1333,
    districts: [
      'Kalabo', 'Kaoma', 'Limulunga', 'Luampa', 'Lukulu',
      'Mitete', 'Mongu', 'Mulobezi', 'Mwandi', 'Nalolo',
      'Nkeyema', 'Senanga', 'Sesheke', 'Shangombo', 'Sikongo', 'Sioma',
    ], // 16 districts * 4 = 64
    count: 64,
    farmsPerDistrict: 4,
  },
};

const FIRST_NAMES = [
  'Chanda', 'Grace', 'Brenda', 'Loveness', 'Malama', 'Mutinta',
  'Hachipuka', 'Limbikani', 'Ruth', 'Kondwani', 'Eunice', 'Agness',
  'Cosmas', 'Fredrick', 'Hellen', 'Natasha', 'Gift', 'Enock', 'Idah', 'Oliver',
  'Mubanga', 'Subilo', 'Wanjala', 'Mwangala', 'Kasonde', 'Mapalo', 'Bupe',
];

const LAST_NAMES = [
  'Mwape', 'Tembo', 'Phiri', 'Zulu', 'Sakala', 'Siamachoka',
  'Mweemba', 'Banda', 'Mulenga', 'Ngoma', 'Chileshe', 'Mbewe',
  'Lubinda', 'Munalula', 'Kanyama', 'Sikazwe', 'Chilufya', 'Sitali',
];

const STAGES = ['Vegetative', 'VT (Tasseling)', 'Grain Fill', 'Maturity'];

// 60% Maize, 15% Groundnuts, 10% Soybeans, 8% Sunflower, 4% Cotton, 3% Other
function pickCrop(idx: number): string {
  const mod = idx % 100;
  if (mod < 60) return 'Maize';
  if (mod < 75) return 'Groundnuts';
  if (mod < 85) return 'Soybeans';
  if (mod < 93) return 'Sunflower';
  if (mod < 97) return 'Cotton';
  const others = ['Cassava', 'Sorghum', 'Millet'];
  return others[idx % others.length];
}

function getLanguage(province: string, idx: number): string {
  switch (province) {
    case 'Central':
      return idx % 2 === 0 ? 'Bemba' : 'Nyanja';
    case 'Copperbelt':
    case 'Luapula':
    case 'Northern':
    case 'Muchinga':
      return 'Bemba';
    case 'Eastern':
    case 'Lusaka':
      return 'Nyanja';
    case 'Southern':
      return 'Tonga';
    case 'Western':
      return 'Lozi';
    case 'North-Western': {
      const langs = ['Lunda', 'Kaonde', 'Luvale'];
      return langs[idx % 3];
    }
    default:
      return 'English';
  }
}

export function seedDatabase() {
  const farmCount = (db.prepare('SELECT COUNT(*) as c FROM farms').get() as any)?.c || 0;
  const hubsCount = (db.prepare('SELECT COUNT(*) as c FROM sensor_hubs').get() as any)?.c || 0;
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any)?.c || 0;

  // Idempotency check: if already 551 farms, 15 hubs, and >= 15 users, skip
  if (farmCount === 551 && hubsCount === 15 && userCount >= 15) {
    console.log(`[seed] Already seeded (${farmCount} farms, ${hubsCount} hubs, ${userCount} users)`);
    return;
  }

  console.log('[seed] Seeding 551 farms across 113 districts in all 10 provinces...');

  // Reset collections to ensure exact target counts
  db.prepare('PRAGMA foreign_keys = OFF').run();
  db.prepare('DELETE FROM sensor_readings').run();
  db.prepare('DELETE FROM sensor_hubs').run();
  db.prepare('DELETE FROM farms').run();
  db.prepare('DELETE FROM storage_units').run();
  db.prepare('DELETE FROM listings').run();
  db.prepare('DELETE FROM users').run();
  db.prepare('PRAGMA foreign_keys = ON').run();

  /* ============================================================
     1. SEED 15 USERS (5 Demo Roles + 10 Additional Farmers)
     ============================================================ */
  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, email, full_name, role, village, district, province, language, pin_hash, ziamis_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const demoAccounts = [
    { email: 'admin@mundasense.zm', phone: '+260970000001', name: 'Dr. Joseph Banda', role: 'admin', village: 'Lusaka', district: 'Lusaka', province: 'Lusaka', lang: 'English', ziamis: null },
    { email: 'farmer@mundasense.zm', phone: '+260970000002', name: 'Chanda Mwape', role: 'farmer', village: 'Msekera', district: 'Chipata', province: 'Eastern', lang: 'Nyanja', ziamis: 'ZM-EAS-84001' },
    { email: 'customer@mundasense.zm', phone: '+260970000003', name: 'National Milling Corporation', role: 'customer', village: 'Lusaka', district: 'Lusaka', province: 'Lusaka', lang: 'English', ziamis: null },
    { email: 'seller@mundasense.zm', phone: '+260970000004', name: 'Msekera Cooperative Union', role: 'seller', village: 'Msekera', district: 'Chipata', province: 'Eastern', lang: 'Nyanja', ziamis: null },
    { email: 'transporter@mundasense.zm', phone: '+260970000005', name: 'ZamCargo Logistics', role: 'transporter', village: 'Chipata', district: 'Chipata', province: 'Eastern', lang: 'English', ziamis: null },
    // 10 additional farmer accounts
    { email: 'grace.tembo@mundasense.zm', phone: '+260970000006', name: 'Grace Tembo', role: 'farmer', village: 'Ndola', district: 'Ndola', province: 'Copperbelt', lang: 'Bemba', ziamis: 'ZM-CBT-84002' },
    { email: 'brenda.zulu@mundasense.zm', phone: '+260970000007', name: 'Brenda Zulu', role: 'farmer', village: 'Mkushi', district: 'Mkushi', province: 'Central', lang: 'Bemba', ziamis: 'ZM-CTR-84003' },
    { email: 'mutinta.siamachoka@mundasense.zm', phone: '+260970000008', name: 'Mutinta Siamachoka', role: 'farmer', village: 'Choma', district: 'Choma', province: 'Southern', lang: 'Tonga', ziamis: 'ZM-SOU-84004' },
    { email: 'malama.mweemba@mundasense.zm', phone: '+260970000009', name: 'Malama Mweemba', role: 'farmer', village: 'Monze', district: 'Monze', province: 'Southern', lang: 'Tonga', ziamis: 'ZM-SOU-84005' },
    { email: 'limbikani.phiri@mundasense.zm', phone: '+260970000010', name: 'Limbikani Phiri', role: 'farmer', village: 'Katete', district: 'Katete', province: 'Eastern', lang: 'Nyanja', ziamis: 'ZM-EAS-84006' },
    { email: 'ruth.banda@mundasense.zm', phone: '+260970000011', name: 'Ruth Banda', role: 'farmer', village: 'Chongwe', district: 'Chongwe', province: 'Lusaka', lang: 'Nyanja', ziamis: 'ZM-LUS-84007' },
    { email: 'kondwani.mulenga@mundasense.zm', phone: '+260970000012', name: 'Kondwani Mulenga', role: 'farmer', village: 'Kasama', district: 'Kasama', province: 'Northern', lang: 'Bemba', ziamis: 'ZM-NOR-84008' },
    { email: 'eunice.ngoma@mundasense.zm', phone: '+260970000013', name: 'Eunice Ngoma', role: 'farmer', village: 'Mansa', district: 'Mansa', province: 'Luapula', lang: 'Bemba', ziamis: 'ZM-LUA-84009' },
    { email: 'cosmas.chileshe@mundasense.zm', phone: '+260970000014', name: 'Cosmas Chileshe', role: 'farmer', village: 'Chinsali', district: 'Chinsali', province: 'Muchinga', lang: 'Bemba', ziamis: 'ZM-MUC-84010' },
    { email: 'fredrick.mbewe@mundasense.zm', phone: '+260970000015', name: 'Fredrick Mbewe', role: 'farmer', village: 'Solwezi', district: 'Solwezi', province: 'North-Western', lang: 'Kaonde', ziamis: 'ZM-NWP-84011' },
  ];

  for (const a of demoAccounts) {
    insertUser.run(
      crypto.randomUUID(),
      a.phone,
      a.email,
      a.name,
      a.role,
      a.village,
      a.district,
      a.province,
      a.lang,
      hashPin('demo1234'),
      a.ziamis
    );
  }

  /* ============================================================
     2. SEED 551 FARMS ACROSS 113 DISTRICTS IN 10 PROVINCES
     ============================================================ */
  const insertFarm = db.prepare(`
    INSERT INTO farms (farmer_phone, name, village, district, province, latitude, longitude, crop, crop_stage, soil_moisture, health_status, disease_risk, ziamis_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let globalFarmIdx = 0;

  for (const [provinceName, pData] of Object.entries(ZAMBIA_DISTRICTS)) {
    const { code, hub_lat, hub_lon, districts, farmsPerDistrict } = pData;

    districts.forEach((districtName, districtIdx) => {
      // Calculate realistic district center based on hub offset
      const distLat = hub_lat + districtIdx * 0.08 - 0.3;
      const distLon = hub_lon + districtIdx * 0.12 - 0.5;

      for (let f = 0; f < farmsPerDistrict; f++) {
        globalFarmIdx++;

        const farmerName = `${FIRST_NAMES[globalFarmIdx % FIRST_NAMES.length]} ${LAST_NAMES[globalFarmIdx % LAST_NAMES.length]}`;
        const phone = `+26097${String(1000000 + globalFarmIdx * 31).padStart(7, '0')}`;
        const crop = pickCrop(globalFarmIdx);
        const stage = STAGES[globalFarmIdx % STAGES.length];

        // Soil moisture between 18% and 48%
        const soil = +(18 + (Math.sin(globalFarmIdx) * 0.5 + 0.5) * 28 + (Math.random() - 0.5) * 2).toFixed(1);
        const health = soil < 22 ? 'alert' : soil < 32 ? 'watch' : 'healthy';
        const risk = soil < 22 ? 'HIGH' : soil < 32 ? 'WATCH' : 'LOW';

        // Coordinates jittered within ±0.05° of district center (±0.25° bounding box of district)
        const lat = +(distLat + (Math.random() - 0.5) * 0.1).toFixed(4);
        const lon = +(distLon + (Math.random() - 0.5) * 0.1).toFixed(4);

        const ziamis = `ZM-${code}-${84000 + globalFarmIdx}`;
        const createdAt = new Date(Date.now() - (globalFarmIdx * 3600000) % (90 * 86400000)).toISOString();

        insertFarm.run(
          phone,
          farmerName,
          districtName, // village matches district name
          districtName,
          provinceName,
          lat,
          lon,
          crop,
          stage,
          soil,
          health,
          risk,
          ziamis,
          createdAt
        );
      }
    });
  }

  /* ============================================================
     3. SEED 15 SENSOR HUBS & LIVE READINGS
     ============================================================ */
  const insertHub = db.prepare(`
    INSERT INTO sensor_hubs
      (hub_code, name, province, district, latitude, longitude, coverage_radius_km, battery_voltage, solar_input_voltage, gsm_signal_dbm, uptime_h)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const HUBS_15 = [
    // Eastern (3 hubs)
    { code: 'HUB-EAS-01', name: 'Msekera Research Gateway', prov: 'Eastern', dist: 'Chipata', lat: -13.6333, lon: 32.6500, rad: 18, batt: 4.14, sol: 5.82, gsm: -74, up: 1820 },
    { code: 'HUB-EAS-02', name: 'Katete Agro Telemetry Hub', prov: 'Eastern', dist: 'Katete', lat: -14.0833, lon: 32.0500, rad: 15, batt: 4.09, sol: 5.70, gsm: -79, up: 1420 },
    { code: 'HUB-EAS-03', name: 'Nyimba Valley Gateway', prov: 'Eastern', dist: 'Nyimba', lat: -14.5500, lon: 30.8333, rad: 20, batt: 4.12, sol: 5.91, gsm: -71, up: 960 },
    // Central (2 hubs)
    { code: 'HUB-CTR-01', name: 'Mkushi Commercial Block Hub', prov: 'Central', dist: 'Mkushi', lat: -13.6167, lon: 29.3833, rad: 22, batt: 4.18, sol: 5.95, gsm: -68, up: 2450 },
    { code: 'HUB-CTR-02', name: 'Kabwe Central Agro Gateway', prov: 'Central', dist: 'Kabwe', lat: -14.4333, lon: 28.4500, rad: 16, batt: 4.07, sol: 5.65, gsm: -82, up: 1100 },
    // Copperbelt (1 hub)
    { code: 'HUB-CBT-01', name: 'Ndola Forestry & Farming Hub', prov: 'Copperbelt', dist: 'Ndola', lat: -12.9587, lon: 28.6366, rad: 17, batt: 4.15, sol: 5.88, gsm: -72, up: 1640 },
    // Lusaka (2 hubs)
    { code: 'HUB-LUS-01', name: 'Chongwe East Farming Hub', prov: 'Lusaka', dist: 'Chongwe', lat: -15.3333, lon: 28.6833, rad: 18, batt: 4.16, sol: 5.84, gsm: -70, up: 2100 },
    { code: 'HUB-LUS-02', name: 'Kafue Basin Irrigation Hub', prov: 'Lusaka', dist: 'Kafue', lat: -15.7667, lon: 28.1833, rad: 16, batt: 4.05, sol: 5.60, gsm: -84, up: 1350 },
    // Southern (2 hubs)
    { code: 'HUB-SOU-01', name: 'Choma Plateau Solar Gateway', prov: 'Southern', dist: 'Choma', lat: -16.8000, lon: 26.9833, rad: 20, batt: 4.20, sol: 6.10, gsm: -66, up: 2780 },
    { code: 'HUB-SOU-02', name: 'Mazabuka Cane & Grain Hub', prov: 'Southern', dist: 'Mazabuka', lat: -15.8500, lon: 27.7667, rad: 19, batt: 4.13, sol: 5.90, gsm: -75, up: 1920 },
    // Northern (1 hub)
    { code: 'HUB-NOR-01', name: 'Kasama Highland Gateway', prov: 'Northern', dist: 'Kasama', lat: -10.2167, lon: 31.1833, rad: 25, batt: 4.08, sol: 5.72, gsm: -80, up: 1530 },
    // Western (1 hub)
    { code: 'HUB-WES-01', name: 'Mongu Barotse Plain Hub', prov: 'Western', dist: 'Mongu', lat: -15.2500, lon: 23.1333, rad: 22, batt: 4.12, sol: 5.86, gsm: -78, up: 1240 },
    // Luapula (1 hub)
    { code: 'HUB-LUA-01', name: 'Mansa Wetland Telemetry Hub', prov: 'Luapula', dist: 'Mansa', lat: -11.2000, lon: 28.8833, rad: 18, batt: 4.06, sol: 5.68, gsm: -83, up: 980 },
    // Muchinga (1 hub)
    { code: 'HUB-MUC-01', name: 'Chinsali Watershed Gateway', prov: 'Muchinga', dist: 'Chinsali', lat: -10.5500, lon: 32.0667, rad: 20, batt: 4.10, sol: 5.79, gsm: -77, up: 1140 },
    // North-Western (1 hub)
    { code: 'HUB-NWP-01', name: 'Solwezi Mineral & Agro Hub', prov: 'North-Western', dist: 'Solwezi', lat: -12.1833, lon: 26.4000, rad: 22, batt: 4.14, sol: 5.85, gsm: -73, up: 1720 },
  ];

  const insertReading = db.prepare(`
    INSERT INTO sensor_readings
      (hub_id, soil_moisture_15cm, soil_moisture_30cm, soil_moisture_60cm, temperature, humidity, rainfall, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  for (const h of HUBS_15) {
    const res = insertHub.run(
      h.code, h.name, h.prov, h.dist, h.lat, h.lon, h.rad, h.batt, h.sol, h.gsm, h.up
    );
    const hubId = Number(res.lastInsertRowid);

    // 24 readings (12 hours of 30-min data)
    for (let i = 24; i >= 0; i--) {
      const offset = `-${i * 30} minutes`;
      const m15 = +(24 + Math.sin(i / 3) * 6 + (Math.random() - 0.5) * 2).toFixed(1);
      const m30 = +(28 + Math.sin(i / 4) * 5 + (Math.random() - 0.5) * 1.5).toFixed(1);
      const m60 = +(33 + Math.sin(i / 5) * 4 + (Math.random() - 0.5) * 1).toFixed(1);
      const temp = +(24 + Math.sin(i / 3) * 5.5).toFixed(1);
      const hum = +(62 + Math.cos(i / 3) * 12).toFixed(1);
      const rain = i === 8 ? 3.2 : i === 9 ? 1.4 : 0;
      insertReading.run(hubId, m15, m30, m60, temp, hum, rain, offset);
    }
  }

  /* ============================================================
     4. SEED 15 STORAGE SILOS (ONE PER HUB)
     ============================================================ */
  const insertSilo = db.prepare(`
    INSERT INTO storage_units
      (name, crop, capacity_tons, current_fill_tons, moisture_percent, temp_c, co2_ppm, status, aflatoxin_risk)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const SILOS_15 = [
    { name: 'Msekera Research Silo #1', crop: 'White Maize', cap: 5000, fill: 4120, moist: 12.4, temp: 23.5, co2: 480, stat: 'optimal', afla: 'LOW' },
    { name: 'Katete Cooperative Aggregator', crop: 'Groundnuts', cap: 2500, fill: 1980, moist: 13.8, temp: 25.1, co2: 650, stat: 'optimal', afla: 'LOW' },
    { name: 'Nyimba Strategic Grain Bin', crop: 'White Maize', cap: 8000, fill: 7450, moist: 14.5, temp: 27.8, co2: 890, stat: 'warning', afla: 'MEDIUM' },
    { name: 'Mkushi Commercial Silo #4', crop: 'Soybeans', cap: 12000, fill: 9800, moist: 11.6, temp: 21.8, co2: 420, stat: 'optimal', afla: 'LOW' },
    { name: 'Kabwe Central Grain Terminal', crop: 'White Maize', cap: 10000, fill: 8900, moist: 15.2, temp: 29.5, co2: 1150, stat: 'critical', afla: 'HIGH' },
    { name: 'Ndola Milling Grain Elevator', crop: 'Wheat', cap: 15000, fill: 12400, moist: 12.0, temp: 22.4, co2: 450, stat: 'optimal', afla: 'LOW' },
    { name: 'Chinsali Watershed Storage Bin', crop: 'White Maize', cap: 4000, fill: 3200, moist: 12.7, temp: 23.4, co2: 500, stat: 'optimal', afla: 'LOW' },
    { name: 'Chongwe Agro Bulking Silo', crop: 'White Maize', cap: 6000, fill: 4900, moist: 12.8, temp: 23.1, co2: 510, stat: 'optimal', afla: 'LOW' },
    { name: 'Kafue River Basin Silo B', crop: 'Soybeans', cap: 4500, fill: 3750, moist: 12.2, temp: 22.9, co2: 490, stat: 'optimal', afla: 'LOW' },
    { name: 'Choma Plateau Reserve Silo', crop: 'White Maize', cap: 12000, fill: 10500, moist: 13.5, temp: 24.2, co2: 620, stat: 'optimal', afla: 'LOW' },
    { name: 'Mazabuka Agro Silo A', crop: 'Sorghum', cap: 4000, fill: 3100, moist: 12.9, temp: 23.8, co2: 530, stat: 'optimal', afla: 'LOW' },
    { name: 'Kasama Highland Storage Facility', crop: 'Cassava Chips', cap: 5000, fill: 3900, moist: 14.1, temp: 26.4, co2: 780, stat: 'warning', afla: 'MEDIUM' },
    { name: 'Mongu Barotse Plain Rice Silo', crop: 'Paddy Rice', cap: 6000, fill: 4600, moist: 13.0, temp: 24.0, co2: 520, stat: 'optimal', afla: 'LOW' },
    { name: 'Mansa Wetland Grain Depot', crop: 'White Maize', cap: 4500, fill: 3400, moist: 13.6, temp: 25.0, co2: 640, stat: 'optimal', afla: 'LOW' },
    { name: 'Solwezi Northwest Silo Complex', crop: 'White Maize', cap: 7000, fill: 5800, moist: 12.5, temp: 23.0, co2: 470, stat: 'optimal', afla: 'LOW' },
  ];

  for (const s of SILOS_15) {
    insertSilo.run(s.name, s.crop, s.cap, s.fill, s.moist, s.temp, s.co2, s.stat, s.afla);
  }

  /* ============================================================
     5. SEED 20 ACTIVE MARKETPLACE LISTINGS ACROSS ALL 10 PROVINCES
     ============================================================ */
  const insertListing = db.prepare(`
    INSERT INTO listings (seller_phone, seller_email, crop, quantity_kg, price_per_kg_zmw, village, province, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const LISTINGS_20 = [
    { crop: 'Maize', qty: 45000, price: 6.20, phone: '+260970000004', email: 'seller@mundasense.zm', village: 'Msekera', prov: 'Eastern', desc: 'Grade A White Maize, moisture 12.4%, certified aflatoxin-free' },
    { crop: 'Maize', qty: 25000, price: 6.10, phone: '+260970000002', email: 'farmer@mundasense.zm', village: 'Chipata', prov: 'Eastern', desc: 'Cleaned and bagged in 50kg bags, immediate pickup' },
    { crop: 'Groundnuts', qty: 12000, price: 11.50, phone: '+260970000010', email: 'limbikani.phiri@mundasense.zm', village: 'Katete', prov: 'Eastern', desc: 'MGV4 Confectionery Groundnuts, sun-dried, sorted' },
    { crop: 'Soybeans', qty: 30000, price: 8.80, phone: '+260970000007', email: 'brenda.zulu@mundasense.zm', village: 'Mkushi', prov: 'Central', desc: 'Tikolore high-protein soybeans, machine cleaned' },
    { crop: 'Sunflower', qty: 18000, price: 7.90, phone: '+260970000004', email: 'seller@mundasense.zm', village: 'Kabwe', prov: 'Central', desc: 'Milika black-seed sunflower, high oil yield' },
    { crop: 'Wheat', qty: 50000, price: 9.40, phone: '+260970000006', email: 'grace.tembo@mundasense.zm', village: 'Ndola', prov: 'Copperbelt', desc: 'Irrigated Winter Wheat, premium baking grade' },
    { crop: 'Maize', qty: 20000, price: 6.30, phone: '+260970000006', email: 'grace.tembo@mundasense.zm', village: 'Kitwe', prov: 'Copperbelt', desc: 'Cleaned yellow commercial maize' },
    { crop: 'Soybeans', qty: 22000, price: 8.90, phone: '+260970000011', email: 'ruth.banda@mundasense.zm', village: 'Chongwe', prov: 'Lusaka', desc: 'Prime seed-grade soybeans from Chongwe cluster' },
    { crop: 'Maize', qty: 35000, price: 6.25, phone: '+260970000003', email: 'customer@mundasense.zm', village: 'Kafue', prov: 'Lusaka', desc: 'Bulk white maize ready for transport from Kafue' },
    { crop: 'Groundnuts', qty: 15000, price: 11.20, phone: '+260970000008', email: 'mutinta.siamachoka@mundasense.zm', village: 'Choma', prov: 'Southern', desc: 'Hand-sorted Choma red groundnuts' },
    { crop: 'Maize', qty: 40000, price: 6.15, phone: '+260970000009', email: 'malama.mweemba@mundasense.zm', village: 'Monze', prov: 'Southern', desc: 'Southern plateau white maize, low moisture' },
    { crop: 'Cotton', qty: 16000, price: 14.50, phone: '+260970000004', email: 'seller@mundasense.zm', village: 'Gwembe', prov: 'Southern', desc: 'Seed cotton, hand-picked clean lint' },
    { crop: 'Rice', qty: 28000, price: 13.50, phone: '+260970000015', email: 'fredrick.mbewe@mundasense.zm', village: 'Mongu', prov: 'Western', desc: 'Barotse Super Aromatic long grain rice' },
    { crop: 'Cassava', qty: 35000, price: 4.80, phone: '+260970000015', email: 'fredrick.mbewe@mundasense.zm', village: 'Kaoma', prov: 'Western', desc: 'High-starch dried white cassava chips' },
    { crop: 'Coffee', qty: 8000, price: 32.00, phone: '+260970000012', email: 'kondwani.mulenga@mundasense.zm', village: 'Mbala', prov: 'Northern', desc: 'Mbala Arabica green beans, washed' },
    { crop: 'Beans', qty: 14000, price: 16.50, phone: '+260970000012', email: 'kondwani.mulenga@mundasense.zm', village: 'Kasama', prov: 'Northern', desc: 'Kabulangeti sugar beans, sorted and bagged' },
    { crop: 'Rice', qty: 15000, price: 12.80, phone: '+260970000013', email: 'eunice.ngoma@mundasense.zm', village: 'Samfya', prov: 'Luapula', desc: 'Luapula valley fragrant swamp rice' },
    { crop: 'Soybeans', qty: 18000, price: 8.70, phone: '+260970000014', email: 'cosmas.chileshe@mundasense.zm', village: 'Mpika', prov: 'Muchinga', desc: 'Northern Muchinga corridor certified soybeans' },
    { crop: 'Maize', qty: 25000, price: 6.30, phone: '+260970000014', email: 'cosmas.chileshe@mundasense.zm', village: 'Nakonde', prov: 'Muchinga', desc: 'Cross-border ready bagged white maize' },
    { crop: 'Honey', qty: 5000, price: 45.00, phone: '+260970000015', email: 'fredrick.mbewe@mundasense.zm', village: 'Mwinilunga', prov: 'North-Western', desc: 'Organic wild miombo forest honey, food-grade drummed' },
  ];

  for (const l of LISTINGS_20) {
    insertListing.run(l.phone, l.email, l.crop, l.qty, l.price, l.village, l.prov, l.desc);
  }

  const finalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const finalFarms = (db.prepare('SELECT COUNT(*) as c FROM farms').get() as any).c;
  const finalHubs = (db.prepare('SELECT COUNT(*) as c FROM sensor_hubs').get() as any).c;
  const finalListings = (db.prepare('SELECT COUNT(*) as c FROM listings').get() as any).c;
  const finalSilos = (db.prepare('SELECT COUNT(*) as c FROM storage_units').get() as any).c;
  const distinctProvinces = (db.prepare('SELECT COUNT(DISTINCT province) as c FROM farms').get() as any).c;
  const distinctDistricts = (db.prepare('SELECT COUNT(DISTINCT district) as c FROM farms').get() as any).c;

  console.log(`[seed] ✅ ${finalUsers} users · ${finalFarms} farms across ${distinctDistricts} districts (${distinctProvinces} provinces) · ${finalHubs} hubs · ${finalSilos} silos · ${finalListings} listings`);
  console.log('[seed] Demo passwords: demo1234 (for all seeded accounts)');
}
