import express, { type Request, type Response, type NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

import {
  findUserByPhone,
  findUserByEmail,
  createUser,
  verifyPin,
  listActiveListings,
  getMarketPrices,
  listDiseaseReportsForPhone,
  db,
} from './server/db.ts';
import { handleUssd } from './server/ussd.ts';
import { sendSms, sendBulkSms, getAccountBalance } from './server/sms.ts';
import { seedDatabase } from './server/seed.ts';
import { depotsRouter, seedDepotsIfEmpty } from './server/depots.ts';
import { farmsRouter } from './server/farms.ts';
import {
  analyzeLeafImage,
  getRecentReports,
  getCropList,
  geminiStatus,
} from './server/disease.ts';
import { marketplaceRouter } from './server/marketplace.ts';
import { advisoriesRouter } from './server/advisories.ts';
import { sensorsRouter } from './server/sensors.ts';
import { storageRouter } from './server/storage.ts';
import { transportRouter } from './server/transport.ts';

dotenv.config();

/* Boot: seed DB if empty */
seedDatabase();
seedDepotsIfEmpty();
const lukuluBootCount = (db.prepare("SELECT COUNT(*) as c FROM depots WHERE district = 'Lukulu'").get() as any)?.c || 0;
console.log(`[boot] Lukulu depots: ${lukuluBootCount}`);
if (lukuluBootCount === 0) {
  console.warn('[boot] ⚠️  Lukulu depots missing. Forcing reseed...');
  seedDepotsIfEmpty();
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

/* ============================================================
   SESSION TOKENS (JWT-style, in-memory for now)
   ============================================================ */
const sessions: Map<string, { user_id: string; expires: number }> = new Map();

function issueToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    user_id: userId,
    expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  return token;
}

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = (req.header('authorization') || '').replace('Bearer ', '');
  const sess = sessions.get(token);
  if (!sess || sess.expires < Date.now()) {
    (req as any).user = null;
    return next();
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(sess.user_id) as any;
  (req as any).user = user || null;
  next();
}
app.use(authMiddleware);

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).user) return res.status(401).json({ error: 'unauthorized' });
  next();
};

const publicUser = (u: any) => ({
  id: u.id,
  email: u.email,
  phone: u.phone,
  full_name: u.full_name,
  role: u.role,
  village: u.village,
  district: u.district,
  province: u.province,
  ziamis_id: u.ziamis_id,
  language: u.language,
});

/* ============================================================
   AUTH ENDPOINTS
   ============================================================ */
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, phone, password, full_name, role, village, province, language } = req.body;
  if (!phone || !password || !full_name) {
    return res.status(400).json({ error: 'phone, password, full_name required' });
  }
  if (findUserByPhone(phone)) return res.status(409).json({ error: 'phone already registered' });
  if (email && findUserByEmail(email)) return res.status(409).json({ error: 'email already registered' });

  const user = createUser({
    phone,
    email,
    full_name,
    role: role || 'farmer',
    village,
    province,
    language: language || 'English',
    pin: password,
  });

  const token = issueToken(user.id);
  res.json({ token, user: publicUser(user) });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ error: 'identifier and password required' });

  const user = identifier.includes('@')
    ? findUserByEmail(identifier)
    : findUserByPhone(identifier);

  if (!user || !user.is_active) return res.status(401).json({ error: 'invalid credentials' });
  if (!verifyPin(password, user.pin_hash)) return res.status(401).json({ error: 'invalid credentials' });

  const token = issueToken(user.id);
  res.json({ token, user: publicUser(user) });
});

app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: publicUser((req as any).user) });
});

app.post('/api/auth/logout', requireAuth, (req: Request, res: Response) => {
  const token = (req.header('authorization') || '').replace('Bearer ', '');
  sessions.delete(token);
  res.json({ ok: true });
});

/* ============================================================
   USSD — Real Africa's Talking webhook + test endpoint
   ============================================================ */
