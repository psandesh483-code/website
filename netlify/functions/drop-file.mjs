// /d/* — PUBLIC serve for a dropped file/note/link (respects expiry). No login needed.
import { dropsStore } from './_shared.mjs';

export const config = { path: '/d/*' };

function gone() {
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Expired or not found</title>
<body style="font-family:system-ui,sans-serif;background:#0d0a08;color:#f7efe6;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px">
<div><h1 style="color:#ff9d4d;font-size:1.6rem">Gone</h1>
<p style="opacity:.7">This file has expired or doesn’t exist.</p>
<a href="/files" style="color:#ff9d4d">See available files →</a></div></body>`;
  return new Response(html, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export default async (req) => {
  const id = decodeURIComponent(new URL(req.url).pathname.replace(/^\/d\//, '').replace(/\/+$/, ''));
  if (!id) return gone();

  const store = dropsStore();
  const res = await store.getWithMetadata(id, { type: 'arrayBuffer' });
  if (!res) return gone();

  const m = res.metadata || {};
  if (m.expiresAt && Date.now() > m.expiresAt) { try { await store.delete(id); } catch {} return gone(); }

  if (m.kind === 'file') {
    const dl = new URL(req.url).searchParams.has('dl');
    const safeName = String(m.name || 'file').replace(/["\\\r\n]/g, '');
    return new Response(res.data, {
      status: 200,
      headers: {
        'content-type': m.contentType || 'application/octet-stream',
        'content-disposition': (dl ? 'attachment' : 'inline') + '; filename="' + safeName + '"',
        'cache-control': 'no-store',
      },
    });
  }

  if (m.kind === 'link') {
    const url = Buffer.from(res.data).toString('utf-8');
    return new Response(null, { status: 302, headers: { location: url, 'cache-control': 'no-store' } });
  }

  return new Response(Buffer.from(res.data).toString('utf-8'), { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
};
