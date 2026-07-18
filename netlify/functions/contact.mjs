// /api/contact — public: receives the site contact form, stores it in the owner's inbox.
import { msgsStore, json } from './_shared.mjs';
import { randomBytes } from 'node:crypto';

export const config = { path: '/api/contact' };

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  let body = {};
  const ct = req.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) body = await req.json();
    else body = Object.fromEntries((await req.formData()).entries());
  } catch {}

  // Honeypot — silently accept bots without storing.
  if (body['bot-field']) return json({ ok: true });

  const name = String(body.name || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().slice(0, 160);
  const message = String(body.message || '').trim().slice(0, 5000);
  if (!name || !email || !message) return json({ error: 'Please fill in every field.' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'That email looks off.' }, 400);

  const id = randomBytes(6).toString('hex');
  await msgsStore().setJSON(id, { name, email, message, createdAt: Date.now(), read: false });
  return json({ ok: true });
};
