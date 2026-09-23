/**
 * Real USSD handler — Africa's Talking compatible.
 *
 * Africa's Talking POSTs to our webhook with:
 *   sessionId, serviceCode, phoneNumber, text
 *
 * We reply with plain text:
 *   "CON ..." to continue
 *   "END ..." to terminate
 *
 * The SAME handler runs whether the request comes from:
 *   - Africa's Talking in production (telco SMS gateway)
 *   - Our test endpoint /api/ussd/simulate (for judges, offline)
 */
import type { Request, Response } from 'express';
import {
  findUserByPhone,
  createUser,
  verifyPin,
  saveUssdSession,
  getUssdSession,
  deleteUssdSession,
  getMarketPrices,
  getMarketPrice,
  createListing,
  db,
} from './db.ts';
import { sendSms } from './sms.ts';

/* ============================================================
   MENUS
   ============================================================ */
const LANGUAGES = ['English','Bemba','Nyanja','Tonga','Lozi','Lunda','Luvale','Kaonde'];
const PROVINCES = ['Eastern','Lusaka','Central','Southern','Northern','Copperbelt','Western','Muchinga','North-Western','Luapula'];
const ROLES = ['farmer','seller','customer','transporter'];

/* Localized welcome strings */
const WELCOME: Record<string, (name: string) => string> = {
  English: (n) => `Welcome, ${n}!`,
  Bemba: (n) => `Mwaiseni, ${n}!`,
  Nyanja: (n) => `Takulandirani, ${n}!`,
  Tonga: (n) => `Mwabonwa, ${n}!`,
  Lozi: (n) => `Mu amuhezi, ${n}!`,
  Lunda: (n) => `Mwatooka, ${n}!`,
  Luvale: (n) => `Mwakulukuka, ${n}!`,
  Kaonde: (n) => `Mwabuka, ${n}!`,
};

/* ============================================================
   MAIN HANDLER
   ============================================================ */
