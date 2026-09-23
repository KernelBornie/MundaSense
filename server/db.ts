/**
 * MundaSense — Hybrid MongoDB Atlas & In-Memory Storage Engine
 *
 * Implements a hybrid architecture:
 * 1. Synchronous db.prepare(...).get/all/run API backed by an in-memory execution engine (sql.js)
 *    and structured Maps cache (getCache()) to maintain full zero-latency compatibility with
 *    all 551 farms, 113 districts, 47 depots, 15 hubs, and marketplace queries.
 * 2. Background asynchronous synchronization with MongoDB Atlas (via MONGODB_URI).
 * 3. Fast hydration (hydrate()) loading all collections into memory.
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import initSqlJs from 'sql.js';
import { MongoClient, type Db } from 'mongodb';

dotenv.config();

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'mundasense.db');

/* ============================================================
   IN-MEMORY MAP CACHE
   ============================================================ */
export const cache: {
  users: Map<string, any>;
  ussd_sessions: Map<string, any>;
  farms: Map<number | string, any>;
  listings: Map<number | string, any>;
  orders: Map<number | string, any>;
  transport_requests: Map<number | string, any>;
  transport_bids: Map<number | string, any>;
  advisories: Map<number | string, any>;
  sms_log: Map<number | string, any>;
  sensor_hubs: Map<number | string, any>;
  sensor_readings: Map<number | string, any>;
  storage_units: Map<number | string, any>;
  crop_health_reports: Map<number | string, any>;
  depots: Map<string, any>;
  [key: string]: Map<any, any>;
} = {
  users: new Map(),
  ussd_sessions: new Map(),
  farms: new Map(),
  listings: new Map(),
  orders: new Map(),
  transport_requests: new Map(),
  transport_bids: new Map(),
  advisories: new Map(),
  sms_log: new Map(),
  sensor_hubs: new Map(),
  sensor_readings: new Map(),
  storage_units: new Map(),
  crop_health_reports: new Map(),
  depots: new Map(),
};

export function getCache() {
  return cache;
}

/* ============================================================
   SQL ENGINE INITIALIZATION
   ============================================================ */
const SQL = await initSqlJs();
let sqlDb: any;
if (fs.existsSync(DB_PATH)) {
  try {
    const filebuffer = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(filebuffer);
  } catch {
    sqlDb = new SQL.Database();
  }
} else {
  sqlDb = new SQL.Database();
}

