// /d/* — serve a dropped file/note/link. Private: requires the owner session.
import { dropsStore, isAuthed } from './_shared.mjs';

export const config = { path: '/d/*' };

export default async (req) => {
  if (!(await isAuthed(req))) {
    return new Response('Please log in at /admin on this device to open this.', {
      status: 401,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const id = decodeURIComponent(new URL(req.url).pathname.replace(/^\/d\//, '').replace(/\/+$/, ''));
  if (!id) return new Response('Not found', { status: 404 });

  const store = dropsStore();
  const res = await store.getWithMetadata(id, { type: 'arrayBuffer' });
  if (!res) return new Response('Not found', { status: 404 });

  const meta = res.metadata || {};
  if (meta.kind === 'file') {
    const dl = new URL(req.url).searchParams.has('dl');
    const safeName = String(meta.name || 'file').replace(/["\\\r\n]/g, '');
    return new Response(res.data, {
      status: 200,
      headers: {
        'content-type': meta.contentType || 'application/octet-stream',
        'content-disposition': (dl ? 'attachment' : 'inline') + '; filename="' + safeName + '"',
        'cache-control': 'no-store',
      },
    });
  }

  const text = Buffer.from(res.data).toString('utf-8');
  return new Response(text, { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
};