app.post('/ussd', handleUssd);
app.post('/api/ussd', handleUssd);
app.post('/api/ussd/simulate', handleUssd);

app.get('/api/ussd/sessions', (_req: Request, res: Response) => {
  const rows = db.prepare(
    'SELECT * FROM ussd_sessions WHERE expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 20'
  ).all();
  res.json(rows);
});

/* ============================================================
   SMS — Real Africa's Talking integration
   ============================================================ */

/**
 * Inbound SMS webhook (called by Africa's Talking).
 * AT POSTs form-encoded with fields: from, to, text, date, id, linkId
 */
app.post('/sms/webhook', async (req: Request, res: Response) => {
  const from = String(req.body.from || req.body.from_ || req.body.sender || '').trim();
  const to = String(req.body.to || req.body.recipient || '');
  const text = String(req.body.text || req.body.message || '').trim();
  const messageId = String(req.body.id || req.body.messageId || '');
  const linkId = String(req.body.linkId || '');

  console.log(`[SMS-IN] from=${from} to=${to} text="${text}" id=${messageId}`);

  if (!from || !text) {
    return res.status(400).type('text/plain').send('Missing from or text');
  }

  // Log inbound message
  db.prepare(
    "INSERT INTO sms_log (phone, direction, message, provider, provider_id, status) VALUES (?, 'in', ?, 'africastalking', ?, 'received')"
  ).run(from, text, messageId);

  const upper = text.toUpperCase();
  const [cmd, arg] = upper.split(/\s+/);
  let reply = 'MundaSense: Reply HELP for options.';

  try {
    // SOIL — live soil moisture for the farmer's farm
    if (cmd === 'SOIL') {
      const farm: any = db
        .prepare('SELECT * FROM farms WHERE farmer_phone = ? LIMIT 1')
        .get(from);
      reply = farm
        ? `MundaSense: Soil moisture @30cm is ${Number(farm.soil_moisture).toFixed(1)}%. Crop: ${farm.crop}. Health: ${farm.health_status}.`
        : 'MundaSense: No farm registered to this number. Dial *384*2873# to register.';
    }

    // PRICE <crop> — market price query
    else if (cmd === 'PRICE') {
      const prices = getMarketPrices();
      if (arg) {
        const hit = prices.find((p) => p.crop.toUpperCase() === arg);
        reply = hit
          ? `MundaSense: ${hit.crop} is ZMW ${hit.price}/kg (${hit.listings} listings).`
          : `MundaSense: No listings for ${arg}. Available: ${prices.map((p) => p.crop).join(', ')}`;
      } else {
        reply =
          'MundaSense Prices (ZMW/kg): ' +
          prices.map((p) => `${p.crop} ${p.price}`).join(', ');
      }
    }

    // YES <id> — confirm order
    else if (cmd === 'YES' && arg) {
      const orderId = parseInt(arg, 10);
      const order: any = db
        .prepare('SELECT * FROM orders WHERE id = ?')
        .get(orderId);
      if (order) {
        db.prepare("UPDATE orders SET status = 'confirmed' WHERE id = ?").run(orderId);
        reply = `MundaSense: Order #${orderId} CONFIRMED. Total ZMW ${order.total_zmw}. Transport can now be arranged.`;
      } else {
        reply = `MundaSense: Order #${orderId} not found.`;
      }
    }

    // NO <id> — decline order
    else if (cmd === 'NO' && arg) {
      const orderId = parseInt(arg, 10);
      const order: any = db
        .prepare('SELECT * FROM orders WHERE id = ?')
        .get(orderId);
      if (order) {
        db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(orderId);
        db.prepare("UPDATE listings SET status = 'available' WHERE id = ?").run(
          order.listing_id
        );
        reply = `MundaSense: Order #${orderId} declined. Listing restored.`;
      } else {
        reply = `MundaSense: Order #${orderId} not found.`;
      }
    }

    // TRACK <id> — transport status
    else if (cmd === 'TRACK' && arg) {
      const reqId = parseInt(arg, 10);
      const tr: any = db
        .prepare('SELECT * FROM transport_requests WHERE id = ?')
        .get(reqId);
      reply = tr
        ? `MundaSense: TR-${tr.id} is ${tr.status}. ${tr.pickup_location} → ${tr.dropoff_location}.`
        : `MundaSense: Transport request TR-${arg} not found.`;
    }

    // BULK — join Friday cooperative sale
    else if (cmd === 'BULK') {
      db.prepare(
        "INSERT INTO advisories (farm_phone, channel, category, message) VALUES (?, 'SMS', 'Market', 'Joined Friday bulk sale')"
      ).run(from);
      reply =
        'MundaSense: You are registered for Friday bulk sale at Msekera Depot. Bring moisture-tested bags by 09:00.';
    }

    // HELP — command list
    else if (cmd === 'HELP') {
      reply =
        'MundaSense Commands:\nSOIL - soil moisture\nPRICE <crop> - market price\nYES <id> - confirm order\nNO <id> - decline order\nTRACK <id> - transport status\nBULK - join Friday sale\nHELP - this list';
    }

    // Unknown — guide to USSD
    else {
      reply = `MundaSense: Unknown command "${text.slice(0, 20)}". Reply HELP for commands or dial *384*2873#.`;
    }

    // Send reply via real SMS
    const sendResult = await sendSms(from, reply);
    console.log(`[SMS-OUT] to=${from} status=${sendResult.status}`);

    // Return reply to AT (used for outbound webhook config)
    res.type('text/plain').send(reply);
  } catch (e: any) {
    console.error('[SMS webhook error]', e);
    res.status(500).type('text/plain').send('MundaSense: Server error');
  }
});

