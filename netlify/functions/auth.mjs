// /api/auth — setup, login, logout, reset, status. Also an internal setup-key-guarded wipe.
import { cfg, getAdmin, makePassword, checkPassword, checkSetupKey, signSession, cookie, isAuthed, json } from './_shared.mjs';
import { randomBytes } from 'node:crypto';

export const config = { path: '/api/auth' };

async function newSecret() {
  return randomBytes(32).toString('hex');
}

export default async (req) => {
  const admin = await getAdmin();

  if (req.method === 'GET') {
    return json({ setupDone: !!admin, authed: admin ? await isAuthed(req) : false });
  }
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  let body = {};
  try { body = await req.json(); } catch {}
  const action = body.action;

  if (action === 'setup') {
    if (admin) return json({ error: 'Already set up. Use reset with your setup key.' }, 409);
    if (!(await checkSetupKey(body.setupKey))) return json({ error: 'Wrong setup key.' }, 403);
    if (!body.password || String(body.password).length < 8) return json({ error: 'Password must be at least 8 characters.' }, 400);
    const pw = await makePassword(body.password);
    const sessionSecret = await newSecret();
    await cfg().setJSON('admin', { ...pw, sessionSecret, createdAt: Date.now() });
    return json({ ok: true }, 200, { 'set-cookie': cookie(signSession(sessionSecret)) });
  }

  if (action === 'reset') {
    if (!(await checkSetupKey(body.setupKey))) return json({ error: 'Wrong setup key.' }, 403);
    if (!body.password || String(body.password).length < 8) return json({ error: 'Password must be at least 8 characters.' }, 400);
    const pw = await makePassword(body.password);
    const sessionSecret = await newSecret();
    await cfg().setJSON('admin', { ...pw, sessionSecret, createdAt: (admin && admin.createdAt) || Date.now() });
    await cfg().setJSON('throttle', { fails: 0, until: 0 });
    return json({ ok: true }, 200, { 'set-cookie': cookie(signSession(sessionSecret)) });
  }

  if (action === 'login') {
    if (!admin) return json({ error: 'Not set up yet.' }, 400);
    const t = (await cfg().get('throttle', { type: 'json' })) || { fails: 0, until: 0 };
    if (t.until && Date.now() < t.until) return json({ error: 'Too many attempts — wait a few minutes.' }, 429);
    if (!(await checkPassword(body.password || '', admin.salt, admin.hash))) {
      const fails = (t.fails || 0) + 1;
      const until = fails >= 6 ? Date.now() + 10 * 60 * 1000 : 0;
      await cfg().setJSON('throttle', { fails: until ? 0 : fails, until });
      return json({ error: 'Wrong password.' }, 401);
    }
    await cfg().setJSON('throttle', { fails: 0, until: 0 });
    return json({ ok: true }, 200, { 'set-cookie': cookie(signSession(admin.sessionSecret)) });
  }

  if (action === 'logout') {
    return json({ ok: true }, 200, { 'set-cookie': cookie('') });
  }

  if (action === 'wipe') {
    // Guarded maintenance reset — clears the admin account (not the tools' data).
    if (!(await checkSetupKey(body.setupKey))) return json({ error: 'Wrong setup key.' }, 403);
    await cfg().delete('admin');
    await cfg().delete('throttle');
    return json({ ok: true }, 200, { 'set-cookie': cookie('') });
  }

  return json({ error: 'unknown action' }, 400);
};
