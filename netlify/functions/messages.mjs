// /api/messages — owner inbox: list + delete contact submissions.
import { msgsStore, isAuthed, json } from './_shared.mjs';

export const config = { path: '/api/messages' };

export default async (req) => {
  if (!(await isAuthed(req))) return json({ error: 'unauthorized' }, 401);
  const store = msgsStore();

  if (req.method === 'GET') {
    const { blobs } = await store.list();
    const messages = [];
    for (const b of blobs) {
      const v = await store.get(b.key, { type: 'json' });
      if (v) messages.push({ id: b.key, ...v });
    }
    messages.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return json({ messages });
  }

  if (req.method === 'DELETE') {
    let body = {}; try { body = await req.json(); } catch {}
    if (body.id) await store.delete(String(body.id));
    return json({ ok: true });
  }

  return json({ error: 'method' }, 405);
};
