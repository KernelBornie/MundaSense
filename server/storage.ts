import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from './db.ts';
import { sendSms } from './sms.ts';

export const storageRouter = Router();

storageRouter.get('/storage/silos', (_req: Request, res: Response) => {
  res.json(db.prepare('SELECT * FROM storage_units ORDER BY id').all());
});

storageRouter.post('/storage/silos/:id/broadcast-alert', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const silo: any = db.prepare('SELECT * FROM storage_units WHERE id = ?').get(id);
  if (!silo) return res.status(404).json({ error: 'silo not found' });
  const farms = db.prepare('SELECT DISTINCT farmer_phone FROM farms').all() as any[];
  let pushed = 0;
  for (const farm of farms.slice(0, 20)) {
    try {
      await sendSms(farm.farmer_phone,
        `MundaSense: ${silo.name} — grain moisture ${silo.moisture_percent}%. Dry your ${silo.crop} today to prevent aflatoxin.`);
      pushed++;
    } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  res.json({ ok: true, pushed });
});
