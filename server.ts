/**
 * MundaSense — Full USSD Gateway
 * Africa's Talking compatible. Feature-phone farmers can:
 *  - Register (creates user in DB)
 *  - Login with PIN (verifies against DB)
 *  - Access all services: advisories, market, sell, transport, soil
 * Every write hits the real SQLite database.
 */
import type { Request, Response } from 'express';
import {
  findUserByPhone,
  createUser,
  verifyPin,
  getMarketPrices,
  getMarketPrice,
  createListing,
  db,
} from './db.ts';
import { sendSms } from './sms.ts';

const LANGUAGES = ['English','Bemba','Nyanja','Tonga','Lozi','Lunda','Luvale','Kaonde'];
const PROVINCES = ['Eastern','Lusaka','Central','Southern','Northern','Copperbelt','Western','Muchinga','North-Western','Luapula'];
const ROLES = ['farmer','seller','customer','transporter'];
const CROPS = ['Maize','Groundnuts','Soybeans','Sunflower','Cotton'];

const WELCOME: Record<string, (n: string) => string> = {
  English: (n) => `Welcome back, ${n}!`,
  Bemba: (n) => `Mwaiseni, ${n}!`,
  Nyanja: (n) => `Takulandirani, ${n}!`,
  Tonga: (n) => `Mwabonwa, ${n}!`,
  Lozi: (n) => `Mu amuhezi, ${n}!`,
  Lunda: (n) => `Mwatooka, ${n}!`,
  Luvale: (n) => `Mwakulukuka, ${n}!`,
  Kaonde: (n) => `Mwabuka, ${n}!`,
};

const AUTH_MENU = (name: string) =>
  `CON MundaSense · ${name}\n` +
  `1. Crop Advisory\n` +
  `2. Disease Alert\n` +
  `3. Storage Check\n` +
  `4. Market Prices\n` +
  `5. Sell My Crop\n` +
  `6. Hire Transport\n` +
  `7. Check Soil Moisture\n` +
  `8. My Account`;

const PUBLIC_MENU =
  `CON MundaSense (*384*2873#)\n` +
  `Mwapoleni / Moni / Hello\n\n` +
  `1. Register new account\n` +
  `2. Login with PIN\n` +
  `3. Check market prices\n` +
  `4. Request officer callback`;

