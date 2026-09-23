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
  if (userCount > 0) {
    console.log(`[seed] Database already has ${userCount} users — skipping seed`);
    return;
  }

  console.log('[seed] Seeding database...');

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
    INSERT INTO listings (seller_phone, crop, quantity_kg, price_per_kg_zmw, village, province, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertListing.run('+260970000004', 'Maize', 30000, 6.20, 'Msekera', 'Eastern', 'Grade A white maize, moisture 12.6%');
  insertListing.run('+260970000004', 'Groundnuts', 8000, 10.80, 'Msekera', 'Eastern', 'MGV4 confectionery grade');
  insertListing.run('+260970000002', 'Maize', 1000, 6.40, 'Msekera', 'Eastern', 'Chanda Mwape farm lot');
  insertListing.run('+260970000004', 'Soybeans', 15000, 8.50, 'Chongwe', 'Lusaka', 'Tikolore high-oil');
  insertListing.run('+260970000004', 'Sunflower', 6000, 7.60, 'Mkushi', 'Central', 'Milika black seed');

  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const totalFarms = (db.prepare('SELECT COUNT(*) as c FROM farms').get() as any).c;
  const totalListings = (db.prepare('SELECT COUNT(*) as c FROM listings').get() as any).c;

  console.log(`[seed] ✅ ${totalUsers} users · ${totalFarms} farms · ${totalListings} listings`);
  console.log('[seed] Demo passwords: demo1234 (for all seeded accounts)');
}
