import { json, error as svelteKitError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCampaignById } from '$lib/emails/email-campaigns.config';

// Import all campaign services for preview
import { EmailReminderService } from '$lib/emails/campaigns/reminders/reminder.service';
import { FounderEmailService } from '$lib/emails/campaigns/founder-sequence/founder.service';
import { WeeklyUpdatesEmailService } from '$lib/emails/campaigns/weekly-digest/digest.service';
import { WeeklyStatsEmailService } from '$lib/emails/campaigns/weekly-stats/stats.service';
import { ScenarioInspirationEmailService } from '$lib/emails/campaigns/scenario-inspiration/inspiration.service';
import { CommunityStoryEmailService } from '$lib/emails/campaigns/community-stories/story.service';
import { ProductUpdatesEmailService } from '$lib/emails/campaigns/product-updates/update.service';
import { ProgressReportsEmailService } from '$lib/emails/campaigns/progress-reports/progress.service';

/**
 * GET /api/dev/email-dashboard/preview/[campaignId]
 *
 * Returns a preview of the email for a given campaign using sample data
 */
export const GET: RequestHandler = async ({ params }) => {
	const { campaignId } = params;
	const campaign = getCampaignById(campaignId);

	if (!campaign) {
		throw svelteKitError(404, 'Campaign not found');
	}

	try {
		let html = '';
		let subject = '';

		// Generate preview based on campaign type
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
						},
						{
							title: 'Bug fixes and improvements',
							description: 'Fixed audio playback issues and improved mobile UI',
							emoji: '🐛',
							category: 'fix' as const
						}
					],
					cta: {
						text: 'Try the new scenarios',
						url: 'https://trykaiwa.com/scenarios'
					},
					userId: 'preview-user-id',
					userFirstName: 'Sample User'
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
				throw svelteKitError(400, 'Campaign preview not implemented');
		}

		return json({
			campaign: campaign.name,
			subject,
			html
		});
	} catch (error) {
		console.error(`Error generating preview for ${campaignId}:`, error);
		return json(
			{
				error: `Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`
			},
			{ status: 500 }
		);
	}
};