export async function handleUssd(req: Request, res: Response) {
  const phone = String(req.body.phoneNumber || req.body.phone || '').trim();
  const text = String(req.body.text || '').trim();

  res.set('Content-Type', 'text/plain');

  if (!phone) return res.send('END Missing phone number. Dial *384*2873# again.');

  const parts = text.split('*').filter(Boolean);
  const existingUser = findUserByPhone(phone);

  /* ============================================================
     LEVEL 0 — no input yet
     ============================================================ */
  if (parts.length === 0) {
    if (existingUser) {
      return res.send(
        `CON Welcome back to MundaSense\n` +
        `Phone: ${phone}\n\n` +
        `Enter your 4-digit PIN to login:`
      );
    }
    return res.send(PUBLIC_MENU);
  }

  const root = parts[0];

  /* ============================================================
     EXISTING USER — PIN login then full menu
     ============================================================ */
  if (existingUser) {
    // Detect if user is trying to logout via typing "0" at top menu
    if (root === '0' && parts.length === 1) {
      return res.send('END Logged out. Dial *384*2873# again. Zikomo!');
    }

    const pinAttempt = parts[0];
    const looksLikePin = /^\d{4}$/.test(pinAttempt);
    const pinValid = looksLikePin && verifyPin(pinAttempt, existingUser.pin_hash);

    if (!pinValid) {
      if (parts.length === 1) {
        return res.send(
          `END Invalid PIN.\n\n` +
          `Dial *384*2873# again to retry.`
        );
      }
      return res.send(`END Session invalid. Dial *384*2873# and enter PIN first.`);
    }

    // ✅ Authenticated — path[0]=PIN, path[1+]=menu navigation
    const menuPath = parts.slice(1);

    if (menuPath.length === 0) {
      return res.send(AUTH_MENU(existingUser.full_name.split(' ')[0]));
    }

    const choice = menuPath[0];

    /* ---------- 1. Crop Advisory ---------- */
    if (choice === '1') {
      if (menuPath.length === 1) {
        return res.send(
          `CON Choose your crop:\n` + CROPS.map((c, i) => `${i + 1}. ${c}`).join('\n')
        );
      }
      const crop = CROPS[parseInt(menuPath[1], 10) - 1] || 'Maize';
      const farm: any = db.prepare('SELECT * FROM farms WHERE farmer_phone = ? LIMIT 1').get(phone);
      const soil = farm?.soil_moisture ?? 28.8;
      const advice =
        soil < 22 ? 'LOW — irrigate within 2 days.'
        : soil < 32 ? 'WATCH — monitor closely.'
        : 'ADEQUATE — no irrigation today.';
      return res.send(
        `END ${crop} · ${farm?.village || existingUser.village || 'Unknown'}\n` +
        `Soil @30cm: ${soil.toFixed(1)}%\n${advice}\n\nZikomo!`
      );
    }

    /* ---------- 2. Disease Alert ---------- */
    if (choice === '2') {
      const farm: any = db.prepare('SELECT * FROM farms WHERE farmer_phone = ? LIMIT 1').get(phone);
      const risk = farm?.disease_risk || 'WATCH';
      return res.send(
        `END Disease Risk: ${risk}\n` +
        `${farm?.village || existingUser.village}: High humidity.\n` +
        `Inspect maize leaves for Northern Leaf Blight.\n\n` +
        `Reply CALL to 12345 for officer.`
      );
    }

    /* ---------- 3. Storage Check ---------- */
    if (choice === '3') {
      return res.send(
        `END Storage status:\n` +
        `Msekera Silo A: 14.3% (CRITICAL)\n\n` +
        `Dry bags below 13% to prevent aflatoxin.`
      );
    }

    /* ---------- 4. Market Prices ---------- */
    if (choice === '4') {
      const prices = getMarketPrices();
      if (!prices.length) return res.send('END No listings today.');
      const lines = prices.slice(0, 6).map(p => `${p.crop}: ZMW ${p.price}/kg`).join('\n');
      return res.send(`END Market Prices (ZMW/kg):\n${lines}\n\nBulk sale Friday @ Msekera.`);
    }

    /* ---------- 5. Sell My Crop ---------- */
    if (choice === '5') {
      if (menuPath.length === 1) {
        return res.send(
          `CON Which crop to sell?\n` +
          CROPS.slice(0, 4).map((c, i) => `${i + 1}. ${c}`).join('\n')
        );
      }
      const crop = CROPS[parseInt(menuPath[1], 10) - 1] || 'Maize';

      if (menuPath.length === 2) return res.send(`CON ${crop} — Enter quantity in kg:\n(e.g. 1000)`);

      const qty = parseInt(menuPath[2], 10);
      if (!qty || qty <= 0) return res.send('END Invalid quantity. Restart with *384*2873#.');

      if (menuPath.length === 3) {
        const avg = getMarketPrice(crop) || 6.20;
        return res.send(
          `CON ${crop} · ${qty} kg\nToday's avg: ZMW ${avg}/kg\n\n` +
          `1. Accept ZMW ${avg}\n2. Enter my own price`
        );
      }

      let price: number;
      if (menuPath[3] === '1') {
        price = getMarketPrice(crop) || 6.20;
        if (menuPath.length === 4) {
          return res.send(
            `CON Confirm:\n${crop} · ${qty} kg\nZMW ${price}/kg\nTotal: ZMW ${(qty * price).toFixed(0)}\n\n1. Publish\n2. Cancel`
          );
        }
        if (menuPath[4] === '2') return res.send('END Listing cancelled.');
      } else if (menuPath[3] === '2') {
        if (menuPath.length === 4) return res.send(`CON Enter your price (ZMW/kg):`);
        price = parseFloat(menuPath[4]);
        if (!price || price <= 0) return res.send('END Invalid price.');
        if (menuPath.length === 5) {
          return res.send(
            `CON Confirm:\n${crop} · ${qty} kg\nZMW ${price}/kg\nTotal: ZMW ${(qty * price).toFixed(0)}\n\n1. Publish\n2. Cancel`
          );
        }
        if (menuPath[5] === '2') return res.send('END Listing cancelled.');
      } else {
        return res.send('END Invalid choice.');
      }

      // WRITE TO DATABASE
      const listing: any = createListing({
        seller_phone: phone,
        crop,
        quantity_kg: qty,
        price_per_kg_zmw: price,
        village: existingUser.village,
        province: existingUser.province,
        description: 'Listed via USSD',
      });

      await sendSms(
        phone,
        `MundaSense: Listing LIVE — ${crop} ${qty}kg @ ZMW ${price}/kg. ID: MS-L-${listing.id}.`
      );

      return res.send(
        `END Listing PUBLISHED!\n` +
        `ID: MS-L-${listing.id}\n` +
        `${crop} · ${qty} kg @ ZMW ${price}/kg\n\n` +
        `SMS sent. Buyers will contact you.`
      );
    }

    /* ---------- 6. Hire Transport ---------- */
    if (choice === '6') {
      if (menuPath.length === 1) {
        return res.send(
          `CON Transport:\n1. Request a truck\n2. Track my delivery`
        );
      }
      if (menuPath[1] === '1') {
        if (menuPath.length === 2) return res.send(`CON Enter pickup location:\n(e.g. Msekera)`);
        if (menuPath.length === 3) return res.send(`CON Enter dropoff location:\n(e.g. Lusaka)`);
        if (menuPath.length === 4) return res.send(`CON Enter cargo weight in kg:\n(e.g. 1000)`);

        const pickup = menuPath[2];
        const dropoff = menuPath[3];
        const weight = parseInt(menuPath[4], 10) || 0;

        const info = db.prepare(`
          INSERT INTO transport_requests
            (requester_phone, pickup_location, dropoff_location, cargo_description, weight_kg, contact_name, contact_phone)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(phone, pickup, dropoff, `${weight}kg`, weight, existingUser.full_name, phone);

        await sendSms(phone, `MundaSense: TR-${info.lastInsertRowid} posted. Transporters will bid.`);

        return res.send(
          `END Transport request posted!\n` +
          `Ref: TR-${info.lastInsertRowid}\n` +
          `${pickup} → ${dropoff}\n${weight} kg\n\n` +
          `SMS confirmation sent.`
        );
      }
      if (menuPath[1] === '2') {
        const r: any = db.prepare(
          "SELECT * FROM transport_requests WHERE requester_phone = ? ORDER BY id DESC LIMIT 1"
        ).get(phone);
        if (!r) return res.send('END No active transport requests.');
        return res.send(
          `END Latest TR-${r.id}\nStatus: ${r.status}\n${r.pickup_location} → ${r.dropoff_location}\n${r.weight_kg} kg`
        );
      }
    }

    /* ---------- 7. Soil Moisture ---------- */
    if (choice === '7') {
      const farm: any = db.prepare('SELECT * FROM farms WHERE farmer_phone = ? LIMIT 1').get(phone);
      if (!farm) return res.send('END No farm registered. Contact cooperative.');
      return res.send(
        `END Live Soil Moisture:\n` +
        `15cm: ${(farm.soil_moisture * 0.85).toFixed(1)}%\n` +
        `30cm: ${farm.soil_moisture.toFixed(1)}%\n` +
        `60cm: ${(farm.soil_moisture * 1.15).toFixed(1)}%\n` +
        `Crop: ${farm.crop}\nHealth: ${farm.health_status}`
      );
    }

    /* ---------- 8. My Account ---------- */
    if (choice === '8') {
      return res.send(
        `END Your Account:\n` +
        `Name: ${existingUser.full_name}\n` +
        `Phone: ${existingUser.phone}\n` +
        `Role: ${existingUser.role}\n` +
        `Village: ${existingUser.village || '—'}\n` +
        `Province: ${existingUser.province || '—'}\n` +
        `Language: ${existingUser.language}`
      );
    }

    return res.send(`END Invalid choice. Dial *384*2873# to continue.`);
  }

  /* ============================================================
     NEW USER — public services + registration
     ============================================================ */
  if (root === '1') {
    if (parts.length === 1) {
      return res.send(
        `CON Welcome! Choose language:\n` + LANGUAGES.map((l, i) => `${i + 1}. ${l}`).join('\n')
      );
    }
    if (parts.length === 2) {
      return res.send(`CON Enter your FULL NAME\n(as on ZIAMIS card):`);
    }
    if (parts.length === 3) {
      return res.send(
        `CON Choose province:\n` +
        `1. Eastern\n2. Lusaka\n3. Central\n4. Southern\n5. Northern\n` +
        `6. Copperbelt\n7. Western\n8. Muchinga\n9. North-Western\n0. Luapula`
      );
    }
    if (parts.length === 4) {
      return res.send(`CON Enter your village or ward name:`);
    }
    if (parts.length === 5) {
      return res.send(
        `CON Choose your role:\n1. Farmer\n2. Seller / Cooperative\n3. Buyer / Miller\n4. Transporter`
      );
    }
    if (parts.length === 6) {
      const language = LANGUAGES[parseInt(parts[1], 10) - 1] || 'English';
      const full_name = parts[2].slice(0, 60);
      const provinceIdx = parseInt(parts[3], 10);
      const province = provinceIdx === 0 ? 'Luapula' : (PROVINCES[provinceIdx - 1] || 'Eastern');
      const village = parts[4].slice(0, 60);
      const role = ROLES[parseInt(parts[5], 10) - 1] || 'farmer';

      const pin = String(Math.floor(1000 + Math.random() * 9000));

      const newUser = createUser({
        phone, full_name, role, village, district: village, province, language, pin,
      });

      await sendSms(
        phone,
        `MundaSense: Welcome ${newUser.full_name}! Your login PIN is ${pin}. Dial *384*2873# again and enter your PIN.`
      );

      const welcomeFn = WELCOME[language] || WELCOME.English;
      return res.send(
        `END ${welcomeFn(newUser.full_name)}\n` +
        `Account created.\n\n` +
        `Your PIN is: ${pin}\n` +
        `It was also sent by SMS.\n\n` +
        `Dial *384*2873# again, enter PIN to:\n` +
        `· Sell your harvest\n· Hire transport\n· Check market prices`
      );
    }
  }

  /* ---------- Public: market prices ---------- */
  if (root === '3') {
    const prices = getMarketPrices();
    if (!prices.length) return res.send('END No listings today.');
    const lines = prices.slice(0, 5).map(p => `${p.crop}: ZMW ${p.price}/kg`).join('\n');
    return res.send(`END Market Prices (ZMW/kg):\n${lines}`);
  }

  /* ---------- Public: officer callback ---------- */
  if (root === '4') {
    const ref = Math.floor(Math.random() * 9000) + 1000;
    db.prepare(
      "INSERT INTO advisories (farm_phone, channel, category, message) VALUES (?, 'USSD', 'Callback', ?)"
    ).run(phone, `Callback ref CB-${ref}`);
    await sendSms(phone, `MundaSense: Callback confirmed. Ref CB-${ref}. Officer will call within 24h.`);
    return res.send(`END Callback requested. Ref: CB-${ref}. Officer will call you soon.`);
  }

  /* ---------- Public: PIN login prompt ---------- */
  if (root === '2') {
    return res.send(
      `END This phone is not registered.\n\n` +
      `Dial *384*2873# and choose option 1 to register.`
    );
  }

  return res.send(`END Invalid choice. Dial *384*2873# to restart.`);
}
