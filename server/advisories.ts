import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from './db.ts';

export const advisoriesRouter = Router();

advisoriesRouter.get('/advisories', (req: Request, res: Response) => {
  const limit = Math.min(500, Number(req.query.limit) || 100);
  res.json(db.prepare(`
    SELECT a.id, a.farm_phone, a.channel, a.category, a.message,
           a.language, a.status, a.created_at,
           f.name AS farm_name, f.village, f.province, f.crop
    FROM advisories a
    LEFT JOIN farms f ON f.farmer_phone = a.farm_phone
    ORDER BY a.created_at DESC LIMIT ?
  `).all(limit));
});

advisoriesRouter.post('/advisories/generate', async (_req: Request, res: Response) => {
  const { sendSms } = await import('./sms.ts');
  const farms = db.prepare('SELECT * FROM farms').all() as any[];
  const insert = db.prepare(`
    INSERT INTO advisories (farm_phone, channel, category, message, language, status)
    VALUES (?, 'SMS', ?, ?, ?, 'queued')
  `);
  const generated: any[] = [];
  for (const farm of farms) {
    const soil = Number(farm.soil_moisture) || 30;
    let category = 'Irrigation', message = '';
    if (soil < 25) { category='Irrigation'; message=`Soil moisture @30cm is ${soil.toFixed(1)}% (LOW). Irrigate ${farm.crop} within 2 days.`; }
    else if (farm.health_status === 'alert') { category='Disease'; message=`Disease alert for ${farm.crop} in ${farm.village}. Inspect leaves for early lesions.`; }
    else if (soil > 42) { category='Storage'; message=`Soil moisture high (${soil.toFixed(1)}%). Monitor for fungal risk on ${farm.crop}.`; }
    else { category='Market'; message=`Market: ${farm.crop} at ${farm.village} — check today's prices in the app.`; }
    const info = insert.run(farm.farmer_phone, category, message, farm.language || 'English');
    generated.push({ id: info.lastInsertRowid, farm_phone: farm.farmer_phone, category, message });
  }
  for (const g of generated.slice(0, 10)) {
    try { await sendSms(g.farm_phone, g.message); } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  res.json({ generated: generated.length, pushed_sms: Math.min(10, generated.length) });
});
