const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '426fa66366d8b6c9A1!b8973f10';
const ADMIN_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';

export function verifyAdmin(username, password) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function generateAdminToken() {
  const payload = {
    user: ADMIN_USERNAME,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 jam
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = Buffer.from(
    `${encoded}.${ADMIN_SECRET}`
  ).toString('base64');
  return `${encoded}.${signature}`;
}

export function verifyAdminToken(token) {
  try {
    const [encoded] = token.split('.');
    const payload = JSON.parse(Buffer.from(encoded, 'base64').toString());
    if (payload.exp < Date.now()) return false;
    return payload.user === ADMIN_USERNAME;
  } catch {
    return false;
  }
}
