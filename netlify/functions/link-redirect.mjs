// /go/* — public redirect for short links (counts clicks).
import { linksStore } from './_shared.mjs';

export const config = { path: '/go/*' };

export default async (req) => {
  const path = new URL(req.url).pathname;
  const slug = decodeURIComponent(path.replace(/^\/go\//, '').replace(/\/+$/, '')).toLowerCase();
  if (!slug) return new Response('Missing link.', { status: 404 });

  const store = linksStore();
  const rec = await store.get(slug, { type: 'json' });
  if (!rec) {
    const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Link not found</title>
<body style="font-family:system-ui,sans-serif;background:#0d0a08;color:#f7efe6;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px">
<div><h1 style="color:#ff9d4d;font-size:1.6rem">Link not found</h1>
<p style="opacity:.7">“${slug.replace(/[<>&]/g, '')}” doesn’t point anywhere (yet).</p>
<a href="/" style="color:#ff9d4d">← sandeshpandey.info.np</a></div></body>`;
    return new Response(html, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }

  try { rec.clicks = (rec.clicks || 0) + 1; rec.lastClick = Date.now(); await store.setJSON(slug, rec); } catch {}
  return new Response(null, { status: 302, headers: { location: rec.url, 'cache-control': 'no-store' } });
};