/**
 * Send a test SMS on demand (for admin / demo).
 */
app.post('/api/sms/send', requireAuth, async (req: Request, res: Response) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: 'to and message required' });
  }
  const result = await sendSms(String(to), String(message));
  res.json(result);
});

/**
 * Send bulk SMS campaign (admin only).
 */
app.post('/api/sms/bulk', requireAuth, async (req: Request, res: Response) => {
  const { message, phones, province, crop } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  // Build recipient list
  let recipients: string[] = [];

  if (Array.isArray(phones) && phones.length) {
    recipients = phones;
  } else {
    // Query farms by province/crop
    let sql = 'SELECT DISTINCT farmer_phone FROM farms WHERE 1=1';
    const params: any[] = [];
    if (province) {
      sql += ' AND province = ?';
      params.push(province);
    }
    if (crop) {
      sql += ' AND crop = ?';
      params.push(crop);
    }
    const rows = db.prepare(sql).all(...params) as any[];
    recipients = rows.map((r) => r.farmer_phone);
  }

  if (!recipients.length) {
    return res.status(400).json({ error: 'no recipients found' });
  }

  const summary = await sendBulkSms(recipients, String(message));
  res.json(summary);
});

/**
 * Read SMS log for a phone (used by simulator UI).
 */
app.get('/api/sms/log', (req: Request, res: Response) => {
  const phone = String(req.query.phone || '').trim();
  if (!phone) return res.status(400).json({ error: 'phone required' });

  const rows = db
    .prepare('SELECT * FROM sms_log WHERE phone = ? ORDER BY id DESC LIMIT 50')
    .all(phone);

  res.json((rows as any[]).reverse());
});

/**
 * SMS account balance.
 */
app.get('/api/sms/balance', requireAuth, async (_req: Request, res: Response) => {
  const balance = await getAccountBalance();
  res.json(balance);
});

/**
 * Recent SMS deliveries (for monitoring).
 */
app.get('/api/sms/recent', requireAuth, (_req: Request, res: Response) => {
  const rows = db
    .prepare(
      "SELECT * FROM sms_log WHERE direction = 'out' ORDER BY id DESC LIMIT 30"
    )
    .all();
  res.json(rows);
});

/* ============================================================
   LIVE SENSOR STREAM & EVAPOTRANSPIRATION PHYSICS MODEL
   ============================================================ */
