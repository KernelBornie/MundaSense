/**
 * MundaSense — Persistent Database Layer
 * Built with native Node.js SQLite (node:sqlite).
 * SQLite file stored at data/mundasense.db.
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'mundasense.db');
export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

/* ============================================================
   SCHEMA
   ============================================================ */
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin','farmer','seller','customer','transporter')),
    village TEXT,
    district TEXT,
    province TEXT,
    ziamis_id TEXT,
    language TEXT DEFAULT 'English',
    pin_hash TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ussd_sessions (
    session_id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    service_code TEXT,
    current_step TEXT,
    data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT
  );

  CREATE TABLE IF NOT EXISTS farms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_phone TEXT NOT NULL,
    name TEXT NOT NULL,
    village TEXT,
    district TEXT,
    province TEXT,
    latitude REAL,
    longitude REAL,
    crop TEXT,
    crop_stage TEXT,
    soil_moisture REAL,
    health_status TEXT DEFAULT 'healthy',
    disease_risk TEXT DEFAULT 'LOW',
    ziamis_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_phone TEXT NOT NULL,
    seller_email TEXT,
    crop TEXT NOT NULL,
    variety TEXT,
    grade TEXT,
    quantity_kg REAL NOT NULL,
    price_per_kg_zmw REAL NOT NULL,
    village TEXT,
    province TEXT,
    description TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available','reserved','sold','cancelled')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER REFERENCES listings(id),
    buyer_phone TEXT NOT NULL,
    quantity_kg REAL NOT NULL,
    total_zmw REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_transit','delivered','cancelled')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transport_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_phone TEXT NOT NULL,
    order_id INTEGER REFERENCES orders(id),
    pickup_location TEXT NOT NULL,
    dropoff_location TEXT NOT NULL,
    cargo_description TEXT,
    weight_kg REAL,
    budget_zmw REAL,
    contact_name TEXT,
    contact_phone TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open','assigned','in_transit','delivered')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transport_bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL REFERENCES transport_requests(id),
    transporter_phone TEXT NOT NULL,
    price_zmw REAL NOT NULL,
    vehicle TEXT,
    eta_hours INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS advisories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_phone TEXT NOT NULL,
    channel TEXT NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    language TEXT,
    status TEXT DEFAULT 'queued',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sms_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('in','out')),
    message TEXT NOT NULL,
    provider TEXT,
    provider_id TEXT,
    status TEXT DEFAULT 'queued',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sensor_hubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hub_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    province TEXT NOT NULL,
    district TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    coverage_radius_km REAL DEFAULT 15,
    battery REAL DEFAULT 88,
    battery_voltage REAL DEFAULT 4.12,
    solar_v REAL DEFAULT 5.8,
    solar_input_voltage REAL DEFAULT 5.8,
    signal_dbm REAL DEFAULT -76,
    gsm_signal_dbm REAL DEFAULT -76,
    uptime_h REAL DEFAULT 720,
    last_seen TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hub_id INTEGER NOT NULL REFERENCES sensor_hubs(id),
    soil_moisture_15cm REAL NOT NULL,
    soil_moisture_30cm REAL NOT NULL,
    soil_moisture_60cm REAL NOT NULL,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    rainfall REAL DEFAULT 0,
    recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS storage_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    crop TEXT NOT NULL,
    capacity_tons REAL NOT NULL,
    current_fill_tons REAL NOT NULL,
    moisture_percent REAL NOT NULL,
    temp_c REAL NOT NULL,
    co2_ppm REAL NOT NULL,
    status TEXT DEFAULT 'optimal' CHECK (status IN ('optimal','warning','critical')),
    aflatoxin_risk TEXT DEFAULT 'LOW' CHECK (aflatoxin_risk IN ('LOW','MEDIUM','HIGH')),
    last_inspected TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
  CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_phone);
  CREATE INDEX IF NOT EXISTS idx_farms_phone ON farms(farmer_phone);
  CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_log(phone);

  CREATE TABLE IF NOT EXISTS crop_health_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER,
    phone TEXT,
    crop TEXT NOT NULL,
    prediction TEXT NOT NULL,
    pathogen TEXT,
    confidence REAL NOT NULL,
    severity TEXT,
    risk TEXT,
    symptoms TEXT,
    recommendation TEXT,
    prevention TEXT,
    needs_review INTEGER DEFAULT 0,
    stage TEXT,
    spread_risk TEXT,
    yield_impact TEXT,
    treatment_priority TEXT,
    treatment_reasoning TEXT,
    treatment_plan_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_disease_phone ON crop_health_reports(phone);
  CREATE INDEX IF NOT EXISTS idx_disease_created ON crop_health_reports(created_at);

  CREATE TABLE IF NOT EXISTS depots (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    province TEXT NOT NULL,
    district TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    capacity_tons REAL NOT NULL,
    operator TEXT,
    phone TEXT,
    email TEXT,
    crops TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_depots_province ON depots(province);
  CREATE INDEX IF NOT EXISTS idx_depots_district ON depots(district);
  CREATE INDEX IF NOT EXISTS idx_depots_type ON depots(type);
`);

export const getDb = () => db;

// Migration for existing databases
try {
  const cols = (db.prepare('PRAGMA table_info(crop_health_reports)').all() as any[]).map((c: any) => c.name);
  const additions: [string, string][] = [
    ['stage', 'TEXT'],
    ['spread_risk', 'TEXT'],
    ['yield_impact', 'TEXT'],
    ['treatment_priority', 'TEXT'],
    ['treatment_reasoning', 'TEXT'],
    ['treatment_plan_json', 'TEXT'],
  ];
  for (const [name, type] of additions) {
    if (!cols.includes(name)) {
      db.exec(`ALTER TABLE crop_health_reports ADD COLUMN ${name} ${type}`);
    }
  }
} catch (e) {
  console.warn('[db] migration skipped:', e);
}

try {
  const cols = (db.prepare('PRAGMA table_info(listings)').all() as any[]).map((c: any) => c.name);
  if (!cols.includes('seller_phone'))
    db.exec("ALTER TABLE listings ADD COLUMN seller_phone TEXT");
  if (!cols.includes('seller_email'))
    db.exec("ALTER TABLE listings ADD COLUMN seller_email TEXT");

  db.exec(`
    UPDATE listings SET seller_email = 'seller@mundasense.zm' WHERE (seller_email IS NULL OR seller_email = '') AND seller_phone = '+260970000004';
    UPDATE listings SET seller_email = 'farmer@mundasense.zm' WHERE (seller_email IS NULL OR seller_email = '') AND seller_phone = '+260970000002';
  `);
} catch (e) {
  console.warn('[db] migration skipped:', e);
}

/* ============================================================
   HELPERS
   ============================================================ */
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pin, salt, 100_000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const check = crypto.pbkdf2Sync(pin, salt, 100_000, 32, 'sha256').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
  } catch { return false; }
}

export function uuid(): string {
  return crypto.randomUUID();
}

/* ============================================================
   USER QUERIES
   ============================================================ */
export function findUserByPhone(phone: string) {
  return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
}

export function findUserByEmail(email: string) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
}

export function createUser(u: {
  phone: string;
  email?: string;
  full_name: string;
  role: string;
  village?: string;
  district?: string;
  province?: string;
  language?: string;
  pin: string;
  ziamis_id?: string;
}) {
  const id = uuid();
  db.prepare(`
    INSERT INTO users (id, phone, email, full_name, role, village, district, province, language, pin_hash, ziamis_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, u.phone, u.email || null, u.full_name, u.role,
    u.village || null, u.district || null, u.province || null,
    u.language || 'English', hashPin(u.pin), u.ziamis_id || null
  );
  return findUserByPhone(u.phone);
}

