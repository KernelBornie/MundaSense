import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from './db.ts';

export const sensorsRouter = Router();

sensorsRouter.get('/sensors/hubs', (_req: Request, res: Response) => {
  res.json(db.prepare('SELECT * FROM sensor_hubs').all());
});

sensorsRouter.get('/sensors/hubs/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const hub = db.prepare('SELECT * FROM sensor_hubs WHERE id = ?').get(id);
  if (!hub) return res.status(404).json({ error: 'hub not found' });
  res.json({
    hub,
    latest: db.prepare('SELECT * FROM sensor_readings WHERE hub_id = ? ORDER BY recorded_at DESC LIMIT 1').get(id),
    history: db.prepare('SELECT * FROM sensor_readings WHERE hub_id = ? ORDER BY recorded_at DESC LIMIT 48').all(id),
  });
});
