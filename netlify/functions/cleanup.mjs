// Scheduled daily cleanup — purge expired drops so storage stays tidy.
import { dropsStore } from './_shared.mjs';

export const config = { schedule: '@daily' };

export default async () => {
  const store = dropsStore();
  const { blobs } = await store.list();
  let purged = 0;
  for (const b of blobs) {
    const md = await store.getMetadata(b.key);
    if (md && md.metadata && md.metadata.expiresAt && Date.now() > md.metadata.expiresAt) {
      await store.delete(b.key);
      purged++;
    }
  }
  return new Response('purged ' + purged);
};