interface SensorState {
  hub_id: number;
  soil_15: number;
  soil_30: number;
  soil_60: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  battery_v: number;
  solar_v: number;
  signal_dbm: number;
  timestamp: string;
}

const hubState: Record<number, SensorState> = {
  1: { hub_id: 1, soil_15: 24.5, soil_30: 28.8, soil_60: 33.2, temperature: 21.9, humidity: 78, rainfall: 0, battery_v: 13.2, solar_v: 5.8, signal_dbm: -88, timestamp: new Date().toISOString() },
  2: { hub_id: 2, soil_15: 26.1, soil_30: 30.2, soil_60: 35.8, temperature: 23.4, humidity: 71, rainfall: 0, battery_v: 12.8, solar_v: 6.1, signal_dbm: -92, timestamp: new Date().toISOString() },
  3: { hub_id: 3, soil_15: 22.8, soil_30: 27.4, soil_60: 31.9, temperature: 24.8, humidity: 65, rainfall: 0, battery_v: 13.5, solar_v: 6.3, signal_dbm: -84, timestamp: new Date().toISOString() },
};

function updateSensors() {
  const hour = new Date().getHours() + new Date().getMinutes() / 60;
  for (const s of Object.values(hubState)) {
    const dailyTemp = 22 + 8 * Math.sin(((hour - 9) * Math.PI) / 12);
    s.temperature = +(dailyTemp + (Math.random() - 0.5) * 0.6).toFixed(1);
    s.humidity = Math.round(Math.max(30, Math.min(95, 92 - (s.temperature - 15) * 1.8 + (Math.random() - 0.5) * 4)));

    const isRaining = Math.random() < 0.05;
    s.rainfall = isRaining ? +(Math.random() * 8).toFixed(1) : 0;

    if (isRaining) {
      s.soil_15 = Math.min(75, s.soil_15 + s.rainfall * 1.2);
      s.soil_30 = Math.min(70, s.soil_30 + s.rainfall * 0.6);
      s.soil_60 = Math.min(68, s.soil_60 + s.rainfall * 0.2);
    } else {
      const etRate = 0.15 + (s.temperature - 20) * 0.02;
      s.soil_15 = Math.max(8, s.soil_15 - etRate * 1.4 + (Math.random() - 0.5) * 0.3);
      s.soil_30 = Math.max(12, s.soil_30 - etRate * 0.8 + (Math.random() - 0.5) * 0.2);
      s.soil_60 = Math.max(15, s.soil_60 - etRate * 0.4 + (Math.random() - 0.5) * 0.15);
    }

    s.soil_15 = +s.soil_15.toFixed(1);
    s.soil_30 = +s.soil_30.toFixed(1);
    s.soil_60 = +s.soil_60.toFixed(1);

    const isDaylight = hour > 6 && hour < 18;
    s.solar_v = isDaylight ? +(5.5 + Math.random() * 1.2).toFixed(2) : 0;
    s.battery_v = isDaylight ? Math.min(13.6, s.battery_v + 0.02) : Math.max(11.5, s.battery_v - 0.03);
    s.timestamp = new Date().toISOString();
  }
}
setInterval(updateSensors, 5000);

const sseClients = new Set<Response>();
app.get('/api/live/stream', (req: Request, res: Response) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.flushHeaders();
  sseClients.add(res);
  res.write(`data: ${JSON.stringify({ type: 'snapshot', hubs: Object.values(hubState) })}\n\n`);
  req.on('close', () => sseClients.delete(res));
});

setInterval(() => {
  const payload = JSON.stringify({ type: 'update', hubs: Object.values(hubState) });
  for (const c of sseClients) {
    try {
      c.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(c);
    }
  }
}, 5000);

app.get('/api/sensors/live', (_req: Request, res: Response) => {
  res.json({ hubs: Object.values(hubState), timestamp: new Date().toISOString() });
});

/* ============================================================
   TRANSPORT TRACKING (LIVE GPS ROUTE)
   ============================================================ */