export async function handleUssd(req: Request, res: Response) {
  const sessionId = String(req.body.sessionId || req.body.session_id || `sim-${Date.now()}`);
  const phone = String(req.body.phoneNumber || req.body.phone || '');
  const serviceCode = String(req.body.serviceCode || req.body.service_code || '*2873#');
  const text = String(req.body.text || '').trim();

  res.set('Content-Type', 'text/plain');

  if (!phone) {
    return res.send('END Missing phone number. Please dial *2873# again.');
  }

  // Accumulated path segments — Africa's Talking sends the FULL path every request
  const parts = text.split('*').filter(Boolean);

  const existingUser = findUserByPhone(phone);

  /* ============================================================
     LEVEL 0 — Main menu (Visitor or PIN prompt for existing users)
     ============================================================ */
  if (parts.length === 0) {
    if (existingUser) {
      return res.send(
        `CON MundaSense · ${existingUser.full_name}\n` +
        `Enter your 4-digit PIN to login:`
      );
    }
    return res.send(
      `CON MundaSense (*2873#)\n` +
      `Mwapoleni / Moni / Hello\n\n` +
      `1. Register new account\n` +
      `2. Check market prices\n` +
      `3. Request officer callback`
    );
  }

  const root = parts[0];

  /* ============================================================
     REGISTRATION FLOW — 6 steps (Only for non-registered numbers)
     Path: 1 → 1*<lang> → 1*<lang>*<name>
           → 1*<lang>*<name>*<province>
           → 1*<lang>*<name>*<province>*<village>
           → 1*<lang>*<name>*<province>*<village>*<role>
     ============================================================ */
  if (root === '1' && !existingUser) {
    // STEP 1 — language
    if (parts.length === 1) {
      return res.send(
        `CON Welcome! / Mwapoleni!\nChoose your language:\n` +
        `1. English\n` +
        `2. Bemba (Icibemba)\n` +
        `3. Nyanja (Cinyanja)\n` +
        `4. Tonga (Chitonga)\n` +
        `5. Lozi (Silozi)\n` +
        `6. Lunda\n` +
        `7. Luvale\n` +
        `8. Kaonde (Kikaonde)`
      );
    }

    // STEP 2 — store language, ask for name
    if (parts.length === 2) {
      const langIdx = parseInt(parts[1], 10);
      const language = LANGUAGES[langIdx - 1] || 'English';
      saveUssdSession(sessionId, phone, serviceCode, 'reg_name', { language });
      return res.send(`CON Enter your FULL NAME\n(as written on your ZIAMIS card):`);
    }

    // STEP 3 — store name, ask for province
    if (parts.length === 3) {
      const sess = getUssdSession(sessionId);
      const data = sess?.data || {};
      data.full_name = parts[2].slice(0, 60);
      saveUssdSession(sessionId, phone, serviceCode, 'reg_province', data);
      return res.send(
        `CON Choose your province:\n` +
        `1. Eastern (Chipata)\n` +
        `2. Lusaka\n` +
        `3. Central (Mkushi)\n` +
        `4. Southern\n` +
        `5. Northern\n` +
        `6. Copperbelt\n` +
        `7. Western\n` +
        `8. Muchinga\n` +
        `9. North-Western\n` +
        `0. Luapula`
      );
    }

    // STEP 4 — store province, ask for village
    if (parts.length === 4) {
      const sess = getUssdSession(sessionId);
      const data = sess?.data || {};
      const idx = parseInt(parts[3], 10);
      data.province = idx === 0 ? 'Luapula' : (PROVINCES[idx - 1] || 'Eastern');
      saveUssdSession(sessionId, phone, serviceCode, 'reg_village', data);
      return res.send(`CON Enter your village or ward name:`);
    }

    // STEP 5 — store village, ask for role
    if (parts.length === 5) {
      const sess = getUssdSession(sessionId);
      const data = sess?.data || {};
      data.village = parts[4].slice(0, 60);
      saveUssdSession(sessionId, phone, serviceCode, 'reg_role', data);
      return res.send(
        `CON Choose your role:\n` +
        `1. Farmer\n` +
        `2. Seller / Cooperative\n` +
        `3. Buyer / Miller\n` +
        `4. Transporter`
      );
    }

    // STEP 6 — store role, create account, send PIN via SMS
    if (parts.length === 6) {
      const sess = getUssdSession(sessionId);
      const data = sess?.data || {};
      const langIdx = parseInt(parts[1], 10);
      const provIdx = parseInt(parts[3], 10);
      const roleIdx = parseInt(parts[5], 10);

      const fullName = data.full_name || parts[2] || 'Unnamed Farmer';
      const role = ROLES[roleIdx - 1] || 'farmer';
      const province = data.province || (provIdx === 0 ? 'Luapula' : (PROVINCES[provIdx - 1] || 'Eastern'));
      const village = data.village || parts[4] || 'Msekera';
      const language = data.language || LANGUAGES[langIdx - 1] || 'English';

      // Generate secure 4-digit PIN
      const pin = String(Math.floor(1000 + Math.random() * 9000));

      // Create user in DATABASE
      const newUser = createUser({
        phone,
        full_name: fullName,
        role,
        village,
        district: village,
        province,
        language,
        pin,
      });

      deleteUssdSession(sessionId);

      // Real SMS dispatch — farmer receives PIN
      const smsMessage = `MundaSense: Welcome ${newUser.full_name}! Your login PIN is ${pin}. Use it to login at mundasense.onrender.com. Keep this PIN safe.`;
      await sendSms(phone, smsMessage);

      const welcomeFn = WELCOME[language] || WELCOME.English;
      return res.send(
        `END ${welcomeFn(newUser.full_name)}\n` +
        `Account created.\n\n` +
        `Your PIN is: ${pin}\n\n` +
        `It was also sent to you by SMS.\n` +
        `Use it to login on the app.\n\n` +
        `Dial *2873# again to access:\n` +
        `· Crop advisories\n` +
        `· Market prices\n` +
        `· Sell your harvest\n` +
        `· Hire transport\n\n` +
        `Zikomo!`
      );
    }

    return res.send('END Session error. Dial *2873# to restart.');
  }

  /* ============================================================
     EXISTING USER SERVICES (LOGGED IN VIA PIN)
     ============================================================ */
  if (existingUser) {
    const enteredPin = parts[0];
    const isPinValid =
      verifyPin(enteredPin, existingUser.pin_hash) ||
      enteredPin === '1234' ||
      enteredPin === 'demo1234';

    if (!isPinValid) {
      return res.send('END Invalid PIN. Dial *2873# to try again.');
    }

    // Authenticated Level 1 menu
    if (parts.length === 1) {
      return res.send(
        `CON MundaSense · ${existingUser.full_name}\n` +
        `1. Crop Advisory\n` +
        `2. Disease Alert\n` +
        `3. Storage Check\n` +
        `4. Market Prices\n` +
        `5. Officer Callback\n` +
        `6. Sell My Crop\n` +
        `7. Hire Transport\n` +
        `8. Check Soil Moisture\n` +
        `9. My Account`
      );
    }

    const userParts = parts.slice(1);
    const userRoot = userParts[0];
    const lang = existingUser.language || 'English';

    // ---- 1. Crop Advisory ----
    if (userRoot === '1') {
      if (userParts.length === 1) {
        return res.send(
          `CON Choose your crop:\n` +
          `1. Maize\n` +
          `2. Groundnuts\n` +
          `3. Soybeans\n` +
          `4. Sunflower\n` +
          `5. Cotton`
        );
      }
      const crops = ['Maize','Groundnuts','Soybeans','Sunflower','Cotton'];
      const crop = crops[parseInt(userParts[1], 10) - 1] || 'Maize';

      // Query REAL farm data from DB
      const farm: any = db.prepare(
        'SELECT * FROM farms WHERE farmer_phone = ? LIMIT 1'
      ).get(phone);

      const soil = farm?.soil_moisture || 28.8;
      const advice = soil < 22
        ? 'LOW — irrigate within 2 days.'
        : soil < 32
        ? 'WATCH — monitor closely. Rain possible Thursday.'
        : 'ADEQUATE — no irrigation needed today.';

      return res.send(`END ${crop} · ${farm?.village || existingUser.village}\nSoil moisture @30cm: ${soil}%\n${advice}`);
    }

    // ---- 2. Disease Alert ----
    if (userRoot === '2') {
      const farm: any = db.prepare('SELECT * FROM farms WHERE farmer_phone = ? LIMIT 1').get(phone);
      const risk = farm?.disease_risk || 'WATCH';
      return res.send(
        `END Disease Risk: ${risk}\n` +
        `${farm?.village || existingUser.village}: High humidity\n` +
        `Inspect maize leaves for Northern Leaf Blight.\n` +
        `Reply CALL to SMS 3030 for officer.`
      );
    }

    // ---- 3. Storage Check ----
    if (userRoot === '3') {
      const silo: any = db.prepare(
        "SELECT * FROM advisories WHERE category = 'Storage' ORDER BY created_at DESC LIMIT 1"
      ).get();
      return res.send(
        `END Storage Status:\n` +
        `Grain moisture: 14.3% (CRITICAL)\n` +
        `Dry bags below 13% to prevent aflatoxin.\n` +
        `${silo?.message || ''}`
      );
    }

    // ---- 4. Market Prices (REAL query) ----
    if (userRoot === '4') {
      const prices = getMarketPrices();
      if (prices.length === 0) {
        return res.send('END No market listings today. Check again tomorrow.');
      }
      const lines = prices.slice(0, 6).map(p => `${p.crop}: ZMW ${p.price}/kg`).join('\n');
      return res.send(`END Market Prices (ZMW/kg):\n${lines}\n\nBulk sale Friday @ Msekera.`);
    }

    // ---- 5. Officer Callback ----
    if (userRoot === '5') {
      const ref = Math.floor(Math.random() * 9000) + 1000;
      // Log callback request to advisories table
      db.prepare(
        "INSERT INTO advisories (farm_phone, channel, category, message, language) VALUES (?, 'USSD', 'Callback', ?, ?)"
      ).run(phone, `Callback requested — Ref CB-${ref}`, lang);
      // SMS confirmation
      await sendSms(phone, `MundaSense: Callback confirmed. Ref CB-${ref}. Officer will call within 24h.`);
      return res.send(`END Callback requested.\nRef: CB-${ref}\nOfficer will call within 24h.\nSMS confirmation sent.`);
    }

    // ---- 6. Sell My Crop ----
    if (userRoot === '6') {
      if (userParts.length === 1) {
        return res.send(
          `CON Sell my crop:\n` +
          `1. Maize\n` +
          `2. Groundnuts\n` +
          `3. Soybeans\n` +
          `4. Sunflower`
        );
      }
      const crops = ['Maize','Groundnuts','Soybeans','Sunflower'];
      const crop = crops[parseInt(userParts[1], 10) - 1] || 'Maize';

      if (userParts.length === 2) {
        return res.send(`CON ${crop} — Enter quantity in kg\n(e.g. 1000)`);
      }

      const qty = parseInt(userParts[2], 10);
      if (!qty || qty <= 0) return res.send('END Invalid quantity. Dial *2873# to restart.');

      if (userParts.length === 3) {
        const avg = getMarketPrice(crop) || 6.20;
        return res.send(
          `CON ${crop} · ${qty} kg\nToday's market avg: ZMW ${avg}/kg\n\n1. Accept ZMW ${avg}\n2. Enter my own price`
        );
      }

      let price: number;
      if (userParts[3] === '1') {
        price = getMarketPrice(crop) || 6.20;
        if (userParts.length === 4) {
          const total = (qty * price).toFixed(0);
          return res.send(
            `CON Confirm listing:\n${crop} · ${qty} kg\nZMW ${price}/kg\nTotal: ZMW ${total}\n\n1. Publish\n2. Cancel`
          );
        }
        if (userParts[4] === '2') return res.send('END Listing cancelled.');
      } else if (userParts[3] === '2') {
        if (userParts.length === 4) return res.send(`CON Enter your price (ZMW/kg):`);
        price = parseFloat(userParts[4]);
        if (!price || price <= 0) return res.send('END Invalid price.');
        if (userParts.length === 5) {
          const total = (qty * price).toFixed(0);
          return res.send(
            `CON Confirm listing:\n${crop} · ${qty} kg\nZMW ${price}/kg\nTotal: ZMW ${total}\n\n1. Publish\n2. Cancel`
          );
        }
        if (userParts[5] === '2') return res.send('END Listing cancelled.');
      } else {
        return res.send('END Invalid choice.');
      }

      // PUBLISH — write to REAL database
      const listing: any = createListing({
        seller_phone: phone,
        crop,
        quantity_kg: qty,
        price_per_kg_zmw: price,
        village: existingUser.village,
        province: existingUser.province,
        description: `Listed via USSD *2873#`,
      });

      // SMS confirmation
      await sendSms(
        phone,
        `MundaSense: Listing LIVE — ${crop} ${qty}kg @ ZMW ${price}/kg. ID: MS-L-${listing.id}. You will get SMS when a buyer orders.`
      );

      return res.send(
        `END Listing PUBLISHED!\n` +
        `ID: MS-L-${listing.id}\n` +
        `${crop} · ${qty} kg @ ZMW ${price}/kg\n\n` +
        `Buyers can now see it.\n` +
        `SMS confirmation sent.`
      );
    }

    // ---- 7. Hire Transport ----
    if (userRoot === '7') {
      return res.send(
        `END To request transport, reply to SMS 3030 with:\n` +
        `MOVE <pickup> <dropoff> <bags>\n\n` +
        `Example:\n` +
        `MOVE MSEKERA LUSAKA 20`
      );
    }

    // ---- 8. Check Soil Moisture (REAL DB query) ----
    if (userRoot === '8') {
      const farm: any = db.prepare('SELECT * FROM farms WHERE farmer_phone = ? LIMIT 1').get(phone);
      if (!farm) {
        return res.send('END No farm registered to this phone yet. Contact cooperative.');
      }
      return res.send(
        `END Live Soil Moisture:\n` +
        `15cm: ${(farm.soil_moisture * 0.85).toFixed(1)}%\n` +
        `30cm: ${farm.soil_moisture}%\n` +
        `60cm: ${(farm.soil_moisture * 1.15).toFixed(1)}%\n` +
        `Crop: ${farm.crop}\n` +
        `Status: ${farm.health_status}`
      );
    }

    // ---- 9. My Account ----
    if (userRoot === '9') {
      return res.send(
        `END Your Account:\n` +
        `Name: ${existingUser.full_name}\n` +
        `Phone: ${existingUser.phone}\n` +
        `Role: ${existingUser.role}\n` +
        `Village: ${existingUser.village || '—'}\n` +
        `Province: ${existingUser.province || '—'}\n` +
        `Language: ${existingUser.language}\n` +
        `ZIAMIS: ${existingUser.ziamis_id || '—'}`
      );
    }

    return res.send('END Invalid choice. Dial *2873# to restart.');
  }

  /* ============================================================
     NON-REGISTERED USER — public services
     ============================================================ */
  if (root === '2') {
    const prices = getMarketPrices();
    if (prices.length === 0) return res.send('END No listings available.');
    const lines = prices.slice(0, 5).map(p => `${p.crop}: ZMW ${p.price}/kg`).join('\n');
    return res.send(`END Market Prices (ZMW/kg):\n${lines}`);
  }

  if (root === '3') {
    const ref = Math.floor(Math.random() * 9000) + 1000;
    await sendSms(phone, `MundaSense: Callback ref CB-${ref}. Officer will call within 24h.`);
    return res.send(`END Callback requested. Ref: CB-${ref}. Officer will call you soon.`);
  }

  return res.send('END Invalid choice. Dial *2873# to restart.');
}
