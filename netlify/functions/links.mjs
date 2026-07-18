// /api/links — CRUD for short links (owner only).
import { linksStore, isAuthed, json } from './_shared.mjs';

export const config = { path: '/api/links' };

const RESERVED = new Set(['admin', 'api', 'go', 'd', 'assets', 'netlify']);

export default async (req) => {
  if (!(await isAuthed(req))) return json({ error: 'unauthorized' }, 401);
  const store = linksStore();

  if (req.method === 'GET') {
    const { blobs } = await store.list();
    const links = [];
    for (const b of blobs) {
      const v = await store.get(b.key, { type: 'json' });
      if (v) links.push({ slug: b.key, ...v });
    }
    links.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return json({ links });
  }

  if (req.method === 'POST') {
    let body = {}; try { body = await req.json(); } catch {}
    const slug = String(body.slug || '').trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{0,48}$/.test(slug)) return json({ error: 'Slug: letters, numbers and hyphens only.' }, 400);
    if (RESERVED.has(slug)) return json({ error: 'That slug is reserved.' }, 400);
    let url = String(body.url || '').trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    try { new URL(url); } catch { return json({ error: 'Invalid destination URL.' }, 400); }
    if (await store.get(slug, { type: 'json' })) return json({ error: 'That slug is already taken.' }, 409);
    const rec = { url, title: String(body.title || '').trim().slice(0, 120), clicks: 0, createdAt: Date.now() };
    await store.setJSON(slug, rec);
    return json({ ok: true, link: { slug, ...rec } });
  }

  if (req.method === 'DELETE') {
    let body = {}; try { body = await req.json(); } catch {}
    const slug = String(body.slug || '').trim().toLowerCase();
    if (slug) await store.delete(slug);
    return json({ ok: true });
  }

  return json({ error: 'method' }, 405);
};
