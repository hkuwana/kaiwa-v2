import { json } from '@sveltejs/kit';
import { ProductUpdatesEmailService } from '$lib/emails/campaigns/product-updates/update.service';
import { THIS_WEEKS_EMAIL } from '$lib/emails/campaigns/product-updates/weekly-update-template';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/logger';

/**
 * Send weekly product update email
 *
 * Quick and easy way to send your weekly email:
 * 1. Edit src/lib/emails/campaigns/product-updates/weekly-update-template.ts
 * 2. POST to this endpoint
 * 3. Done!
 *
 * Usage:
 *   curl -X POST http://localhost:5173/api/admin/send-weekly-update \
 *     -H "Authorization: Bearer YOUR_ADMIN_SECRET"
 *
 * Or from the dashboard: /dev/email
 */
export async function POST({ request }) {
	try {
		// Verify admin access
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${env.ADMIN_SECRET || env.CRON_SECRET || 'development_secret'}`;

		if (authHeader !== expectedAuth) {
			logger.warn('Unauthorized attempt to send weekly update');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Optional: Accept custom content in request body
		const body = await request.json().catch(() => ({}));
		const content = body.content || THIS_WEEKS_EMAIL;

		logger.info('Sending weekly product update...');

		// Send the email
		const result = await ProductUpdatesEmailService.sendWeeklyUpdate(content);

		return json({
			success: true,
			message: `Weekly update sent to ${result.sent} users`,
			stats: result
		});
	} catch (error) {
		logger.error('Error sending weekly update:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}

/**
 * Preview the current week's email
 *
 * GET /api/admin/send-weekly-update?preview=true
 */
export async function GET({ url }) {
	const preview = url.searchParams.get('preview');

	if (preview === 'true') {
		const { generateKaiwaEmail } = await import('$lib/emails/shared/base-template');

		const html = generateKaiwaEmail(THIS_WEEKS_EMAIL, 'there');

		return new Response(html, {
			headers: { 'Content-Type': 'text/html' }
		});
	}

	return json({
		message: 'Add ?preview=true to see the email HTML',
		endpoints: {
			preview: '/api/admin/send-weekly-update?preview=true',
			send: 'POST /api/admin/send-weekly-update'
		}
	});
}
