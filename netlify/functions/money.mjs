// /api/money — private expense tracker (owner only).
import { moneyStore, isAuthed, json } from './_shared.mjs';
import { randomBytes } from 'node:crypto';

export const config = { path: '/api/money' };

const CATEGORIES = ['Food', 'Snacks & Tea', 'Transport', 'Mobile/Data', 'Subscriptions', 'Shopping', 'Bills', 'Rent', 'Education', 'Entertainment', 'Health', 'Travel', 'Gifts', 'Other'];

const today = () => new Date(Date.now()).toISOString().slice(0, 10);

export default async (req) => {
  if (!(await isAuthed(req))) return json({ error: 'unauthorized' }, 401);
  const store = moneyStore();

  if (req.method === 'GET') {
    const { blobs } = await store.list();
    const transactions = [];
    for (const b of blobs) {
      const v = await store.get(b.key, { type: 'json' });
      if (v && v.type !== 'income') transactions.push({ id: b.key, ...v }); // income hidden (expense-only tracker)
    }
    transactions.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));
    return json({ transactions, categories: CATEGORIES });
  }

  if (req.method === 'POST') {
    let body = {}; try { body = await req.json(); } catch {}
    const amount = Math.round(Number(body.amount) * 100) / 100;
    if (!(amount > 0)) return json({ error: 'Enter a valid amount.' }, 400);
    const category = String(body.category || 'Other').slice(0, 40);
    const note = String(body.note || '').trim().slice(0, 140);
    let date = String(body.date || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = today();
    const id = randomBytes(6).toString('hex');
    const rec = { type: 'expense', amount, category, note, date, createdAt: Date.now() };
    await store.setJSON(id, rec);
    return json({ ok: true, transaction: { id, ...rec } });
  }

  if (req.method === 'DELETE') {
    let body = {}; try { body = await req.json(); } catch {}
    if (body.id) await store.delete(String(body.id));
    return json({ ok: true });
  }

  return json({ error: 'method' }, 405);
};
