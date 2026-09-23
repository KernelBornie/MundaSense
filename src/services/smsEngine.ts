import { Farm, MarketplaceListing, Order } from '../types';

export interface SMSProcessingResult {
  reply: string;
  orderAction?: { orderId: number; confirmed: boolean };
}

export function processInboundSMS(
  phone: string,
  message: string,
  farms: Farm[],
  listings: MarketplaceListing[],
  orders: Order[]
): SMSProcessingResult {
  const clean = message.trim().toUpperCase();
  const parts = clean.split(/\s+/);
  const cmd = parts[0] || '';
  const arg = parts[1] || '';

  const farm = farms.find((f) => f.phone === phone) || farms[0];

  if (cmd === 'SOIL') {
    if (farm) {
      return {
        reply: `MundaSense Telemetry for ${farm.name} (${farm.village}):
Soil Moisture @ 15cm: 24.5% (Low)
Soil Moisture @ 30cm: ${farm.soil_moisture}% (${farm.health_status.toUpperCase()})
Soil Moisture @ 60cm: 33.2%
Hub: HUB-MSEK-001 (Chipata).`,
      };
    }
    return { reply: 'MundaSense: No registered farm located for your phone number.' };
  }

  if (cmd === 'PRICE') {
    if (arg) {
      const matched = listings.filter((l) => l.crop.toUpperCase().includes(arg));
      if (matched.length > 0) {
        const avg = (matched.reduce((s, l) => s + l.price_per_kg_zmw, 0) / matched.length).toFixed(2);
        return {
          reply: `MundaSense Market Index: ${arg} average price is ZMW ${avg}/kg across ${matched.length} cooperative lots.`,
        };
      }
      return {
        reply: `MundaSense Market: No recent trades found for ${arg}. Average Maize is ZMW 6.20/kg, Groundnuts ZMW 10.80/kg.`,
      };
    }
    return {
      reply: 'MundaSense Market (ZMW/kg): Maize 6.20, Groundnuts 10.80, Soybeans 8.50, Sunflower 7.60. Reply PRICE MAIZE for details.',
    };
  }

  if ((cmd === 'YES' || cmd === 'NO') && arg) {
    const orderId = parseInt(arg, 10);
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      const confirmed = cmd === 'YES';
      return {
        reply: confirmed
          ? `MundaSense: Order #${orderId} CONFIRMED! Buyer ${order.buyer_name} has been notified. 1,000kg ${order.crop} valued at ZMW ${order.total_zmw.toLocaleString()} is reserved. Transport can now be booked.`
          : `MundaSense: Order #${orderId} DECLINED. The listing has been restored to the open marketplace.`,
        orderAction: { orderId, confirmed },
      };
    }
    return { reply: `MundaSense: Order #${arg} not found or expired.` };
  }

  if (cmd === 'DISEASE') {
    return {
      reply: `MundaSense Disease Alert: High humidity in Eastern Province favors Northern Leaf Blight & Rust. Inspect leaves for cigar-shaped spots. Reply CALL for extension officer callback.`,
    };
  }

  if (cmd === 'CALL') {
    return {
      reply: `MundaSense: Callback requested. Extension Officer Cosmas Lungu will contact you within 24 hours. Zikomo!`,
    };
  }

  if (cmd === 'BULK') {
    return {
      reply: `MundaSense Cooperative: Your harvest has been pre-booked for Friday aggregate bulk truck loading. Please bring moisture-tested bags to Msekera Depot by 09:00 Friday.`,
    };
  }

  if (cmd === 'HELP') {
    return {
      reply: `MundaSense SMS Commands:
- SOIL: Get live soil moisture readings
- PRICE <CROP>: Check market price index
- YES <ID>: Confirm buyer order
- NO <ID>: Decline buyer order
- BULK: Join Friday aggregation sale
- CALL: Request extension officer call.`,
    };
  }

  return {
    reply: `MundaSense: Unknown command "${message.substring(0, 20)}". Reply HELP for available options or dial *2873#.`,
  };
}