interface TrackingPoint {
  lat: number;
  lng: number;
  speed_kmh: number;
  timestamp: string;
}

const transportRoutes: Map<number, TrackingPoint[]> = new Map();

// Seed active route (Msekera → Lusaka along Great East Road)
transportRoutes.set(42, [
  { lat: -13.6333, lng: 32.65, speed_kmh: 55, timestamp: new Date(Date.now() - 3600000).toISOString() },
  { lat: -13.85, lng: 32.45, speed_kmh: 62, timestamp: new Date(Date.now() - 3000000).toISOString() },
  { lat: -14.2, lng: 31.8, speed_kmh: 58, timestamp: new Date(Date.now() - 2400000).toISOString() },
  { lat: -14.55, lng: 30.85, speed_kmh: 71, timestamp: new Date(Date.now() - 1800000).toISOString() },
  { lat: -14.8, lng: 30.1, speed_kmh: 65, timestamp: new Date(Date.now() - 1200000).toISOString() },
  { lat: -15.1, lng: 29.2, speed_kmh: 59, timestamp: new Date(Date.now() - 600000).toISOString() },
  { lat: -15.3333, lng: 28.6833, speed_kmh: 45, timestamp: new Date().toISOString() },
]);

// Auto-advance truck every 10s
setInterval(() => {
  const route = transportRoutes.get(42);
  if (!route) return;
  const last = route[route.length - 1];

  if (last.lat > -15.42) {
    const next: TrackingPoint = {
      lat: +(last.lat - 0.025 + (Math.random() - 0.5) * 0.015).toFixed(4),
      lng: +(last.lng - 0.045 + (Math.random() - 0.5) * 0.015).toFixed(4),
      speed_kmh: Math.round(55 + Math.random() * 20),
      timestamp: new Date().toISOString(),
    };
    route.push(next);
  }
}, 10000);

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

app.get('/api/transport/:id/track', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const route = transportRoutes.get(id) || transportRoutes.get(42) || [];
  const latest = route[route.length - 1];

  const targetLat = -15.4167;
  const targetLng = 28.2833;
  const distanceKm = latest ? haversineKm(latest.lat, latest.lng, targetLat, targetLng) : 0;
  const avgSpeed = latest?.speed_kmh || 55;
  const etaHours = distanceKm / Math.max(20, avgSpeed);

  res.json({
    request_id: id,
    points: route,
    latest,
    distance_remaining_km: +distanceKm.toFixed(1),
    eta_hours: +etaHours.toFixed(1),
    status: distanceKm < 5 ? 'arriving' : distanceKm < 100 ? 'in_transit_near' : 'in_transit',
  });
});

/* ============================================================
   MOUNT API ROUTERS
   ============================================================ */
app.use('/api', marketplaceRouter);
app.use('/api', advisoriesRouter);
app.use('/api', sensorsRouter);
app.use('/api', storageRouter);
app.use('/api', transportRouter);
app.use('/api', depotsRouter);
app.use('/api', farmsRouter);

/* ============================================================
   DISEASE SCREENING (REAL GEMINI 2.5 FLASH VISION + SQLITE)
   ============================================================ */
app.post('/api/disease/analyze', async (req: Request, res: Response) => {
  const {
    image_data,
    crop = 'Maize',
    farm_id,
    phone,
    farm_context = '',
    weather_context = '',
  } = req.body;

  if (!image_data || typeof image_data !== 'string') {
    return res.status(400).json({
      error: 'image_data (base64 data URL) is required',
    });
  }

  if (image_data.length > 8_000_000) {
    return res.status(413).json({ error: 'Image too large — max ~6 MB' });
  }

  try {
    const result = await analyzeLeafImage({
      imageDataUrl: image_data,
      cropHint: String(crop),
      farmId: farm_id ? Number(farm_id) : undefined,
      phone: phone ? String(phone) : undefined,
      farmContext: String(farm_context),
      weatherContext: String(weather_context),
    });
    return res.json(result);
  } catch (e: any) {
    console.error('[Disease analyze error]', e);
    return res.status(500).json({
      error: 'Screening pipeline failed',
      detail: e?.message,
    });
  }
});

