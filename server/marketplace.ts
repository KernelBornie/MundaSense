import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, listActiveListings, createListing, getMarketPrices } from './db.ts';
import { sendSms } from './sms.ts';

export const marketplaceRouter = Router();

marketplaceRouter.get('/marketplace', (req: Request, res: Response) => {
  const crop = req.query.crop as string | undefined;
  res.json(listActiveListings(crop));
});

marketplaceRouter.get('/marketplace/prices', (_req: Request, res: Response) => {
  res.json(getMarketPrices());
});

marketplaceRouter.post('/marketplace/listings', async (req: Request, res: Response) => {
  const { seller_name, seller_phone, seller_email, crop, quantity_kg, price_per_kg_zmw,
          district, village, province, description } = req.body;
  if (!seller_phone || !crop || !quantity_kg || !price_per_kg_zmw) {
    return res.status(400).json({ error: 'seller_phone, crop, quantity_kg, price_per_kg_zmw required' });
  }
  let email = seller_email;
  if (!email) {
    const u = db.prepare('SELECT email FROM users WHERE phone = ?').get(seller_phone) as any;
    email = u?.email || null;
  }
  const listing = createListing({
    seller_name, seller_phone, seller_email: email, crop,
    quantity_kg: Number(quantity_kg),
    price_per_kg_zmw: Number(price_per_kg_zmw),
    district, village, province, description,
  });
  try {
    await sendSms(seller_phone,
      `MundaSense: Your listing for ${crop} (${quantity_kg}kg @ ZMW ${price_per_kg_zmw}/kg) is LIVE on the marketplace.`);
  } catch {}
  res.json(listing);
});

marketplaceRouter.get('/marketplace/my-listings', (req: Request, res: Response) => {
  const phone = String(req.query.phone || '').trim();
  if (!phone) return res.status(400).json({ error: 'phone required' });
  res.json(db.prepare(`
    SELECT l.*, u.full_name AS seller_name, u.email AS seller_email
    FROM listings l LEFT JOIN users u ON u.phone = l.seller_phone
    WHERE l.seller_phone = ? ORDER BY l.created_at DESC
  `).all(phone));
});

marketplaceRouter.get('/marketplace/orders', (req: Request, res: Response) => {
  const phone = String(req.query.phone || '').trim();
  const sql = phone
    ? `SELECT o.*, l.crop, l.price_per_kg_zmw, l.seller_phone, l.seller_name
       FROM orders o
       LEFT JOIN listings l ON l.id = o.listing_id
       WHERE o.buyer_phone = ? OR l.seller_phone = ?
       ORDER BY o.created_at DESC`
    : `SELECT o.*, l.crop, l.price_per_kg_zmw, l.seller_phone, l.seller_name
       FROM orders o
       LEFT JOIN listings l ON l.id = o.listing_id
       ORDER BY o.created_at DESC LIMIT 100`;
  res.json(phone ? db.prepare(sql).all(phone, phone) : db.prepare(sql).all());
});

marketplaceRouter.post('/marketplace/orders', async (req: Request, res: Response) => {
  const { listing_id, buyer_phone, buyer_name, buyer_email, quantity_kg, delivery_address } = req.body;
  if (!listing_id || !buyer_phone || !quantity_kg) {
    return res.status(400).json({ error: 'listing_id, buyer_phone, quantity_kg required' });
  }
  const listing: any = db.prepare('SELECT * FROM listings WHERE id = ?').get(listing_id);
  if (!listing) return res.status(404).json({ error: 'listing not found' });
  const total = Number(quantity_kg) * Number(listing.price_per_kg_zmw);
  const info = db.prepare(`
    INSERT INTO orders (listing_id, buyer_phone, buyer_name, buyer_email, quantity_kg, total_zmw, delivery_address, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    listing_id,
    buyer_phone,
    buyer_name || null,
    buyer_email || null,
    quantity_kg,
    total,
    delivery_address || null
  );
  db.prepare("UPDATE listings SET status = 'reserved' WHERE id = ?").run(listing_id);

  try {
    if (listing.seller_phone) {
      await sendSms(
        listing.seller_phone,
        `MundaSense: New order #${info.lastInsertRowid} for ${quantity_kg}kg of ${listing.crop} (ZMW ${total.toFixed(2)}) placed by ${buyer_name ? `${buyer_name} (${buyer_phone})` : buyer_phone}. Delivery: ${delivery_address || 'Arranging'}.`
      );
    }
  } catch {}

  res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(info.lastInsertRowid));
});
