import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from './db.ts';
import { sendSms } from './sms.ts';

export const transportRouter = Router();

transportRouter.get('/transport/requests', (req: Request, res: Response) => {
  const phone = String(req.query.phone || '').trim();
  const sql = phone
    ? `SELECT * FROM transport_requests WHERE requester_phone = ? ORDER BY id DESC`
    : `SELECT * FROM transport_requests ORDER BY id DESC LIMIT 100`;
  res.json(phone ? db.prepare(sql).all(phone) : db.prepare(sql).all());
});

transportRouter.post('/transport/requests', async (req: Request, res: Response) => {
  const { requester_phone, pickup_location, dropoff_location,
          cargo_description, weight_kg, budget_zmw, contact_name, contact_phone } = req.body;
  if (!requester_phone || !pickup_location || !dropoff_location) {
    return res.status(400).json({ error: 'requester_phone, pickup_location, dropoff_location required' });
  }
  const info = db.prepare(`
    INSERT INTO transport_requests
      (requester_phone, pickup_location, dropoff_location, cargo_description,
       weight_kg, budget_zmw, contact_name, contact_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(requester_phone, pickup_location, dropoff_location,
         cargo_description || null, weight_kg || null, budget_zmw || null,
         contact_name || null, contact_phone || null);
  const transporters = db.prepare(
    "SELECT phone FROM users WHERE role = 'transporter' AND phone IS NOT NULL"
  ).all() as any[];
  for (const t of transporters) {
    try {
      await sendSms(t.phone,
        `MundaSense: New transport request TR-${info.lastInsertRowid} from ${pickup_location} to ${dropoff_location}. Budget ZMW ${budget_zmw || 'negotiable'}. Open the app to bid.`);
    } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  res.json(db.prepare('SELECT * FROM transport_requests WHERE id = ?').get(info.lastInsertRowid));
});

transportRouter.get('/transport/requests/:id/bids', (req: Request, res: Response) => {
  res.json(db.prepare(`
    SELECT b.*, u.full_name AS transporter_name,
           u.phone AS transporter_phone, u.email AS transporter_email
    FROM transport_bids b LEFT JOIN users u ON u.phone = b.transporter_phone
    WHERE b.request_id = ? ORDER BY b.price_zmw ASC
  `).all(Number(req.params.id)));
});

transportRouter.post('/transport/requests/:id/bids', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { transporter_phone, price_zmw, vehicle, eta_hours } = req.body;
  if (!transporter_phone || !price_zmw) return res.status(400).json({ error: 'transporter_phone, price_zmw required' });
  const info = db.prepare(`
    INSERT INTO transport_bids (request_id, transporter_phone, price_zmw, vehicle, eta_hours, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(id, transporter_phone, price_zmw, vehicle || null, eta_hours || null);
  const reqRow: any = db.prepare('SELECT * FROM transport_requests WHERE id = ?').get(id);
  if (reqRow?.requester_phone) {
    try { await sendSms(reqRow.requester_phone,
      `MundaSense: New bid ZMW ${price_zmw} on TR-${id}. Reply ACCEPT ${info.lastInsertRowid} to confirm.`); } catch {}
  }
  res.json(db.prepare('SELECT * FROM transport_bids WHERE id = ?').get(info.lastInsertRowid));
});

transportRouter.post('/transport/bids/:id/accept', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const bid: any = db.prepare('SELECT * FROM transport_bids WHERE id = ?').get(id);
  if (!bid) return res.status(404).json({ error: 'bid not found' });
  db.prepare("UPDATE transport_bids SET status = 'accepted' WHERE id = ?").run(id);
  db.prepare("UPDATE transport_bids SET status = 'rejected' WHERE request_id = ? AND id <> ?").run(bid.request_id, id);
  db.prepare("UPDATE transport_requests SET status = 'assigned' WHERE id = ?").run(bid.request_id);
  const reqRow: any = db.prepare('SELECT * FROM transport_requests WHERE id = ?').get(bid.request_id);
  try { if (bid.transporter_phone) await sendSms(bid.transporter_phone, `MundaSense: Bid ZMW ${bid.price_zmw} on TR-${bid.request_id} ACCEPTED. Pickup: ${reqRow?.pickup_location}.`); } catch {}
  try { if (reqRow?.requester_phone) await sendSms(reqRow.requester_phone, `MundaSense: TR-${bid.request_id} assigned for ZMW ${bid.price_zmw}.`); } catch {}
  res.json({ ok: true });
});
