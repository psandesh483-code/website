// /api/drop — Quick Drop (owner uploads). Items are PUBLIC + auto-expiring.
import { dropsStore, isAuthed, json } from './_shared.mjs';
import { randomBytes } from 'node:crypto';

export const config = { path: '/api/drop' };
const MAX = 4 * 1024 * 1024; // 4 MB per file
const TTL = { hour: 3600, day: 86400, week: 604800 }; // seconds
const newId = () => randomBytes(6).toString('hex');
const ttlSeconds = (v) => TTL[v] || TTL.week;

export default async (req) => {
  if (!(await isAuthed(req))) return json({ error: 'unauthorized' }, 401);
  const store = dropsStore();

  if (req.method === 'GET') {
    const { blobs } = await store.list();
    const items = [];
    for (const b of blobs) {
      const md = await store.getMetadata(b.key);
      if (!md || !md.metadata) continue;
      const m = md.metadata;
      if (m.expiresAt && Date.now() > m.expiresAt) { await store.delete(b.key); continue; }
      items.push({ id: b.key, ...m });
    }
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return json({ items });
  }

  if (req.method === 'POST') {
    const ct = req.headers.get('content-type') || '';

    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      if (!file || typeof file === 'string') return json({ error: 'No file received.' }, 400);
      const buf = Buffer.from(await file.arrayBuffer());
      if (!buf.length) return json({ error: 'Empty file.' }, 400);
      if (buf.length > MAX) return json({ error: 'File too large (max 4 MB).' }, 413);
      const ttl = ttlSeconds(form.get('ttl'));
      const id = newId();
      const meta = { kind: 'file', name: String(file.name || 'file').slice(0, 160), contentType: file.type || 'application/octet-stream', size: buf.length, createdAt: Date.now(), expiresAt: Date.now() + ttl * 1000 };
      await store.set(id, buf, { metadata: meta });
      return json({ ok: true, item: { id, ...meta } });
    }

    let body = {}; try { body = await req.json(); } catch {}
    const kind = body.kind === 'link' ? 'link' : 'text';
    let content = String(body.content || '').trim();
    if (!content) return json({ error: 'Nothing to save.' }, 400);
    if (kind === 'link') {
      const t = /^https?:\/\//i.test(content) ? content : 'https://' + content;
      try { new URL(t); } catch { return json({ error: 'That doesn’t look like a valid link.' }, 400); }
      content = t;
    }
    const ttl = ttlSeconds(body.ttl);
    const id = newId();
    const meta = { kind, title: String(body.title || '').trim().slice(0, 120), preview: content.slice(0, 2000), createdAt: Date.now(), expiresAt: Date.now() + ttl * 1000 };
    await store.set(id, content, { metadata: meta });
    return json({ ok: true, item: { id, ...meta } });
  }

  if (req.method === 'DELETE') {
    let body = {}; try { body = await req.json(); } catch {}
    if (body.id) await store.delete(String(body.id));
    return json({ ok: true });
  }

  return json({ error: 'method' }, 405);
};
