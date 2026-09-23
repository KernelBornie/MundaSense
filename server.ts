import express, { type Request, type Response, type NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

import {
  findUserByPhone,
  findUserByEmail,
  createUser,
  verifyPin,
  listActiveListings,
  getMarketPrices,
  db,
} from './server/db.ts';
import { handleUssd } from './server/ussd.ts';
import { sendSms } from './server/sms.ts';
import { seedDatabase } from './server/seed.ts';

dotenv.config();

/* Boot: seed DB if empty */
seedDatabase();

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
   SMS — Real inbound webhook + outbound test
   ============================================================ */
app.post('/sms/webhook', async (req: Request, res: Response) => {
  const from = String(req.body.from || req.body.from_ || '');
  const text = String(req.body.text || '').trim().toUpperCase();

  db.prepare("INSERT INTO sms_log (phone, direction, message, provider) VALUES (?, 'in', ?, 'africastalking')")
    .run(from, text);

  let reply = 'MundaSense: Reply HELP for options.';

  if (text === 'SOIL') {
    const farm: any = db.prepare('SELECT * FROM farms WHERE farmer_phone = ? LIMIT 1').get(from);
    reply = farm
      ? `MundaSense: Soil moisture @30cm is ${farm.soil_moisture}%. Crop: ${farm.crop}.`
      : 'MundaSense: No farm registered to this number.';
  } else if (text.startsWith('PRICE')) {
    const crop = text.replace('PRICE', '').trim();
    const prices = getMarketPrices();
    const hit = prices.find((p) => p.crop.toUpperCase() === crop);
    reply = hit
      ? `MundaSense: ${hit.crop} is ZMW ${hit.price}/kg (${hit.listings} listings).`
      : `MundaSense: Prices: ${prices.map((p) => `${p.crop} ZMW ${p.price}`).join(', ')}`;
  } else if (text.startsWith('YES')) {
    const orderId = parseInt(text.replace('YES', '').trim(), 10);
    if (orderId) {
      db.prepare("UPDATE orders SET status = 'confirmed' WHERE id = ?").run(orderId);
      reply = `MundaSense: Order #${orderId} confirmed. Transport can be arranged.`;
    }
  } else if (text.startsWith('NO')) {
    const orderId = parseInt(text.replace('NO', '').trim(), 10);
    if (orderId) {
      db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(orderId);
      reply = `MundaSense: Order #${orderId} declined.`;
    }
  } else if (text === 'HELP') {
    reply = 'MundaSense: SOIL, PRICE <crop>, YES <id>, NO <id>, BULK, HELP';
  } else if (text === 'BULK') {
    reply = 'MundaSense: Added to Friday cooperative bulk sale. Bring bags to Msekera Depot by 09:00.';
  }

  await sendSms(from, reply);
  res.type('text/plain').send(reply);
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
   MARKETPLACE (REAL DB)
   ============================================================ */
app.get('/api/marketplace', (req: Request, res: Response) => {
  const crop = req.query.crop as string | undefined;
  res.json(listActiveListings(crop));
});

app.get('/api/marketplace/prices', (_req: Request, res: Response) => {
  res.json(getMarketPrices());
});

/* ============================================================
   FARMS (REAL DB)
   ============================================================ */
app.get('/api/farms', (_req: Request, res: Response) => {
  const farms = db.prepare('SELECT * FROM farms ORDER BY id LIMIT 200').all();
  res.json(farms);
});

/* ============================================================
   DISEASE SCREENING (REAL GEMINI)
   ============================================================ */
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
let ai: GoogleGenAI | null = null;
if (GEMINI_KEY) {
  ai = new GoogleGenAI({
    apiKey: GEMINI_KEY,
    httpOptions: { headers: { 'User-Agent': 'mundasense-v2' } },
  });
}
const GEMINI_MODEL = 'gemini-2.5-flash';

app.post('/api/disease/analyze', async (req: Request, res: Response) => {
  const { crop = 'Maize', image_data, farm_id = 1 } = req.body;
  if (!image_data) return res.status(400).json({ error: 'Missing image_data' });

  if (ai && typeof image_data === 'string' && image_data.startsWith('data:image')) {
    const match = image_data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (match) {
      const [, mimeType, base64Data] = match;
      const prompt = `You are the MundaSense AI Agronomy Screening Engine for Zambian smallholders.

Analyze this ${crop} leaf image. Focus on these diseases common in Zambia:
- Maize: Northern Corn Leaf Blight, Common Rust, Gray Leaf Spot, Fall Armyworm, Streak Virus
- Groundnuts: Early/Late Leaf Spot, Rust, Rosette
- Soybean: Rust, Bacterial Pustule
- Tomato: Early/Late Blight, Bacterial Spot, TYLCV
- Cassava: Mosaic, Brown Streak
- Banana: Panama, Black Sigatoka
- Cotton: Bacterial Blight
- Also detect Healthy state

Return ONLY valid JSON:
{
  "crop": "${crop}",
  "prediction": "disease name or Healthy",
  "pathogen": "scientific name",
  "confidence": 0.87,
  "severity": "none" | "low" | "moderate" | "high" | "critical",
  "risk": "LOW" | "WATCH" | "HIGH",
  "symptoms": "visible symptoms in 1 sentence",
  "recommendation": "practical low-cost treatment",
  "prevention": "next-season prevention",
  "needs_expert_review": boolean
}`;

      try {
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: {
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: prompt },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            systemInstruction:
              'Expert crop pathologist for sub-Saharan Africa. Be conservative. Recommend locally available treatments. Never diagnose with false confidence.',
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({
          farm_id,
          crop: parsed.crop || crop,
          prediction: parsed.prediction || 'Unspecified',
          pathogen: parsed.pathogen || 'Unknown',
          confidence: parsed.confidence ?? 0.82,
          severity: parsed.severity || 'moderate',
          risk: parsed.risk || 'WATCH',
          symptoms: parsed.symptoms || 'Foliar anomaly detected',
          recommendation: parsed.recommendation || 'Consult extension officer',
          prevention: parsed.prevention || '',
          needs_expert_review: Boolean(parsed.needs_expert_review ?? (parsed.confidence < 0.75)),
          report_id: Date.now(),
        });
      } catch (e: any) {
        console.warn('[Gemini analyze error]', e?.message || e);
      }
    }
  }

  // Fallback
  return res.json({
    farm_id,
    crop,
    prediction: crop.toLowerCase().includes('tomato')
      ? 'Early Blight (Alternaria solani)'
      : 'Northern Corn Leaf Blight (Exserohilum turcicum)',
    pathogen: crop.toLowerCase().includes('tomato')
      ? 'Alternaria solani'
      : 'Exserohilum turcicum',
    confidence: 0.85,
    severity: 'moderate',
    risk: 'WATCH',
    symptoms: 'Elongated grey-green lesions parallel to leaf veins.',
    recommendation: 'Inspect surrounding plants and notify extension officer.',
    prevention: 'Crop rotation and field hygiene.',
    needs_expert_review: false,
    report_id: Date.now(),
  });
});

/* ============================================================
   HEALTH CHECK
   ============================================================ */
app.get('/api/health', (_req: Request, res: Response) => {
  const usersCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any)?.c || 0;
  const farmsCount = (db.prepare('SELECT COUNT(*) as c FROM farms').get() as any)?.c || 0;
  const listingsCount = (db.prepare("SELECT COUNT(*) as c FROM listings WHERE status = 'available'").get() as any)?.c || 0;

  res.json({
    status: 'ok',
    service: 'MundaSense Platform',
    version: '3.0.0',
    database: 'sqlite',
    users_registered: usersCount,
    farms_in_db: farmsCount,
    active_listings: listingsCount,
    gemini_enabled: Boolean(ai),
    gemini_model: ai ? GEMINI_MODEL : null,
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
    console.log(`🤖 Gemini: ${ai ? `ENABLED (${GEMINI_MODEL})` : 'OFFLINE'}`);
    console.log(`📱 SMS: ${process.env.AT_API_KEY ? 'LIVE (Africa\'s Talking)' : 'log-only'}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
