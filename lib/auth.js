import crypto from 'crypto';

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || '426fa66366d8b6c9A1!b8973f10';
const SECRET = process.env.NEXTAUTH_SECRET || 'babeh_secret';

export function verifyAdmin(username, password) {
  return username === ADMIN_USER && password === ADMIN_PASS;
}

export function createSessionToken() {
  const payload = JSON.stringify({ ts: Date.now(), r: Math.random() });
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ p: payload, s: sig })).toString('base64url');
}

export function verifySessionToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString());
    const sig = crypto.createHmac('sha256', SECRET).update(decoded.p).digest('hex');
    if (sig !== decoded.s) return false;
    const payload = JSON.parse(decoded.p);
    // Token valid selama 24 jam
    return Date.now() - payload.ts < 24 * 60 * 60 * 1000;
  } catch { return false; }
}
