/**
 * MundaSense — Real SMS Gateway
 * Sends SMS through Africa's Talking. Falls back to log-only mode if credentials missing.
 * 
 * Env vars required:
 *   AT_USERNAME      - your AT username (use "sandbox" for testing)
 *   AT_API_KEY       - your AT API key (from AT dashboard)
 *   AT_SENDER_ID     - optional alphanumeric sender (default: MUNDASENSE)
 *   AT_BASE_URL      - optional (default: production URL)
 *                      Sandbox: https://api.sandbox.africastalking.com/version1
 *                      Live:    https://api.africastalking.com/version1
 */
import { logSms, updateSmsStatus } from './db.ts';

const AT_USERNAME = process.env.AT_USERNAME || 'sandbox';
const AT_API_KEY = process.env.AT_API_KEY;
const AT_SENDER_ID = process.env.AT_SENDER_ID || 'MUNDASENSE';
const AT_BASE_URL =
  process.env.AT_BASE_URL ||
  (AT_USERNAME === 'sandbox'
    ? 'https://api.sandbox.africastalking.com/version1'
    : 'https://api.africastalking.com/version1');

const LIVE_MODE = Boolean(AT_API_KEY);

console.log(`[SMS] Provider: ${LIVE_MODE ? 'Africa\'s Talking (LIVE)' : 'log-only'}`);
console.log(`[SMS] Username: ${AT_USERNAME}`);
console.log(`[SMS] Base URL: ${AT_BASE_URL}`);

export interface SMSResult {
  ok: boolean;
  providerId?: string;
  status: string;
  mode: 'live' | 'log-only' | 'error';
  error?: string;
  raw?: any;
}

/**
 * Send a real SMS through Africa's Talking.
 * Always logs the message to the DB, whether or not delivery succeeds.
 */
export async function sendSms(phone: string, message: string): Promise<SMSResult> {
  // 1) Always log the outbound message to DB
  const rowId = logSms(phone, 'out', message, 'africastalking', undefined, 'queued');

  // 2) If no credentials, just log and return
  if (!LIVE_MODE) {
    console.log(`[SMS] (log-only) → ${phone}: ${message.slice(0, 80)}${message.length > 80 ? '…' : ''}`);
    return { ok: true, mode: 'log-only', status: 'logged' };
  }

  // 3) Send through AT
  try {
    const body = new URLSearchParams({
      username: AT_USERNAME,
      to: phone,
      message,
      from: AT_SENDER_ID,
    });

    console.log(`[SMS] → Sending to ${phone} via AT...`);

    const res = await fetch(`${AT_BASE_URL}/messaging`, {
      method: 'POST',
      headers: {
        apiKey: AT_API_KEY!,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawText: text };
    }

    // Parse AT response
    const recipient = data?.SMSMessageData?.Recipients?.[0];
    const providerId: string | undefined = recipient?.messageId;
    const recipientStatus: string = recipient?.status || 'Unknown';
    const recipientNumber = recipient?.number;

    // Map AT statuses to our own
    let dbStatus: string;
    if (recipientStatus === 'Success') dbStatus = 'sent';
    else if (recipientStatus === 'Sent') dbStatus = 'sent';
    else if (recipientStatus === 'Queued') dbStatus = 'queued';
    else if (recipientStatus === 'Rejected') dbStatus = 'failed';
    else if (recipientStatus === 'Failed') dbStatus = 'failed';
    else dbStatus = 'queued';

    // Update DB log with real provider status
    updateSmsStatus(rowId, dbStatus, providerId);

    console.log(
      `[SMS] ← ${recipientStatus} | to=${recipientNumber} | id=${providerId} | ${message.slice(0, 50)}…`
    );

    return {
      ok: res.ok && dbStatus !== 'failed',
      providerId,
      status: dbStatus,
      mode: 'live',
      raw: recipient,
    };
  } catch (e: any) {
    console.error(`[SMS] Send error:`, e.message);

    // Update DB log with failed status
    updateSmsStatus(rowId, 'failed');

    return {
      ok: false,
      mode: 'error',
      status: 'failed',
      error: e.message,
    };
  }
}

/**
 * Send an SMS to many recipients (bulk campaign).
 * Returns a summary object.
 */
export async function sendBulkSms(
  phones: string[],
  message: string
): Promise<{ total: number; sent: number; failed: number; results: SMSResult[] }> {
  const results: SMSResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const phone of phones) {
    const result = await sendSms(phone, message);
    results.push(result);
    if (result.ok) sent++;
    else failed++;

    // Small delay to avoid rate limiting (AT allows ~5/sec)
    await new Promise((r) => setTimeout(r, 250));
  }

  return { total: phones.length, sent, failed, results };
}

/**
 * Fetch AT account balance (useful for monitoring costs).
 */
export async function getAccountBalance(): Promise<{
  ok: boolean;
  balance?: string;
  currency?: string;
  error?: string;
}> {
  if (!LIVE_MODE) return { ok: false, error: 'live mode not configured' };

  try {
    const res = await fetch(`${AT_BASE_URL}/user?username=${AT_USERNAME}`, {
      headers: {
        apiKey: AT_API_KEY!,
        Accept: 'application/json',
      },
    });
    const data: any = await res.json();
    const balance = data?.UserData?.balance;
    return { ok: true, balance, currency: 'ZMW' };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/**
 * Fetch delivery reports for recently sent messages.
 */
export async function getDeliveryReports(): Promise<any> {
  if (!LIVE_MODE) return { ok: false, error: 'live mode not configured' };

  try {
    const res = await fetch(
      `${AT_BASE_URL}/messaging?username=${AT_USERNAME}`,
      {
        headers: {
          apiKey: AT_API_KEY!,
          Accept: 'application/json',
        },
      }
    );
    return await res.json();
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
