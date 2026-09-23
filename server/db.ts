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

  CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
  CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_phone);
  CREATE INDEX IF NOT EXISTS idx_farms_phone ON farms(farmer_phone);
  CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_log(phone);
`);

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

/* ============================================================
   MARKETPLACE QUERIES
   ============================================================ */
export function listActiveListings(crop?: string) {
  const sql = crop
    ? "SELECT * FROM listings WHERE status = 'available' AND crop = ? ORDER BY created_at DESC"
    : "SELECT * FROM listings WHERE status = 'available' ORDER BY created_at DESC";
  return crop ? (db.prepare(sql).all(crop) as any[]) : (db.prepare(sql).all() as any[]);
}

export function createListing(l: {
  seller_phone: string;
  crop: string;
  quantity_kg: number;
  price_per_kg_zmw: number;
  village?: string;
  province?: string;
  description?: string;
}) {
  const info = db.prepare(`
    INSERT INTO listings (seller_phone, crop, quantity_kg, price_per_kg_zmw, village, province, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(l.seller_phone, l.crop, l.quantity_kg, l.price_per_kg_zmw, l.village || null, l.province || null, l.description || null);
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
