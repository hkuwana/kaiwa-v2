import { json } from '@sveltejs/kit';
import { ProductUpdatesEmailService } from '$lib/emails/campaigns/product-updates/update.service';
import { THIS_WEEKS_EMAIL } from '$lib/emails/campaigns/product-updates/superhuman-template';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/logger';

/**
 * Send Superhuman-style weekly update
 *
 * Quick and easy way to send your weekly email:
 * 1. Edit src/lib/emails/campaigns/product-updates/superhuman-template.ts
 * 2. POST to this endpoint
 * 3. Done!
 *
 * Usage:
 *   curl -X POST http://localhost:5173/api/admin/send-superhuman-update \
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
			logger.warn('Unauthorized attempt to send superhuman update');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Optional: Accept custom content in request body
		const body = await request.json().catch(() => ({}));
		const content = body.content || THIS_WEEKS_EMAIL;

		logger.info('Sending Superhuman-style weekly update...');

		// Send the email
		const result = await ProductUpdatesEmailService.sendSuperhumanStyleUpdate(content);

		return json({
			success: true,
			message: `Weekly update sent to ${result.sent} users`,
			stats: result
		});
	} catch (error) {
		logger.error('Error sending superhuman update:', error);
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
 * GET /api/admin/send-superhuman-update?preview=true
 */
export async function GET({ url }) {
	const preview = url.searchParams.get('preview');

	if (preview === 'true') {
		const { generateSuperhumanEmail } = await import(
			'$lib/emails/campaigns/product-updates/superhuman-template'
		);

		const html = generateSuperhumanEmail(THIS_WEEKS_EMAIL, 'there');

		return new Response(html, {
			headers: { 'Content-Type': 'text/html' }
		});
	}

	return json({
		message: 'Add ?preview=true to see the email HTML',
		endpoints: {
			preview: '/api/admin/send-superhuman-update?preview=true',
			send: 'POST /api/admin/send-superhuman-update'
		}
	});
}
