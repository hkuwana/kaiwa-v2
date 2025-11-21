import { json, error as svelteKitError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCampaignById } from '$lib/emails/email-campaigns.config';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

const resend = new Resend(env.RESEND_API_KEY);

// Import all campaign services
import { EmailReminderService } from '$lib/emails/campaigns/reminders/reminder.service';
import { FounderEmailService } from '$lib/emails/campaigns/founder-sequence/founder.service';
import { WeeklyUpdatesEmailService } from '$lib/emails/campaigns/weekly-digest/digest.service';
import { WeeklyStatsEmailService } from '$lib/emails/campaigns/weekly-stats/stats.service';
import { ScenarioInspirationEmailService } from '$lib/emails/campaigns/scenario-inspiration/inspiration.service';
import { CommunityStoryEmailService } from '$lib/emails/campaigns/community-stories/story.service';
import { ProductUpdatesEmailService } from '$lib/emails/campaigns/product-updates/update.service';
import { ProgressReportsEmailService } from '$lib/emails/campaigns/progress-reports/progress.service';

/**
 * POST /api/dev/email-dashboard/test
 *
 * Sends a test email for a given campaign to a specified email address
 *
 * Body: { campaignId: string, testEmail: string, dryRun?: boolean }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { campaignId, testEmail, dryRun = false } = await request.json();

		if (!campaignId || !testEmail) {
			throw svelteKitError(400, 'Missing required fields: campaignId and testEmail');
		}

		const campaign = getCampaignById(campaignId);
		if (!campaign) {
			throw svelteKitError(404, 'Campaign not found');
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(testEmail)) {
			throw svelteKitError(400, 'Invalid email format');
		}

		// Generate email content based on campaign
		let html = '';
		let subject = '';

		switch (campaignId) {
			case 'practice-reminders':
				html = await EmailReminderService.generatePreviewEmail();
				subject = 'Time to practice! 🎯';
				break;

			case 'founder-sequence':
				html = await FounderEmailService.generatePreviewEmail();
				subject = 'Welcome to Kaiwa!';
				break;

			case 'weekly-digest':
				const digestOptions = {
					subject: 'Kaiwa Weekly Update – Product improvements & next steps',
					intro: `Here's the latest from builders HQ. If something feels off or you want to see something different, just reply.`,
					updates: [
						{
							title: 'Faster conversation loading',
							description: 'Conversations now load 3x faster with improved caching',
							emoji: '⚡',
							category: 'performance' as const
						},
						{
							title: 'New scenario: Meeting Parents',
							description: 'Practice introducing yourself to your partner's parents',
							emoji: '👨‍👩‍👧‍👦',
							category: 'feature' as const
						}
					],
					cta: {
						text: 'Try the new scenarios',
						url: 'https://trykaiwa.com/scenarios'
					},
					userId: 'test-user',
					userFirstName: 'Test User'
				};
				html = await WeeklyUpdatesEmailService.generateEmailHTML(digestOptions);
				subject = digestOptions.subject;
				break;

			case 'weekly-stats':
				html = await WeeklyStatsEmailService.generatePreviewEmail();
				subject = 'Your weekly progress in Kaiwa';
				break;

			case 'scenario-inspiration':
				html = await ScenarioInspirationEmailService.generatePreviewEmail();
				subject = 'New scenario suggestion just for you';
				break;

			case 'community-stories':
				html = await CommunityStoryEmailService.generatePreviewEmail();
				subject = 'Community success story';
				break;

			case 'product-updates':
				html = await ProductUpdatesEmailService.generatePreviewEmail();
				subject = 'New product update';
				break;

			case 'progress-reports':
				html = await ProgressReportsEmailService.generatePreviewEmail();
				subject = 'Your monthly progress report';
				break;

			default:
				throw svelteKitError(400, 'Campaign test send not implemented');
		}

		// Dry run mode: return what would be sent without actually sending
		if (dryRun) {
			return json({
				dryRun: true,
				campaign: campaign.name,
				to: testEmail,
				subject,
				preview: html.substring(0, 200) + '...'
			});
		}

		// Send actual email
		const result = await resend.emails.send({
			from: 'Kaiwa <noreply@trykaiwa.com>',
			to: [testEmail],
			subject: `[TEST] ${subject}`,
			html
		});

		if (result.error) {
			console.error('Failed to send test email:', result.error);
			return json(
				{
					error: 'Failed to send email',
					details: result.error
				},
				{ status: 500 }
			);
		}

		return json({
			success: true,
			campaign: campaign.name,
			to: testEmail,
			subject,
			emailId: result.data?.id
		});
	} catch (error) {
		console.error('Error sending test email:', error);

		if (error instanceof Error && 'status' in error) {
			throw error; // Re-throw SvelteKit errors
		}

		return json(
			{
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
