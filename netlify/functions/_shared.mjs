// Shared helpers for the admin portal functions.
// Files prefixed with "_" are NOT deployed as routes by Netlify.
import { getStore } from '@netlify/blobs';
import { scrypt as _scrypt, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(_scrypt);

// One-time setup key — guards first-time password creation + password reset.
// Only the scrypt hash lives here; the plaintext key is given to the owner privately.
const SETUP_SALT = '9096851d38761a8c740999521d743889';
const SETUP_HASH = '25a2cb6516b11518a462f4764280c77d24f19969ed2cf460f660c86ada8db5a81666c27cf357d309d8c39182ce8d6ee9c10892c8771f6dbeebce9b198ff9dd13';

export const cfg = () => getStore({ name: 'admin-config', consistency: 'strong' });
export const linksStore = () => getStore({ name: 'links', consistency: 'strong' });
export const dropsStore = () => getStore({ name: 'drops', consistency: 'strong' });
export const msgsStore = () => getStore({ name: 'messages', consistency: 'strong' });
export const hubStore = () => getStore({ name: 'hub', consistency: 'strong' });
export const moneyStore = () => getStore({ name: 'money', consistency: 'strong' });

async function hash(pw, salt) {
  const dk = await scrypt(String(pw), salt, 64);
  return dk.toString('hex');
}
function safeEq(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function makePassword(pw) {
  const salt = randomBytes(16).toString('hex');
  return { salt, hash: await hash(pw, salt) };
}
export async function checkPassword(pw, salt, expected) {
  return safeEq(await hash(pw, salt), expected);
}
export async function checkSetupKey(key) {
  return safeEq(await hash(key, SETUP_SALT), SETUP_HASH);
}

const TTL = 60 * 60 * 24 * 14; // 14 days
export function signSession(secret) {
  const body = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + TTL })).toString('base64url');
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return body + '.' + sig;
}
export function checkSession(token, secret) {
  if (!token || !secret) return false;
  const [body, sig] = token.split('.');
  if (!body || !sig) return false;
  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  if (!safeEq(sig, expected)) return false;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString()).exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function cookie(token) {
  const base = 'sp_admin=' + token + '; HttpOnly; Secure; SameSite=Lax; Path=/';
  return token ? base + '; Max-Age=' + TTL : base + '; Max-Age=0';
}
export function readCookie(req, name = 'sp_admin') {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extraHeaders },
  });
}

export async function getAdmin() {
  return (await cfg().get('admin', { type: 'json' })) || null;
}
export async function isAuthed(req) {
  const admin = await getAdmin();
  if (!admin) return false;
  return checkSession(readCookie(req), admin.sessionSecret);
}
