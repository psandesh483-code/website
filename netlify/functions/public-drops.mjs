// /api/public-drops — PUBLIC listing for the /files page (non-expired items only).
import { dropsStore, json } from './_shared.mjs';

export const config = { path: '/api/public-drops' };

export default async () => {
  const store = dropsStore();
  const { blobs } = await store.list();
  const items = [];
  for (const b of blobs) {
    const md = await store.getMetadata(b.key);
    if (!md || !md.metadata) continue;
    const m = md.metadata;
    if (m.expiresAt && Date.now() > m.expiresAt) { await store.delete(b.key); continue; }
    const base = { id: b.key, kind: m.kind, createdAt: m.createdAt, expiresAt: m.expiresAt };
    if (m.kind === 'file') items.push({ ...base, name: m.name, size: m.size });
    else if (m.kind === 'link') items.push({ ...base, title: m.title, url: m.preview });
    else items.push({ ...base, title: m.title, text: m.preview });
  }
  items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return json({ items });
};
