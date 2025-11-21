import { logger } from '$lib/logger';
import { json } from '@sveltejs/kit';
import { ProductUpdatesEmailService } from '$lib/emails/campaigns/product-updates/update.service';
import { env } from '$env/dynamic/private';

/**
 * Cron endpoint for sending product update emails
 *
 * Sends product announcement emails to all users who have opted into product updates.
 * Called manually via POST with the update details.
 *
 * Usage:
 * curl -X POST \
 *   -H "Authorization: Bearer $CRON_SECRET" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "subject": "New Feature: AI-Powered Lesson Plans",
 *     "title": "We just launched AI Lesson Plans",
 *     "summary": "Customize your learning path with AI-generated lesson plans tailored to your goals.",
 *     "details": "<p>We've added a new feature that creates personalized lesson plans based on your language level and learning goals...</p>",
 *     "ctaText": "Try it now",
 *     "ctaUrl": "https://trykaiwa.com"
 *   }' \
 *   https://trykaiwa.com/api/cron/product-updates
 */
export const POST = async ({ request }) => {
	try {
		// Verify cron secret
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${env.CRON_SECRET || 'development_secret'}`;

		if (authHeader !== expectedAuth) {
			logger.info('❌ Unauthorized access attempt to product-updates endpoint');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// SAFETY: Prevent automatic email sending until manually reviewed
		const enableAutomatedEmails = env.ENABLE_AUTOMATED_EMAILS === 'true';
		if (!enableAutomatedEmails) {
			logger.info(
				'⚠️  SAFETY MODE: Automated emails disabled. Set ENABLE_AUTOMATED_EMAILS=true to enable.'
			);
			return json({
				success: false,
				message:
					'Automated emails are disabled for safety. Set ENABLE_AUTOMATED_EMAILS=true to enable.'
			});
		}

		const body = await request.json();

		const { subject, title, summary, details, ctaText, ctaUrl } = body;

		// Validate required fields
		if (!subject || !title || !summary || !details) {
			return json(
				{
					error: 'Missing required fields: subject, title, summary, details'
				},
				{ status: 400 }
			);
		}

		logger.info('📧 Sending product update emails...');

		const result = await ProductUpdatesEmailService.sendProductUpdate({
			subject,
			title,
			summary,
			details,
			ctaText,
			ctaUrl
		});

		logger.info(
			`✅ Product update sent: ${result.sent} emails, ${result.failed} failed, ${result.skipped} skipped`
		);

		return json({
			success: true,
			message: 'Product update emails sent',
			stats: result
		});
	} catch (error) {
		logger.error('Error in product-updates cron:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

/**
 * GET endpoint to trigger a test product update
 */
export const GET = async ({ request, url }) => {
	try {
		// Verify cron secret
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${env.CRON_SECRET || 'development_secret'}`;

		if (authHeader !== expectedAuth) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const dryRun = url.searchParams.get('dryRun') === 'true';

		if (dryRun) {
			return json({
				success: true,
				message: 'Dry run mode - no emails sent',
				info: 'Use POST endpoint with JSON body to send actual product update emails'
			});
		}

		return json({
			success: false,
			error: 'Use POST endpoint to send product update emails',
			example: {
				method: 'POST',
				headers: {
					Authorization: 'Bearer $CRON_SECRET',
					'Content-Type': 'application/json'
				},
				body: {
					subject: 'New Feature: AI-Powered Lesson Plans',
					title: 'We just launched AI Lesson Plans',
					summary: 'Customize your learning path with AI-generated lesson plans.',
					details: 'Details about the feature...',
					ctaText: 'Try it now',
					ctaUrl: 'https://trykaiwa.com'
				}
			}
		});
	} catch (error) {
		logger.error('Error in product-updates cron GET:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
