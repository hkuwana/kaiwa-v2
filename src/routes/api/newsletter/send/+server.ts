import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { newsletterService } from '$lib/server/services/newsletter.service';

export const POST: RequestHandler = async ({ request, url }) => {
  try {
    const body = await request.json();
    const preview = url.searchParams.get('preview') === '1' || body.preview;

    const subject = String(body.subject || '').trim();
    if (!subject) return json({ ok: false, error: 'Subject required' }, { status: 400 });

    const html = await newsletterService.composeHtml({
      subject,
      introHtml: body.introHtml || '',
      includeBlog: !!body.includeBlog,
      includeYouTube: !!body.includeYouTube,
      youtubeChannelId: body.youtubeChannelId || '',
      contact: body.contact || {}
    });

    if (preview) return json({ ok: true, html });

    const token = request.headers.get('x-newsletter-token') || body.adminToken;
    if (!env.NEWSLETTER_ADMIN_TOKEN || token !== env.NEWSLETTER_ADMIN_TOKEN) {
      return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await newsletterService.sendToAll(subject, html, body?.contact?.replyToEmail);
    return json({ ok: true, result });
  } catch (e) {
    console.error('newsletter send error', e);
    return json({ ok: false, error: 'Server error' }, { status: 500 });
  }
};

