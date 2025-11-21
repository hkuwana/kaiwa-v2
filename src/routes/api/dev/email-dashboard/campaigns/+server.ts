import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { EMAIL_CAMPAIGNS } from '$lib/emails/email-campaigns.config';
import { parseExpression } from 'cron-parser';

/**
 * GET /api/dev/email-dashboard/campaigns
 *
 * Returns list of all email campaigns with next send times
 */
export const GET: RequestHandler = async () => {
	try {
		// Calculate next send time for each campaign
		const campaignsWithNextSend = EMAIL_CAMPAIGNS.map((campaign) => {
			let nextSendTime: Date | null = null;

			if (campaign.schedule && campaign.status === 'active') {
				try {
					const interval = parseExpression(campaign.schedule, {
						currentDate: new Date(),
						utc: true
					});
					nextSendTime = interval.next().toDate();
				} catch (error) {
					console.error(`Failed to parse cron for ${campaign.id}:`, error);
				}
			}

			return {
				...campaign,
				nextSendTime
			};
		});

		return json({
			campaigns: campaignsWithNextSend,
			count: campaignsWithNextSend.length
		});
	} catch (error) {
		console.error('Error fetching campaigns:', error);
		return json(
			{
				error: 'Failed to fetch campaigns'
			},
			{ status: 500 }
		);
	}
};
