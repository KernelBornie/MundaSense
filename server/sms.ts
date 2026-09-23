/**
 * Real SMS sending via Africa's Talking.
 * Falls back to logged-only mode when credentials are missing (dev).
 */
import { logSms, db } from './db.ts';

const AT_USERNAME = process.env.AT_USERNAME || process.env.AT_USERNAME_SANDBOX;
const AT_API_KEY = process.env.AT_API_KEY;
const AT_SENDER_ID = process.env.AT_SENDER_ID || 'MUNDASENSE';
const AT_BASE_URL = process.env.AT_BASE_URL || 'https://api.africastalking.com/version1';

export async function sendSms(phone: string, message: string): Promise<{ ok: boolean; providerId?: string; mode: string }> {
  // Always log locally first — audit trail
  const rowId = logSms(phone, 'out', message, 'africastalking', undefined, 'queued');

  if (!AT_API_KEY || !AT_USERNAME) {
    console.log(`[SMS] Dev mode — would send to ${phone}: ${message.slice(0, 60)}`);
    return { ok: true, mode: 'log-only' };
  }

  try {
    const body = new URLSearchParams({
      username: AT_USERNAME,
      to: phone,
      message,
      from: AT_SENDER_ID,
    });

    const res = await fetch(`${AT_BASE_URL}/messaging`, {
      method: 'POST',
      headers: {
        apiKey: AT_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    const data: any = await res.json().catch(() => ({}));
    const recipient = data?.SMSMessageData?.Recipients?.[0];
    const providerId = recipient?.messageId;
    const status = recipient?.status || (res.ok ? 'sent' : 'failed');

    // Update log
    db.prepare('UPDATE sms_log SET status = ?, provider_id = ? WHERE id = ?')
      .run(status, providerId || null, rowId as any);

    if (!res.ok) console.warn('[SMS] AT returned error', res.status, data);
    return { ok: res.ok, providerId, mode: 'live' };
  } catch (e: any) {
    console.error('[SMS] Send failed:', e.message);
    return { ok: false, mode: 'error' };
  }
}
