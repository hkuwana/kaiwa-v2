import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { newsletterService } from '$lib/server/services/newsletter.service';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || '').toString().trim().toLowerCase();
    const name = (body.name || '').toString().trim();
    const source = (body.source || '').toString().trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ ok: false, error: 'Invalid email' }, { status: 400 });
    }
    const res = await newsletterService.subscribe(email, name || undefined, source || undefined);
    return json({ ok: true, subscribed: !!res });
  } catch (e) {
    console.error('newsletter subscribe error', e);
    return json({ ok: false, error: 'Server error' }, { status: 500 });
  }
};

