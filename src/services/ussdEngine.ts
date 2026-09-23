import { Farm, MarketplaceListing } from '../types';

export interface USSDSessionState {
  path: string[];
  phoneNumber: string;
}

export function handleUSSDRequest(
  text: string,
  phone: string,
  farms: Farm[],
  listings: MarketplaceListing[],
  onRequestCallback?: (phone: string) => void,
  onSellListingCreated?: (phone: string, crop: string, qty: number) => void
): { response: string; isEnd: boolean } {
  const parts = text ? text.split('*').map((s) => s.trim()).filter(Boolean) : [];
  const farm = farms.find((f) => f.phone === phone) || farms[0];

  // Level 0: Main Welcome Menu
  if (parts.length === 0) {
    return {
      response: `CON MundaSense (*2873#)
1. Crop Advisory
2. Disease Alert
3. Storage Check
4. Market Prices
5. Request Callback
6. Sell My Crop
7. Buy Agricultural Inputs
8. Hire Transport
9. ZIAMIS Registration`,
      isEnd: false,
    };
  }

  const rootChoice = parts[0];

  // 1: Crop Advisory
  if (rootChoice === '1') {
    if (parts.length === 1) {
      return {
        response: `CON Select Crop for Advisory:
1. Maize
2. Groundnuts
3. Soybeans
4. Sunflower
5. Cotton
0. Back to Main Menu`,
        isEnd: false,
      };
    }

    const cropMap: Record<string, string> = {
      '1': 'Maize',
      '2': 'Groundnuts',
      '3': 'Soybeans',
      '4': 'Sunflower',
      '5': 'Cotton',
    };

    if (parts[1] === '0') {
      return handleUSSDRequest('', phone, farms, listings);
    }

    const selectedCrop = cropMap[parts[1]] || 'Maize';
    const moisture = farm ? farm.soil_moisture : 32.5;

    let advice = '';
    if (moisture < 25) {
      advice = `Soil moisture 30cm: ${moisture}% (VERY LOW).
Immediate irrigation required within 24h.
Rain expected Thursday.`;
    } else if (moisture < 35) {
      advice = `Soil moisture 30cm: ${moisture}% (WATCH).
Irrigate within 3 days.
Rain likelihood: 40%.`;
    } else {
      advice = `Soil moisture 30cm: ${moisture}% (ADEQUATE).
No irrigation required today.
Canopy moisture normal.`;
    }

    return {
      response: `END MundaSense Advisory:
Plot: ${farm?.village || 'Msekera'} (${selectedCrop})
Stage: ${farm?.crop_stage || 'Grain Fill'}
${advice}
Zikomo!`,
      isEnd: true,
    };
  }

  // 2: Disease Alert
  if (rootChoice === '2') {
    if (parts.length === 1) {
      return {
        response: `CON Crop Health & Pest Alert:
1. Current Local Disease Risk
2. Recent Leaf Screening Alert
3. Request Extension Officer Call
0. Back`,
        isEnd: false,
      };
    }

    if (parts[1] === '1') {
      const risk = farm?.disease_risk || 'WATCH';
      return {
        response: `END Local Disease Risk: ${risk}
Msekera Zone: High humidity (78%) detected.
Watch out for Northern Leaf Blight & Rust.
Inspect lower leaves after rain.
Zikomo.`,
        isEnd: true,
      };
    }

    if (parts[1] === '2') {
      return {
        response: `END Screening Report for ${farm?.name || 'Msekera'}:
Predicted: Maize Northern Leaf Blight
Confidence: 87% (Moderate severity)
Action: Remove infected lower foliage.
Officer notified.`,
        isEnd: true,
      };
    }

    if (parts[1] === '3') {
      if (onRequestCallback) onRequestCallback(phone);
      return {
        response: `END Callback Request Logged!
Extension Officer B. Phiri will call ${phone} within 24 hours.
Reference: CB-${Math.floor(1000 + Math.random() * 9000)}.`,
        isEnd: true,
      };
    }
  }

  // 3: Storage Check
  if (rootChoice === '3') {
    return {
      response: `END Storage Telemetry:
Msekera Hermetic Silo A
Crop: Maize (1,420 bags)
Grain Moisture: 14.3% (CRITICAL)
Temp: 24.2C | Air RH: 74%
WARNING: Moisture exceeds 13%.
Sun-dry bags immediately to avoid aflatoxin.`,
      isEnd: true,
    };
  }

  // 4: Market Prices
  if (rootChoice === '4') {
    const maizePrices = listings.filter((l) => l.crop === 'Maize').map((l) => l.price_per_kg_zmw);
    const avgMaize = maizePrices.length ? (maizePrices.reduce((a, b) => a + b, 0) / maizePrices.length).toFixed(2) : '6.20';

    return {
      response: `END Current Market Prices (ZMW/kg):
- Maize (Grade A): ZMW ${avgMaize}
- Groundnuts (MGV4): ZMW 10.80
- Soybeans (Tikolore): ZMW 8.50
- Sunflower (Milika): ZMW 7.60
Bulk collection: Every Friday at Msekera Shed.`,
      isEnd: true,
    };
  }

  // 5: Request Callback
  if (rootChoice === '5') {
    if (onRequestCallback) onRequestCallback(phone);
    return {
      response: `END Callback requested for ${phone}.
Agricultural Extension Officer assigned:
Cosmas Lungu (Chipata North District).
You will receive an IVR or phone call within 24 hours.`,
      isEnd: true,
    };
  }

  // 6: Sell My Crop
  if (rootChoice === '6') {
    if (parts.length === 1) {
      return {
        response: `CON Sell My Harvest:
Select crop:
1. Maize
2. Groundnuts
3. Soybeans
4. Sunflower`,
        isEnd: false,
      };
    }

    if (parts.length === 2) {
      const cropMap: Record<string, string> = { '1': 'Maize', '2': 'Groundnuts', '3': 'Soybeans', '4': 'Sunflower' };
      const selected = cropMap[parts[1]] || 'Maize';
      return {
        response: `CON Selling ${selected}.
Enter estimated quantity in kilograms (e.g. 1000):`,
        isEnd: false,
      };
    }

    if (parts.length === 3) {
      const cropMap: Record<string, string> = { '1': 'Maize', '2': 'Groundnuts', '3': 'Soybeans', '4': 'Sunflower' };
      const selected = cropMap[parts[1]] || 'Maize';
      const qty = parseInt(parts[2], 10) || 500;
      const rate = selected === 'Maize' ? 6.20 : 10.50;
      const total = (qty * rate).toLocaleString();

      return {
        response: `CON Confirm Listing:
Crop: ${selected}
Quantity: ${qty} kg
Est. Value: ZMW ${total}
1. Confirm & Publish to Cooperative
2. Cancel`,
        isEnd: false,
      };
    }

    if (parts.length === 4 && parts[3] === '1') {
      const cropMap: Record<string, string> = { '1': 'Maize', '2': 'Groundnuts', '3': 'Soybeans', '4': 'Sunflower' };
      const selected = cropMap[parts[1]] || 'Maize';
      const qty = parseInt(parts[2], 10) || 500;
      if (onSellListingCreated) onSellListingCreated(phone, selected, qty);

      return {
        response: `END Listing Published!
${qty} kg of ${selected} added to Msekera Cooperative Exchange.
You will receive an SMS as soon as a buyer places an order.`,
        isEnd: true,
      };
    }
  }

  // 7: Buy Agricultural Inputs
  if (rootChoice === '7') {
    return {
      response: `END Cooperative Inputs Depot:
- SC647 Certified Seed: ZMW 480 / 10kg
- D-Compound Basal Fertilizer: ZMW 820 / 50kg
- Urea Topdressing: ZMW 850 / 50kg
- Hermetic PICS Grain Bags: ZMW 45 each
Visit Msekera Shed with your ZIAMIS card.`,
      isEnd: true,
    };
  }

  // 8: Hire Transport
  if (rootChoice === '8') {
    return {
      response: `END Agri-Transport Haulage:
To request a pickup truck, reply via SMS:
MOVE <PICKUP> <DROPOFF> <BAGS>
Example:
MOVE MSEKERA LUSAKA 20
Local transporters will submit competitive bids.`,
      isEnd: true,
    };
  }

  // 9: ZIAMIS Registration
  if (rootChoice === '9') {
    return {
      response: `END ZIAMIS Smallholder Registry:
Farmer: ${farm?.name || 'Registered Smallholder'}
ZIAMIS ID: ${farm?.ziamis_id || 'ZM-EAS-84001'}
Province: ${farm?.province || 'Eastern'}
Registered Hub: HUB-MSEK-001 (Chipata)
Status: Verified Active`,
      isEnd: true,
    };
  }

  return {
    response: `END Invalid selection. Please dial *2873# again.`,
    isEnd: true,
  };
}