/* ============================================================
   USSD SESSION QUERIES
   ============================================================ */
export function saveUssdSession(sessionId: string, phone: string, serviceCode: string, step: string, data: any) {
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min
  db.prepare(`
    INSERT INTO ussd_sessions (session_id, phone, service_code, current_step, data, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_id) DO UPDATE SET
      current_step = excluded.current_step,
      data = excluded.data,
      expires_at = excluded.expires_at
  `).run(sessionId, phone, serviceCode, step, JSON.stringify(data), expires);
}

export function getUssdSession(sessionId: string) {
  const row = db.prepare(
    'SELECT * FROM ussd_sessions WHERE session_id = ? AND expires_at > CURRENT_TIMESTAMP'
  ).get(sessionId) as any;
  if (!row) return null;
  return { ...row, data: JSON.parse(row.data || '{}') };
}

export function deleteUssdSession(sessionId: string) {
  db.prepare('DELETE FROM ussd_sessions WHERE session_id = ?').run(sessionId);
}

/* ============================================================
   SMS LOG
   ============================================================ */
export function logSms(phone: string, direction: 'in' | 'out', message: string, provider?: string, provider_id?: string, status = 'queued') {
  const info = db.prepare(`
    INSERT INTO sms_log (phone, direction, message, provider, provider_id, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(phone, direction, message, provider || null, provider_id || null, status);
  return info.lastInsertRowid;
}

/**
 * Update the delivery status of an outbound SMS.
 */
export function updateSmsStatus(
  id: number | bigint,
  status: string,
  providerId?: string
) {
  db.prepare(
    'UPDATE sms_log SET status = ?, provider_id = COALESCE(?, provider_id) WHERE id = ?'
  ).run(status, providerId || null, id);
}

/* ============================================================
   MARKETPLACE QUERIES
   ============================================================ */
export function listActiveListings(crop?: string) {
  const sql = `
    SELECT l.*,
      u.full_name AS seller_name,
      u.phone     AS seller_phone,
      u.email     AS seller_email,
      u.village   AS seller_village,
      u.province  AS seller_province
    FROM listings l
    LEFT JOIN users u ON u.phone = l.seller_phone
    WHERE l.status = 'available'
    ${crop ? 'AND l.crop = ?' : ''}
    ORDER BY l.created_at DESC
  `;
  return crop ? (db.prepare(sql).all(crop) as any[]) : (db.prepare(sql).all() as any[]);
}

export function createListing(l: {
  seller_phone: string;
  seller_email?: string;
  crop: string;
  quantity_kg: number;
  price_per_kg_zmw: number;
  village?: string;
  province?: string;
  description?: string;
}) {
  const info = db.prepare(`
    INSERT INTO listings
      (seller_phone, seller_email, crop, quantity_kg,
       price_per_kg_zmw, village, province, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    l.seller_phone, l.seller_email || null, l.crop,
    l.quantity_kg, l.price_per_kg_zmw,
    l.village || null, l.province || null, l.description || null
  );
  return db.prepare('SELECT * FROM listings WHERE id = ?').get(info.lastInsertRowid as any);
}

export function getMarketPrice(crop: string) {
  const row = db.prepare(
    "SELECT AVG(price_per_kg_zmw) as avg_price FROM listings WHERE crop = ? AND status = 'available'"
  ).get(crop) as any;
  return row?.avg_price ? +row.avg_price.toFixed(2) : null;
}

export function getMarketPrices() {
  const rows = db.prepare(`
    SELECT crop, AVG(price_per_kg_zmw) as price, COUNT(*) as listings
    FROM listings WHERE status = 'available'
    GROUP BY crop ORDER BY crop
  `).all() as any[];
  return rows.map((r) => ({ crop: r.crop, price: +Number(r.price).toFixed(2), listings: Number(r.listings) }));
}

export interface DiseaseReportInput {
  farm_id?: number;
  phone?: string;
  crop: string;
  prediction: string;
  pathogen?: string;
  confidence: number;
  severity?: string;
  risk?: string;
  symptoms?: string;
  recommendation?: string;
  prevention?: string;
  needs_review?: number;
  stage?: string;
  spread_risk?: string;
  yield_impact?: string;
  treatment_priority?: string;
  treatment_reasoning?: string;
  treatment_plan_json?: string;
}

export function saveDiseaseReport(input: DiseaseReportInput): number {
  const info = db.prepare(`
    INSERT INTO crop_health_reports
      (farm_id, phone, crop, prediction, pathogen, confidence,
       severity, risk, symptoms, recommendation, prevention, needs_review,
       stage, spread_risk, yield_impact, treatment_priority,
       treatment_reasoning, treatment_plan_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.farm_id ?? null,
    input.phone ?? null,
    input.crop,
    input.prediction,
    input.pathogen ?? null,
    input.confidence,
    input.severity ?? null,
    input.risk ?? null,
    input.symptoms ?? null,
    input.recommendation ?? null,
    input.prevention ?? null,
    input.needs_review ?? 0,
    input.stage ?? null,
    input.spread_risk ?? null,
    input.yield_impact ?? null,
    input.treatment_priority ?? null,
    input.treatment_reasoning ?? null,
    input.treatment_plan_json ?? null
  );
  return Number(info.lastInsertRowid);
}

export function listDiseaseReports(limit = 50) {
  return db.prepare(
    'SELECT * FROM crop_health_reports ORDER BY created_at DESC LIMIT ?'
  ).all(limit);
}

export function listDiseaseReportsForPhone(phone: string, limit = 20) {
  return db.prepare(
    'SELECT * FROM crop_health_reports WHERE phone = ? ORDER BY created_at DESC LIMIT ?'
  ).all(phone, limit);
}
