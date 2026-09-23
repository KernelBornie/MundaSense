import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from './db.ts';

export const farmsRouter = Router();

// GET /api/farms/districts
farmsRouter.get('/farms/districts', (_req: Request, res: Response) => {
  const farms = db.prepare('SELECT province, district FROM farms').all() as {
    province: string;
    district: string;
  }[];

  const provinces: Record<string, { districts: string[]; count: number }> = {};

  for (const f of farms) {
    if (!f.province) continue;
    if (!provinces[f.province]) {
      provinces[f.province] = { districts: [], count: 0 };
    }
    if (f.district && !provinces[f.province].districts.includes(f.district)) {
      provinces[f.province].districts.push(f.district);
    }
    provinces[f.province].count++;
  }

  // Sort districts alphabetically
  for (const p of Object.values(provinces)) {
    p.districts.sort();
  }

  const total_districts = Object.values(provinces).reduce((s, p) => s + p.districts.length, 0);

  res.json({
    provinces,
    total_districts,
    total_farms: farms.length,
  });
});

// GET /api/farms
farmsRouter.get('/farms', (req: Request, res: Response) => {
  const { province, district, limit } = req.query;
  let sql = 'SELECT * FROM farms WHERE 1=1';
  const params: any[] = [];

  if (province) {
    sql += ' AND province = ?';
    params.push(String(province));
  }
  if (district) {
    sql += ' AND district = ?';
    params.push(String(district));
  }

  sql += ' ORDER BY id';
  const maxLimit = Math.min(1000, Number(limit) || 1000);
  sql += ' LIMIT ?';
  params.push(maxLimit);

  const farms = db.prepare(sql).all(...params);
  res.json(farms);
});