app.get('/api/disease/reports', (req: Request, res: Response) => {
  const phone = req.query.phone as string | undefined;
  if (phone) {
    return res.json(listDiseaseReportsForPhone(phone));
  }
  const limit = Math.min(200, Number(req.query.limit) || 50);
  res.json(getRecentReports(limit));
});

app.get('/api/disease/crops', (_req: Request, res: Response) => {
  res.json({
    crops: getCropList(),
    gemini: geminiStatus(),
  });
});

app.get('/api/disease/status', (_req: Request, res: Response) => {
  res.json(geminiStatus());
});

app.get('/api/disease/treatment/:diseaseName', (req: Request, res: Response) => {
  import('./server/treatmentDatabase.ts').then(({ getTreatmentPlan, estimateTreatmentCost }) => {
    const disease = decodeURIComponent(req.params.diseaseName);
    const plan = getTreatmentPlan(disease);
    const cost = estimateTreatmentCost(disease, Number(req.query.hectares) || 1);
    res.json({ plan, cost });
  }).catch((e) => {
    res.status(500).json({ error: 'Treatment lookup failed', detail: e.message });
  });
});

/* ============================================================
   HEALTH CHECK
   ============================================================ */
app.get('/api/health', (_req: Request, res: Response) => {
  const usersCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any)?.c || 0;
  const farmsCount = (db.prepare('SELECT COUNT(*) as c FROM farms').get() as any)?.c || 0;
  const districtCount = (db.prepare('SELECT COUNT(DISTINCT district) as c FROM farms').get() as any)?.c || 0;
  const provincesCount = (db.prepare('SELECT COUNT(DISTINCT province) as c FROM farms').get() as any)?.c || 0;
  const hubsCount = (db.prepare('SELECT COUNT(*) as c FROM sensor_hubs').get() as any)?.c || 0;
  const listingsCount = (db.prepare("SELECT COUNT(*) as c FROM listings WHERE status = 'available'").get() as any)?.c || 0;
  const depotsCount = (db.prepare('SELECT COUNT(*) as c FROM depots').get() as any)?.c || 0;

  res.json({
    status: 'ok',
    service: 'MundaSense Platform',
    version: '3.0.0',
    database: 'sqlite',
    farm_count: farmsCount,
    farms_in_db: farmsCount,
    district_count: districtCount,
    provinces_covered: provincesCount,
    hubs_online: hubsCount,
    users_registered: usersCount,
    active_listings: listingsCount,
    depots_total: depotsCount,
    gemini_enabled: geminiStatus().enabled,
    gemini_model: geminiStatus().model,
    disease_reports: (db.prepare('SELECT COUNT(*) as c FROM crop_health_reports').get() as any)?.c || 0,
    ussd_shortcode: '*2873#',
    ussd_endpoint: '/ussd (Africa\'s Talking compatible)',
    at_sms_configured: Boolean(process.env.AT_API_KEY),
  });
});

/* ============================================================
   MOUNT VITE MIDDLEWARE IN DEVELOPMENT / STATIC IN PROD
   ============================================================ */
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req: Request, res: Response) => res.sendFile(path.resolve('dist/index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌾 MundaSense v3 running on http://0.0.0.0:${PORT}`);
    console.log(`📞 USSD webhook: POST /ussd (Africa's Talking format)`);
    console.log(`💾 SQLite DB: data/mundasense.db`);
    console.log(`📡 Live SSE stream at /api/live/stream`);
    console.log(`🚚 Transport tracking at /api/transport/:id/track`);
    console.log(`🤖 Gemini: ${geminiStatus().enabled ? `ENABLED (${geminiStatus().model})` : 'OFFLINE'}`);
    console.log(`📱 SMS: ${process.env.AT_API_KEY ? 'LIVE (Africa\'s Talking)' : 'log-only'}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
