/**
 * Seed the database with demo users + farms + listings.
 * Run automatically on server start if DB is empty.
 */
import { db, hashPin } from './db.ts';
import crypto from 'crypto';

const FIRST_NAMES = ['Chanda','Grace','Brenda','Loveness','Malama','Mutinta','Hachipuka','Limbikani','Ruth','Kondwani','Eunice','Agness','Cosmas','Fredrick','Hellen','Natasha','Gift','Enock','Idah','Oliver'];
const LAST_NAMES = ['Mwape','Tembo','Phiri','Zulu','Sakala','Siamachoka','Mweemba','Banda','Mulenga','Ngoma','Chileshe','Mbewe'];
const CROPS = ['Maize','Groundnuts','Soybeans','Sunflower','Cotton'];
const STAGES = ['Vegetative','VT (Tasseling)','Grain Fill','Maturity'];
const VILLAGES_EAST = ['Msekera','Kalongoma','Chikuwe','Kanjeza','Mnkhanya','Kapata','Mwami Border','Feni'];
const VILLAGES_LUSAKA = ['Chongwe','Kafue','Rufunsa','Luangwa','Chilanga'];
const VILLAGES_CENTRAL = ['Mkushi','Mumbwa','Chibombo','Serenje','Kabwe'];

export function seedDatabase() {
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  if (userCount === 0) {
    console.log('[seed] Seeding users...');
    // Demo role accounts (login via app with email or phone)
    const demoAccounts = [
      { email: 'admin@mundasense.zm', phone: '+260970000001', name: 'Dr. Joseph Banda', role: 'admin', village: 'Lusaka', province: 'Lusaka' },
      { email: 'farmer@mundasense.zm', phone: '+260970000002', name: 'Chanda Mwape', role: 'farmer', village: 'Msekera', province: 'Eastern', ziamis_id: 'ZM-EAS-84001' },
      { email: 'seller@mundasense.zm', phone: '+260970000004', name: 'Msekera Cooperative Union', role: 'seller', village: 'Msekera', province: 'Eastern' },
      { email: 'customer@mundasense.zm', phone: '+260970000003', name: 'National Milling Corporation', role: 'customer', village: 'Lusaka', province: 'Lusaka' },
      { email: 'transporter@mundasense.zm', phone: '+260970000005', name: 'ZamCargo Logistics', role: 'transporter', village: 'Chipata', province: 'Eastern' },
    ];

    for (const a of demoAccounts) {
      db.prepare(`
        INSERT INTO users (id, phone, email, full_name, role, village, province, language, pin_hash, ziamis_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'English', ?, ?)
      `).run(
        crypto.randomUUID(),
        a.phone, a.email, a.name, a.role, a.village, a.province,
        hashPin('demo1234'), a.ziamis_id || null
      );
    }
  }

  // 108 farms across 3 provinces
  const insertFarm = db.prepare(`
    INSERT INTO farms (farmer_phone, name, village, district, province, latitude, longitude, crop, crop_stage, soil_moisture, health_status, disease_risk, ziamis_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let farmIdx = 0;
  const seedFarms = (province: string, villages: string[], count: number, hubLat: number, hubLon: number) => {
    for (let i = 0; i < count; i++) {
      farmIdx++;
      const name = `${FIRST_NAMES[farmIdx % FIRST_NAMES.length]} ${LAST_NAMES[farmIdx % LAST_NAMES.length]}`;
      const village = villages[i % villages.length];
      const phone = `+26097${String(1000000 + farmIdx * 31).padStart(7, '0')}`;
      const crop = CROPS[farmIdx % CROPS.length];
      const stage = STAGES[farmIdx % STAGES.length];
      const soil = 20 + Math.random() * 25;
      const health = soil < 22 ? 'alert' : soil < 32 ? 'watch' : 'healthy';
      const risk = soil < 22 ? 'HIGH' : soil < 32 ? 'WATCH' : 'LOW';
      const lat = hubLat + (Math.random() - 0.5) * 0.08;
      const lon = hubLon + (Math.random() - 0.5) * 0.08;

      insertFarm.run(
        phone, name, village, village, province, lat, lon,
        crop, stage, +soil.toFixed(1), health, risk,
        `ZM-${province.substring(0, 3).toUpperCase()}-${84000 + farmIdx}`
      );
    }
  };

  seedFarms('Eastern', VILLAGES_EAST, 40, -13.6333, 32.6500);
  seedFarms('Lusaka', VILLAGES_LUSAKA, 35, -15.3333, 28.6833);
  seedFarms('Central', VILLAGES_CENTRAL, 33, -13.6167, 29.3833);

  // Marketplace listings
  const insertListing = db.prepare(`
    INSERT INTO listings (seller_phone, seller_email, crop, quantity_kg, price_per_kg_zmw, village, province, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const listings = [
    { crop:'Maize',      qty:30000, price:6.20,  seller_phone:'+260970000004', seller_email:'seller@mundasense.zm', village:'Msekera',   province:'Eastern', desc:'Grade A white maize, moisture 12.6%' },
    { crop:'Maize',      qty:22000, price:6.10,  seller_phone:'+260970000004', seller_email:'seller@mundasense.zm', village:'Kalongoma', province:'Eastern', desc:'Cleaned and bagged, certified aflatoxin-free' },
    { crop:'Maize',      qty:1000,  price:6.40,  seller_phone:'+260970000002', seller_email:'farmer@mundasense.zm', village:'Msekera',   province:'Eastern', desc:'Harvested from Msekera plot #01' },
    { crop:'Groundnuts', qty:8000,  price:10.80, seller_phone:'+260970000004', seller_email:'seller@mundasense.zm', village:'Chikuwe',   province:'Eastern', desc:'MGV4 confectionery, hand-sorted' },
    { crop:'Soybeans',   qty:15000, price:8.50,  seller_phone:'+260970000004', seller_email:'seller@mundasense.zm', village:'Chongwe',   province:'Lusaka',  desc:'Tikolore high-oil' },
    { crop:'Sunflower',  qty:6000,  price:7.60,  seller_phone:'+260970000004', seller_email:'seller@mundasense.zm', village:'Mkushi',    province:'Central', desc:'Milika black seed' },
  ];

  for (const l of listings) {
    insertListing.run(l.seller_phone, l.seller_email, l.crop, l.qty, l.price, l.village, l.province, l.desc);
  }

  // Sensor Hubs & Readings
  const hubsCount = (db.prepare('SELECT COUNT(*) as c FROM sensor_hubs').get() as any)?.c || 0;
  if (hubsCount === 0) {
    const insertHub = db.prepare(`
      INSERT INTO sensor_hubs
        (hub_code, name, province, district, latitude, longitude, coverage_radius_km, battery_voltage, solar_input_voltage, gsm_signal_dbm, uptime_h)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const h1 = insertHub.run('HUB-EAST-01', 'Msekera Research Hub', 'Eastern', 'Chipata', -13.6333, 32.6500, 15, 4.14, 5.82, -74, 1420);
    const h2 = insertHub.run('HUB-LUS-02', 'Chongwe Agricultural Hub', 'Lusaka', 'Chongwe', -15.3333, 28.6833, 18, 4.08, 5.75, -81, 980);
    const h3 = insertHub.run('HUB-CEN-03', 'Mkushi Farming Block Hub', 'Central', 'Mkushi', -13.6167, 29.3833, 22, 4.18, 5.90, -69, 2150);

    const insertReading = db.prepare(`
      INSERT INTO sensor_readings
        (hub_id, soil_moisture_15cm, soil_moisture_30cm, soil_moisture_60cm, temperature, humidity, rainfall, recorded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
    `);

    for (const hubId of [h1.lastInsertRowid, h2.lastInsertRowid, h3.lastInsertRowid]) {
      for (let i = 48; i >= 0; i--) {
        const offset = `-${i * 30} minutes`;
        const m15 = +(26 + Math.sin(i / 4) * 5 + (Math.random() - 0.5) * 2).toFixed(1);
        const m30 = +(29 + Math.sin(i / 5) * 4 + (Math.random() - 0.5) * 1.5).toFixed(1);
        const m60 = +(34 + Math.sin(i / 6) * 3 + (Math.random() - 0.5) * 1).toFixed(1);
        const temp = +(25 + Math.sin(i / 3) * 6).toFixed(1);
        const hum = +(58 + Math.cos(i / 3) * 14).toFixed(1);
        const rain = i === 12 ? 4.5 : i === 13 ? 2.1 : 0;
        insertReading.run(hubId, m15, m30, m60, temp, hum, rain, offset);
      }
    }
  }

  // Storage Units
  const silosCount = (db.prepare('SELECT COUNT(*) as c FROM storage_units').get() as any)?.c || 0;
  if (silosCount === 0) {
    const insertSilo = db.prepare(`
      INSERT INTO storage_units
        (name, crop, capacity_tons, current_fill_tons, moisture_percent, temp_c, co2_ppm, status, aflatoxin_risk)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSilo.run('Chipata Central Silo #1', 'White Maize', 5000, 4120, 12.4, 23.5, 480, 'optimal', 'LOW');
    insertSilo.run('Msekera Community Aggregator', 'Groundnuts', 1200, 980, 14.1, 27.2, 850, 'warning', 'MEDIUM');
    insertSilo.run('Chongwe Depot Silo B', 'Soybeans', 3500, 2890, 11.8, 22.1, 410, 'optimal', 'LOW');
    insertSilo.run('Mkushi Commercial Bin #4', 'White Maize', 8000, 7400, 15.2, 29.8, 1120, 'critical', 'HIGH');
  }

  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const totalFarms = (db.prepare('SELECT COUNT(*) as c FROM farms').get() as any).c;
  const totalListings = (db.prepare('SELECT COUNT(*) as c FROM listings').get() as any).c;

  console.log(`[seed] ✅ ${totalUsers} users · ${totalFarms} farms · ${totalListings} listings`);
  console.log('[seed] Demo passwords: demo1234 (for all seeded accounts)');
}