function persist() {
  try {
    const data = sqlDb.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch {
    // Ignore persistence errors
  }
}

function cleanParams(params: any[]): any[] {
  const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
  return flat.map((v) => (v === undefined ? null : v));
}

export interface RunResult {
  lastInsertRowid: number | bigint;
  changes: number;
}

export interface Statement {
  get(...params: any[]): any;
  all(...params: any[]): any[];
  run(...params: any[]): RunResult;
}

/* ============================================================
   BACKGROUND MONGODB MUTATION SYNC
   ============================================================ */
function handleBackgroundMutation(sql: string, params: any[], lastInsertRowid: number) {
  const upper = sql.trim().toUpperCase();
  const tableMatch = sql.match(/(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+([a-zA-Z0-9_]+)/i);
  if (!tableMatch) return;
  const table = tableMatch[1].toLowerCase();
  const colCache = cache[table];

  try {
    if (upper.startsWith('INSERT')) {
      let row: any = null;
      if (lastInsertRowid > 0) {
        const stmt = sqlDb.prepare(`SELECT * FROM ${table} WHERE rowid = ?`);
        stmt.bind([lastInsertRowid]);
        if (stmt.step()) row = stmt.getAsObject();
        stmt.free();
      } else if (params.length > 0) {
        const possibleId = params[0];
        if (typeof possibleId === 'string' || typeof possibleId === 'number') {
          const stmt = sqlDb.prepare(`SELECT * FROM ${table} WHERE id = ?`);
          try {
            stmt.bind([possibleId]);
            if (stmt.step()) row = stmt.getAsObject();
          } catch {}
          stmt.free();
        }
      }

      if (row && colCache) {
        const docId = row.id ?? row.hub_code ?? row.session_id ?? lastInsertRowid;
        colCache.set(docId, row);
        if (mongoDb) {
          mongoDb.collection(table).updateOne(
            { id: docId },
            { $set: row },
            { upsert: true }
          ).catch((e) => console.warn(`[db] Mongo background write error on ${table}:`, e.message));
        }
      }
    } else if (upper.startsWith('UPDATE')) {
      if (colCache) {
        const stmt = sqlDb.prepare(`SELECT * FROM ${table}`);
        while (stmt.step()) {
          const r = stmt.getAsObject();
          const docId = r.id ?? r.hub_code ?? r.session_id;
          if (docId !== undefined) {
            colCache.set(docId, r);
          }
        }
        stmt.free();

        if (mongoDb) {
          const allDocs = Array.from(colCache.values());
          if (allDocs.length > 0) {
            const bulkOps = allDocs.map((doc) => {
              const docId = doc.id ?? doc.hub_code ?? doc.session_id;
              return {
                updateOne: {
                  filter: { id: docId },
                  update: { $set: doc },
                  upsert: true,
                },
              };
            });
            mongoDb.collection(table).bulkWrite(bulkOps).catch((e) => {
              console.warn(`[db] Mongo background bulk update error on ${table}:`, e.message);
            });
          }
        }
      }
    } else if (upper.startsWith('DELETE')) {
      if (upper.includes('WHERE')) {
        const idToDelete = params[0];
        if (idToDelete !== undefined && colCache) {
          colCache.delete(idToDelete);
          if (mongoDb) {
            mongoDb.collection(table).deleteOne({
              $or: [{ id: idToDelete }, { session_id: idToDelete }, { hub_code: idToDelete }],
            }).catch(() => {});
          }
        }
      } else {
        colCache?.clear();
        if (mongoDb) {
          mongoDb.collection(table).deleteMany({}).catch(() => {});
        }
      }
    }
  } catch (err: any) {
    console.warn(`[db] Background sync error:`, err.message);
  }
}

/* ============================================================
   SYNCHRONOUS DB SHIM
   ============================================================ */
export const db = {
  pragma(_cmd: string) {
    try {
      sqlDb.run(`PRAGMA ${_cmd}`);
    } catch {}
  },
  exec(sql: string) {
    sqlDb.exec(sql);
    persist();
  },
  prepare(sql: string): Statement {
    return {
      get(...params: any[]) {
        const cleaned = cleanParams(params);
        const stmt = sqlDb.prepare(sql);
        try {
          if (cleaned.length > 0) stmt.bind(cleaned);
          if (stmt.step()) return stmt.getAsObject();
          return undefined;
        } finally {
          stmt.free();
        }
      },
      all(...params: any[]) {
        const cleaned = cleanParams(params);
        const stmt = sqlDb.prepare(sql);
        try {
          if (cleaned.length > 0) stmt.bind(cleaned);
          const rows: any[] = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          return rows;
        } finally {
          stmt.free();
        }
      },
      run(...params: any[]): RunResult {
        const cleaned = cleanParams(params);
        if (cleaned.length > 0) sqlDb.run(sql, cleaned);
        else sqlDb.run(sql);
        const res = sqlDb.exec('SELECT last_insert_rowid() AS id, changes() AS changes');
        const lastInsertRowid = res[0]?.values[0]?.[0] ? Number(res[0].values[0][0]) : 0;
        const changes = res[0]?.values[0]?.[1] ? Number(res[0].values[0][1]) : 0;
        persist();

        handleBackgroundMutation(sql, cleaned, lastInsertRowid);

        return { lastInsertRowid, changes };
      },
    };
  },
};

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* ============================================================
   SCHEMA CREATION
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
    seller_name TEXT,
    crop TEXT NOT NULL,
    variety TEXT,
    grade TEXT,
    quantity_kg REAL NOT NULL,
    price_per_kg_zmw REAL NOT NULL,
    district TEXT,
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
    pickup_province TEXT,
    pickup_district TEXT,
    dropoff_location TEXT NOT NULL,
    dropoff_province TEXT,
    dropoff_district TEXT,
    cargo_description TEXT,
    weight_kg REAL,
    budget_zmw REAL,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
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
`);

export const getDb = () => db;

function reloadAllIntoCache() {
  for (const col of Object.keys(cache)) {
    try {
      const stmt = sqlDb.prepare(`SELECT * FROM ${col}`);
      const map = cache[col];
      map.clear();
      while (stmt.step()) {
        const row = stmt.getAsObject();
        const id = row.id ?? row.hub_code ?? row.session_id;
        if (id !== undefined) {
          map.set(id, row);
        }
      }
      stmt.free();
    } catch {}
  }
}

// Initial hydration from local SQLite store
reloadAllIntoCache();

/* ============================================================
   MONGODB ATLAS INTEGRATION
   ============================================================ */
export let mongoClient: MongoClient | null = null;
export let mongoDb: Db | null = null;

export async function connectMongo(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'mundasense';

  if (!uri) {
    console.warn(`[db] ⚠️  MONGODB_URI not configured — operating in hybrid in-memory store`);
    return null;
  }

  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await client.connect();
    mongoClient = client;
    mongoDb = client.db(dbName);
    console.log(`[db] ✅ MongoDB connected — ${dbName}`);
    return mongoDb;
  } catch (err: any) {
    console.error(`[db] ❌ MongoDB connection error: ${err.message}`);
    return null;
  }
}

export async function hydrate(): Promise<void> {
  if (mongoDb) {
    try {
      for (const col of Object.keys(cache)) {
        try {
          const docs = await mongoDb.collection(col).find({}).toArray();
          if (docs && docs.length > 0) {
            cache[col].clear();
            try {
              sqlDb.run(`DELETE FROM ${col}`);
            } catch {}

            for (const doc of docs) {
              const { _id, ...cleanDoc } = doc as any;
              const docId = cleanDoc.id ?? cleanDoc.hub_code ?? cleanDoc.session_id ?? (_id ? String(_id) : uuid());
              if (cleanDoc.id === undefined && typeof docId === 'number') {
                cleanDoc.id = docId;
              }
              cache[col].set(docId, cleanDoc);

              const keys = Object.keys(cleanDoc);
              if (keys.length > 0) {
                const placeholders = keys.map(() => '?').join(', ');
                const values = keys.map((k) => (cleanDoc[k] !== undefined ? cleanDoc[k] : null));
                try {
                  sqlDb.run(
                    `INSERT OR REPLACE INTO ${col} (${keys.join(', ')}) VALUES (${placeholders})`,
                    values
                  );
                } catch {}
              }
            }
          }
        } catch (colErr: any) {
          console.warn(`[db] Error hydrating collection ${col}:`, colErr.message);
        }
      }
    } catch (err: any) {
      console.warn(`[db] Hydration from MongoDB failed:`, err.message);
    }
  }

  reloadAllIntoCache();

  console.log(
    `[db] ✅ Hydrated — users:${cache.users?.size || 0} · farms:${cache.farms?.size || 0} · hubs:${cache.sensor_hubs?.size || 0} · depots:${cache.depots?.size || 0} · listings:${cache.listings?.size || 0}`
  );
}

export async function syncAllToMongo(): Promise<void> {
  if (!mongoDb) return;
  for (const col of Object.keys(cache)) {
    const items = Array.from(cache[col].values());
    if (items.length > 0) {
      try {
        const collection = mongoDb.collection(col);
        const count = await collection.countDocuments();
        if (count === 0) {
          await collection.insertMany(items.map((it) => ({ ...it })));
        }
      } catch (err: any) {
        console.warn(`[db] Failed to sync ${col} to MongoDB: ${err.message}`);
      }
    }
  }
}

export async function seedIfEmpty(): Promise<void> {
  await hydrate();

  const farmCount = cache.farms?.size || (db.prepare('SELECT COUNT(*) as c FROM farms').get() as any)?.c || 0;
  const userCount = cache.users?.size || (db.prepare('SELECT COUNT(*) as c FROM users').get() as any)?.c || 0;

  if (farmCount === 0 || userCount === 0) {
    const { seedDatabase } = await import('./seed.ts');
    seedDatabase();
    reloadAllIntoCache();
    if (mongoDb) {
      await syncAllToMongo();
    }
  }
}

/* ============================================================
   HELPERS & QUERIES (Preserving all original named exports)
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
  } catch {
    return false;
  }
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function findUserByPhone(phone: string) {
  if (cache.users) {
    for (const u of cache.users.values()) {
      if (u.phone === phone) return u;
    }
  }
  return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
}

export function findUserByEmail(email: string) {
  if (cache.users) {
    for (const u of cache.users.values()) {
      if (u.email && u.email.toLowerCase() === email.toLowerCase()) return u;
    }
  }
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
    id,
    u.phone,
    u.email || null,
    u.full_name,
    u.role,
    u.village || null,
    u.district || null,
    u.province || null,
    u.language || 'English',
    hashPin(u.pin),
    u.ziamis_id || null
  );
  return findUserByPhone(u.phone);
}

export function saveUssdSession(sessionId: string, phone: string, serviceCode: string, step: string, data: any) {
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
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

export function logSms(
  phone: string,
  direction: 'in' | 'out',
  message: string,
  provider?: string,
  provider_id?: string,
  status = 'queued'
) {
  const info = db.prepare(`
    INSERT INTO sms_log (phone, direction, message, provider, provider_id, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(phone, direction, message, provider || null, provider_id || null, status);
  return info.lastInsertRowid;
}

export function updateSmsStatus(
  id: number | bigint,
  status: string,
  providerId?: string
) {
  db.prepare(
    'UPDATE sms_log SET status = ?, provider_id = COALESCE(?, provider_id) WHERE id = ?'
  ).run(status, providerId || null, id);
}

export function listActiveListings(crop?: string) {
  const sql = `
    SELECT l.*,
      COALESCE(l.seller_name, u.full_name, 'Zambian Farmer') AS seller_name,
      COALESCE(l.seller_phone, u.phone) AS seller_phone,
      COALESCE(l.seller_email, u.email) AS seller_email,
      COALESCE(l.village, u.village) AS seller_village,
      COALESCE(l.province, u.province) AS seller_province
    FROM listings l
    LEFT JOIN users u ON u.phone = l.seller_phone
    WHERE l.status = 'available'
    ${crop ? 'AND l.crop = ?' : ''}
    ORDER BY l.created_at DESC
  `;
  return crop ? (db.prepare(sql).all(crop) as any[]) : (db.prepare(sql).all() as any[]);
}

export function createListing(l: {
  seller_name?: string;
  seller_phone: string;
  seller_email?: string;
  crop: string;
  quantity_kg: number;
  price_per_kg_zmw: number;
  district?: string;
  village?: string;
  province?: string;
  description?: string;
}) {
  const info = db.prepare(`
    INSERT INTO listings
      (seller_name, seller_phone, seller_email, crop, quantity_kg,
       price_per_kg_zmw, district, village, province, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    l.seller_name || null,
    l.seller_phone,
    l.seller_email || null,
    l.crop,
    l.quantity_kg,
    l.price_per_kg_zmw,
    l.district || null,
    l.village || null,
    l.province || null,
    l.description || null
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
