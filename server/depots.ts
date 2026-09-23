import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from './db.ts';

export const depotsRouter = Router();

export interface Depot {
  name: string;
  type: 'FRA_DEPOT' | 'COOPERATIVE' | 'AGRO_DEALER' | 'MILLER_DEPOT' | 'EXPORT_HUB';
  province: string;
  district: string;
  lat: number;
  lon: number;
  capacity_tons: number;
  operator: string;
  phone: string;
  email: string;
  crops: string[];
}

export const ZAMBIA_DEPOTS: Depot[] = [
  /* ============================================================
     EASTERN PROVINCE (6 depots)
     ============================================================ */
  { name: 'Msekera Cooperative Depot',        type: 'COOPERATIVE',  province: 'Eastern',  district: 'Chipata',        lat: -13.6333, lon: 32.6500, capacity_tons: 3000, operator: 'Msekera Cooperative Union',   phone: '+260970000004', email: 'seller@mundasense.zm',  crops: ['Maize','Groundnuts','Soybeans'] },
  { name: 'Chipata Central Agro-Depot',       type: 'AGRO_DEALER',  province: 'Eastern',  district: 'Chipata',        lat: -13.6500, lon: 32.6400, capacity_tons: 500,  operator: 'Champion Agro Ltd',            phone: '+260970000101', email: 'chipata@championagro.zm', crops: ['Maize','Groundnuts'] },
  { name: 'Katete Rural Trading Board',       type: 'COOPERATIVE',  province: 'Eastern',  district: 'Katete',         lat: -14.0833, lon: 32.0500, capacity_tons: 1500, operator: 'Katete District Coop',         phone: '+260970000102', email: 'katete@coop.zm',         crops: ['Maize','Groundnuts','Sunflower'] },
  { name: 'Nyimba FRA Depot',                 type: 'FRA_DEPOT',    province: 'Eastern',  district: 'Nyimba',         lat: -14.5500, lon: 30.8333, capacity_tons: 8000, operator: 'Food Reserve Agency',          phone: '+260970000103', email: 'nyimba@fra.gov.zm',      crops: ['Maize'] },
  { name: 'Petauke Aggregation Hub',          type: 'COOPERATIVE',  province: 'Eastern',  district: 'Petauke',        lat: -14.2500, lon: 31.3333, capacity_tons: 1200, operator: 'Petauke Farmers Coop',         phone: '+260970000105', email: 'petauke@coop.zm',        crops: ['Maize','Groundnuts'] },
  { name: 'Lundazi Coffee Depot',             type: 'COOPERATIVE',  province: 'Eastern',  district: 'Lundazi',        lat: -12.3000, lon: 33.1833, capacity_tons: 800,  operator: 'Lundazi Coffee Coop',          phone: '+260970000106', email: 'lundazi@coffee.zm',      crops: ['Coffee','Maize'] },

  /* ============================================================
     LUSAKA PROVINCE (5 depots)
     ============================================================ */
  { name: 'National Milling Lusaka Depot',    type: 'MILLER_DEPOT', province: 'Lusaka',   district: 'Lusaka',         lat: -15.4167, lon: 28.2833, capacity_tons: 50000,operator: 'National Milling Corporation', phone: '+260970000003', email: 'customer@mundasense.zm', crops: ['Maize','Soybeans','Wheat'] },
  { name: 'Antelope Milling Lusaka',          type: 'MILLER_DEPOT', province: 'Lusaka',   district: 'Lusaka',         lat: -15.4083, lon: 28.3100, capacity_tons: 30000,operator: 'Antelope Milling Ltd',         phone: '+260970000110', email: 'lusaka@antelopemilling.zm', crops: ['Maize','Wheat'] },
  { name: 'Chongwe Cooperative Depot',        type: 'COOPERATIVE',  province: 'Lusaka',   district: 'Chongwe',        lat: -15.3333, lon: 28.6833, capacity_tons: 2500, operator: 'Chongwe Farmers Union',        phone: '+260970000111', email: 'chongwe@coop.zm',        crops: ['Maize','Soybeans','Sunflower'] },
  { name: 'Kafue Agro Bulking Centre',        type: 'COOPERATIVE',  province: 'Lusaka',   district: 'Kafue',          lat: -15.7667, lon: 28.1833, capacity_tons: 3000, operator: 'Kafue District Coop',          phone: '+260970000112', email: 'kafue@coop.zm',          crops: ['Maize','Wheat'] },
  { name: 'Makeni FRA Depot',                 type: 'FRA_DEPOT',    province: 'Lusaka',   district: 'Lusaka',         lat: -15.4667, lon: 28.2833, capacity_tons: 15000,operator: 'Food Reserve Agency',          phone: '+260970000113', email: 'makeni@fra.gov.zm',      crops: ['Maize'] },

  /* ============================================================
     CENTRAL PROVINCE (5 depots)
     ============================================================ */
  { name: 'Mkushi Commercial Depot',          type: 'COOPERATIVE',  province: 'Central',  district: 'Mkushi',         lat: -13.6167, lon: 29.3833, capacity_tons: 4500, operator: 'Mkushi Commercial Farmers',    phone: '+260970000115', email: 'mkushi@coop.zm',         crops: ['Maize','Soybeans','Sunflower'] },
  { name: 'Kabwe FRA Depot',                  type: 'FRA_DEPOT',    province: 'Central',  district: 'Kabwe',          lat: -14.4333, lon: 28.4500, capacity_tons: 20000,operator: 'Food Reserve Agency',          phone: '+260970000116', email: 'kabwe@fra.gov.zm',       crops: ['Maize','Soybeans'] },
  { name: 'Mumbwa Cooperative Shed',          type: 'COOPERATIVE',  province: 'Central',  district: 'Mumbwa',         lat: -14.9833, lon: 27.0667, capacity_tons: 1800, operator: 'Mumbwa Farmers Coop',          phone: '+260970000117', email: 'mumbwa@coop.zm',         crops: ['Maize','Cotton'] },
  { name: 'Serenje FRA Depot',                type: 'FRA_DEPOT',    province: 'Central',  district: 'Serenje',        lat: -13.2333, lon: 30.2333, capacity_tons: 10000,operator: 'Food Reserve Agency',          phone: '+260970000119', email: 'serenje@fra.gov.zm',     crops: ['Maize'] },
  { name: 'Kapiri Mposhi Transit Depot',      type: 'EXPORT_HUB',   province: 'Central',  district: 'Kapiri Mposhi',  lat: -13.9667, lon: 28.6833, capacity_tons: 12000,operator: 'Tazara Rail Depot',            phone: '+260970000120', email: 'kapiri@tazara.zm',       crops: ['Maize','Copper Transit'] },

  /* ============================================================
     COPPERBELT PROVINCE (4 depots)
     ============================================================ */
  { name: 'Ndola Central Milling',            type: 'MILLER_DEPOT', province: 'Copperbelt',district: 'Ndola',         lat: -12.9587, lon: 28.6366, capacity_tons: 25000,operator: 'Central Milling Ltd',          phone: '+260970000121', email: 'ndola@centralmilling.zm', crops: ['Maize','Wheat'] },
  { name: 'Kitwe Cooperative Union',          type: 'COOPERATIVE',  province: 'Copperbelt',district: 'Kitwe',         lat: -12.8000, lon: 28.2167, capacity_tons: 2000, operator: 'Kitwe Farmers Union',          phone: '+260970000122', email: 'kitwe@coop.zm',          crops: ['Maize','Vegetables'] },
  { name: 'Chingola Agro-Depot',              type: 'AGRO_DEALER',  province: 'Copperbelt',district: 'Chingola',      lat: -12.5333, lon: 27.8500, capacity_tons: 1200, operator: 'Chingola Agro Traders',        phone: '+260970000123', email: 'chingola@agro.zm',       crops: ['Maize','Groundnuts'] },
  { name: 'Mufulira FRA Depot',               type: 'FRA_DEPOT',    province: 'Copperbelt',district: 'Mufulira',      lat: -12.5500, lon: 28.2333, capacity_tons: 6000, operator: 'Food Reserve Agency',          phone: '+260970000124', email: 'mufulira@fra.gov.zm',    crops: ['Maize'] },

  /* ============================================================
     SOUTHERN PROVINCE (5 depots)
     ============================================================ */
  { name: 'Choma Milling Company',            type: 'MILLER_DEPOT', province: 'Southern', district: 'Choma',          lat: -16.8000, lon: 26.9833, capacity_tons: 20000,operator: 'Choma Milling',                phone: '+260970000126', email: 'choma@milling.zm',       crops: ['Maize','Soybeans'] },
  { name: 'Mazabuka Sugar Depot',             type: 'MILLER_DEPOT', province: 'Southern', district: 'Mazabuka',       lat: -15.8500, lon: 27.7667, capacity_tons: 100000,operator: 'Zambia Sugar Plc',            phone: '+260970000127', email: 'mazabuka@zambiasugar.zm', crops: ['Sugarcane','Sugar'] },
  { name: 'Monze Cooperative Bulking',        type: 'COOPERATIVE',  province: 'Southern', district: 'Monze',          lat: -16.2833, lon: 27.4667, capacity_tons: 3500, operator: 'Monze Farmers Coop',           phone: '+260970000128', email: 'monze@coop.zm',          crops: ['Maize','Groundnuts','Sunflower'] },
  { name: 'Kalomo FRA Depot',                 type: 'FRA_DEPOT',    province: 'Southern', district: 'Kalomo',         lat: -17.0333, lon: 26.4833, capacity_tons: 12000,operator: 'Food Reserve Agency',          phone: '+260970000129', email: 'kalomo@fra.gov.zm',      crops: ['Maize'] },
  { name: 'Livingstone Border Depot',         type: 'EXPORT_HUB',   province: 'Southern', district: 'Livingstone',    lat: -17.8500, lon: 25.8667, capacity_tons: 20000,operator: 'Zambia Revenue Authority',     phone: '+260970000130', email: 'livingstone@zra.gov.zm', crops: ['Export Goods','Maize'] },

  /* ============================================================
     WESTERN PROVINCE (9 depots: 5 original + 4 Lukulu)
     ============================================================ */
  { name: 'Mongu FRA Depot',                  type: 'FRA_DEPOT',    province: 'Western',  district: 'Mongu',          lat: -15.2500, lon: 23.1333, capacity_tons: 8000, operator: 'Food Reserve Agency',          phone: '+260970000132', email: 'mongu@fra.gov.zm',       crops: ['Maize','Rice'] },
  { name: 'Kaoma Cooperative Centre',         type: 'COOPERATIVE',  province: 'Western',  district: 'Kaoma',          lat: -14.7833, lon: 24.8000, capacity_tons: 2200, operator: 'Kaoma District Coop',          phone: '+260970000133', email: 'kaoma@coop.zm',          crops: ['Maize','Cassava','Groundnuts'] },
  { name: 'Senanga Rice Millers',             type: 'MILLER_DEPOT', province: 'Western',  district: 'Senanga',        lat: -16.1167, lon: 23.2667, capacity_tons: 4000, operator: 'Senanga Rice Millers',         phone: '+260970000134', email: 'senanga@rice.zm',        crops: ['Rice'] },
  { name: 'Sesheke Border Depot',             type: 'EXPORT_HUB',   province: 'Western',  district: 'Sesheke',        lat: -17.4833, lon: 24.3000, capacity_tons: 6000, operator: 'Sesheke Border Post',          phone: '+260970000135', email: 'sesheke@zra.gov.zm',     crops: ['Export Goods'] },
  { name: 'Kalabo Agro Depot',                type: 'AGRO_DEALER',  province: 'Western',  district: 'Kalabo',         lat: -14.9833, lon: 22.6833, capacity_tons: 800,  operator: 'Kalabo Agro Traders',          phone: '+260970000136', email: 'kalabo@agro.zm',         crops: ['Rice','Maize'] },
  /* Lukulu District Additions */
  { name: 'Lukulu District Cooperative Union',  type: 'COOPERATIVE',  province: 'Western', district: 'Lukulu', lat: -14.3667, lon: 23.2333, capacity_tons: 1800, operator: 'Lukulu District Coop',          phone: '+260970000153', email: 'lukulu@coop.zm',          crops: ['Rice','Cassava','Maize'] },
  { name: 'Lukulu FRA Depot',                   type: 'FRA_DEPOT',    province: 'Western', district: 'Lukulu', lat: -14.3800, lon: 23.2200, capacity_tons: 5000, operator: 'Food Reserve Agency',           phone: '+260970000154', email: 'lukulu@fra.gov.zm',       crops: ['Maize','Rice'] },
  { name: 'Lukulu Rice Millers',                type: 'MILLER_DEPOT', province: 'Western', district: 'Lukulu', lat: -14.3550, lon: 23.2450, capacity_tons: 2500, operator: 'Lukulu Rice Millers Ltd',       phone: '+260970000155', email: 'lukulu@ricemillers.zm',   crops: ['Rice'] },
  { name: 'Lukulu Fisheries Aggregation Hub',   type: 'COOPERATIVE',  province: 'Western', district: 'Lukulu', lat: -14.3900, lon: 23.2100, capacity_tons: 800,  operator: 'Lukulu Fisheries Cooperative',  phone: '+260970000156', email: 'lukulu@fisheries.zm',     crops: ['Fish','Rice','Cassava'] },

  /* ============================================================
     NORTHERN PROVINCE (3 depots)
     ============================================================ */
  { name: 'Kasama FRA Depot',                 type: 'FRA_DEPOT',    province: 'Northern', district: 'Kasama',         lat: -10.2167, lon: 31.1833, capacity_tons: 15000,operator: 'Food Reserve Agency',          phone: '+260970000137', email: 'kasama@fra.gov.zm',      crops: ['Maize','Cassava','Groundnuts'] },
  { name: 'Mbala Coffee Union',               type: 'COOPERATIVE',  province: 'Northern', district: 'Mbala',          lat: -8.8500,  lon: 31.3667, capacity_tons: 1500, operator: 'Mbala Coffee Farmers',         phone: '+260970000138', email: 'mbala@coffee.zm',        crops: ['Coffee','Maize'] },
  { name: 'Mpulungu Port Depot',              type: 'EXPORT_HUB',   province: 'Northern', district: 'Mpulungu',       lat: -8.7667,  lon: 31.1333, capacity_tons: 25000,operator: 'Mpulungu Harbour Corporation', phone: '+260970000139', email: 'mpulungu@harbour.zm',    crops: ['Maize','Cassava','Export Goods'] },

  /* ============================================================
     LUAPULA PROVINCE (3 depots)
     ============================================================ */
  { name: 'Mansa FRA Depot',                  type: 'FRA_DEPOT',    province: 'Luapula',  district: 'Mansa',          lat: -11.2000, lon: 28.8833, capacity_tons: 6000, operator: 'Food Reserve Agency',          phone: '+260970000141', email: 'mansa@fra.gov.zm',       crops: ['Maize','Cassava'] },
  { name: 'Samfya Fisheries Depot',           type: 'COOPERATIVE',  province: 'Luapula',  district: 'Samfya',         lat: -11.3667, lon: 29.5500, capacity_tons: 2000, operator: 'Samfya Fisheries Coop',        phone: '+260970000142', email: 'samfya@coop.zm',         crops: ['Cassava','Fish','Rice'] },
  { name: 'Kawambwa Tea Depot',               type: 'MILLER_DEPOT', province: 'Luapula',  district: 'Kawambwa',       lat: -9.7833,  lon: 29.0833, capacity_tons: 800,  operator: 'Kawambwa Tea Estates',         phone: '+260970000143', email: 'kawambwa@tea.zm',        crops: ['Tea'] },

  /* ============================================================
     MUCHINGA PROVINCE (3 depots)
     ============================================================ */
  { name: 'Chinsali FRA Depot',               type: 'FRA_DEPOT',    province: 'Muchinga', district: 'Chinsali',       lat: -10.5500, lon: 32.0667, capacity_tons: 7000, operator: 'Food Reserve Agency',          phone: '+260970000145', email: 'chinsali@fra.gov.zm',    crops: ['Maize','Cassava'] },
  { name: 'Mpika Agro Depot',                 type: 'AGRO_DEALER',  province: 'Muchinga', district: 'Mpika',          lat: -11.8333, lon: 31.4500, capacity_tons: 1200, operator: 'Mpika Agro Traders',           phone: '+260970000146', email: 'mpika@agro.zm',          crops: ['Maize','Soybeans'] },
  { name: 'Nakonde Border Depot',             type: 'EXPORT_HUB',   province: 'Muchinga', district: 'Nakonde',        lat: -9.3333,  lon: 32.7500, capacity_tons: 30000,operator: 'Nakonde Border Post',          phone: '+260970000147', email: 'nakonde@zra.gov.zm',     crops: ['Export Goods','Maize'] },

  /* ============================================================
     NORTH-WESTERN PROVINCE (4 depots)
     ============================================================ */
  { name: 'Solwezi FRA Depot',                type: 'FRA_DEPOT',    province: 'North-Western',district: 'Solwezi',    lat: -12.1833, lon: 26.4000, capacity_tons: 8000, operator: 'Food Reserve Agency',          phone: '+260970000149', email: 'solwezi@fra.gov.zm',     crops: ['Maize','Cassava'] },
  { name: 'Kasempa Cooperative Depot',        type: 'COOPERATIVE',  province: 'North-Western',district: 'Kasempa',    lat: -13.4500, lon: 25.8333, capacity_tons: 1500, operator: 'Kasempa Farmers Coop',         phone: '+260970000150', email: 'kasempa@coop.zm',        crops: ['Maize','Groundnuts','Cassava'] },
  { name: 'Mwinilunga Honey Depot',           type: 'COOPERATIVE',  province: 'North-Western',district: 'Mwinilunga', lat: -11.7333, lon: 24.4333, capacity_tons: 500,  operator: 'Mwinilunga Beekeepers',        phone: '+260970000151', email: 'mwinilunga@honey.zm',    crops: ['Honey','Cassava','Maize'] },
  { name: 'Zambezi Agro Centre',              type: 'AGRO_DEALER',  province: 'North-Western',district: 'Zambezi',    lat: -13.5500, lon: 23.1167, capacity_tons: 600,  operator: 'Zambezi Agro Traders',         phone: '+260970000152', email: 'zambezi@agro.zm',        crops: ['Maize','Rice'] },
];

