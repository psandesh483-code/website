// /api/hub — link-in-bio data. GET is public; PUT/POST (save) requires the owner.
import { hubStore, isAuthed, json } from './_shared.mjs';

export const config = { path: '/api/hub' };

const DEFAULT = {
  profile: { tagline: 'Marketing · Strategy · Growth — Founder @ Kranti' },
  links: [
    { id: 'portfolio', title: 'Portfolio', url: 'https://sandeshpandey.info.np', emoji: '🌐' },
    { id: 'kranti', title: 'Kranti on YouTube', url: 'https://www.youtube.com/@Kraaanti', emoji: '▶️' },
    { id: 'linkedin', title: 'LinkedIn', url: 'https://www.linkedin.com/in/sandeyverse/', emoji: '💼' },
    { id: 'instagram', title: 'Instagram', url: 'https://www.instagram.com/sandeyverse/', emoji: '📸' },
    { id: 'email', title: 'Email me', url: 'mailto:official.sandeshpandey@gmail.com', emoji: '✉️' },
  ],
};

const normalizeUrl = (u) => (!u ? '' : /^(https?:|mailto:|tel:)/i.test(u) ? u : 'https://' + u);

export default async (req) => {
  const store = hubStore();

  if (req.method === 'GET') {
    const data = await store.get('data', { type: 'json' });
    return json(data || DEFAULT);
  }

  if (!(await isAuthed(req))) return json({ error: 'unauthorized' }, 401);

  if (req.method === 'PUT' || req.method === 'POST') {
    let body = {}; try { body = await req.json(); } catch {}
    const tagline = String(body?.profile?.tagline || '').slice(0, 200);
    const links = Array.isArray(body.links)
      ? body.links.slice(0, 30).map((l, i) => ({
          id: String(l.id || ('l' + i)).slice(0, 40),
          title: String(l.title || '').trim().slice(0, 80),
          url: normalizeUrl(String(l.url || '').trim()),
          emoji: String(l.emoji || '').slice(0, 8),
        })).filter((l) => l.title && l.url)
      : [];
    await store.setJSON('data', { profile: { tagline }, links });
    return json({ ok: true });
  }

  return json({ error: 'method' }, 405);
};