/* ============================================================
   SEED DEPOTS (Called at startup)
   ============================================================ */
export function seedDepotsIfEmpty() {
  const count = (db.prepare('SELECT COUNT(*) as c FROM depots').get() as any)?.c || 0;
  const lukuluCount = (db.prepare("SELECT COUNT(*) as c FROM depots WHERE district = 'Lukulu'").get() as any)?.c || 0;

  if (count === ZAMBIA_DEPOTS.length && lukuluCount === 4) {
    console.log(`[depots] Already seeded (${count} depots, 4 Lukulu)`);
    return;
  }

  // Force reseed if count != 47 or Lukulu missing
  console.log(`[depots] Seeding exactly ${ZAMBIA_DEPOTS.length} depots across 10 provinces...`);
  db.prepare('DELETE FROM depots').run();

  const insert = db.prepare(`
    INSERT INTO depots
      (id, name, type, province, district, latitude, longitude, capacity_tons, operator, phone, email, crops, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < ZAMBIA_DEPOTS.length; i++) {
    const d = ZAMBIA_DEPOTS[i];
    insert.run(
      `depot-${i + 1}`,
      d.name,
      d.type,
      d.province,
      d.district,
      d.lat,
      d.lon,
      d.capacity_tons,
      d.operator,
      d.phone,
      d.email,
      JSON.stringify(d.crops),
      new Date().toISOString()
    );
  }

  console.log(`[depots] ✅ Seeded ${ZAMBIA_DEPOTS.length} depots across 10 provinces`);
}

/* ============================================================
   ENDPOINTS
   ============================================================ */

// GET /api/depots
depotsRouter.get('/depots', (req: Request, res: Response) => {
  const { type, province, district } = req.query;
  let sql = 'SELECT * FROM depots WHERE 1=1';
  const params: any[] = [];

  if (type) {
    sql += ' AND type = ?';
    params.push(String(type));
  }
  if (province) {
    sql += ' AND province = ?';
    params.push(String(province));
  }
  if (district) {
    sql += ' AND district = ?';
    params.push(String(district));
  }

  sql += ' ORDER BY province, name';
  const rows = db.prepare(sql).all(...params) as any[];

  const formatted = rows.map((r) => ({
    _id: r.id,
    id: r.id,
    name: r.name,
    type: r.type,
    province: r.province,
    district: r.district,
    lat: r.latitude,
    lon: r.longitude,
    latitude: r.latitude,
    longitude: r.longitude,
    capacity_tons: r.capacity_tons,
    operator: r.operator,
    phone: r.phone,
    email: r.email,
    crops: typeof r.crops === 'string' ? JSON.parse(r.crops || '[]') : r.crops || [],
    created_at: r.created_at,
  }));

  res.json(formatted);
});

// GET /api/depots/stats
depotsRouter.get('/depots/stats', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM depots').all() as any[];
  const byType: Record<string, number> = {};
  const byProvince: Record<string, number> = {};
  let totalCapacity = 0;

  for (const d of rows) {
    byType[d.type] = (byType[d.type] || 0) + 1;
    byProvince[d.province] = (byProvince[d.province] || 0) + 1;
    totalCapacity += Number(d.capacity_tons) || 0;
  }

  res.json({
    total_depots: rows.length,
    total_capacity_tons: totalCapacity,
    by_type: byType,
    by_province: byProvince,
  });
});
