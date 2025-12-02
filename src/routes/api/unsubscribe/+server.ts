import { json } from '@sveltejs/kit';
import { userSettingsRepository } from '$lib/server/repositories/user-settings.repository';
import type { NewUserSettings } from '$lib/server/db/types';

function getUnsubscribeUpdates(
	type: string
): Partial<NewUserSettings> | null {
	if (type === 'marketing') return { receiveMarketingEmails: false };
	if (type === 'daily_reminder') return { receiveDailyReminderEmails: false };
	if (type === 'product_updates') return { receiveProductUpdates: false };
	if (type === 'weekly_digest') return { receiveWeeklyDigest: false };
	if (type === 'security_alerts') return { receiveSecurityAlerts: false };
	if (type === 'all') {
		return {
			receiveMarketingEmails: false,
			receiveDailyReminderEmails: false,
			receiveProductUpdates: false,
			receiveWeeklyDigest: false,
			receiveSecurityAlerts: false
		};
	}
	return null;
}

export const GET = async ({ url }) => {
	try {
		const userId = url.searchParams.get('userId');
		const type = url.searchParams.get('type') || 'all';

		if (!userId) {
			return json({ error: 'Missing userId parameter' }, { status: 400 });
		}

		const updateField = getUnsubscribeUpdates(type);

		if (!updateField) {
			return json(
				{
					error:
						'Invalid unsubscribe type. Use: marketing, daily_reminder, product_updates, weekly_digest, security_alerts, or all'
				},
				{ status: 400 }
			);
		}

		await userSettingsRepository.upsertSettings({
			userId,
			...updateField
		});

		return json({ success: true, message: 'You have been successfully unsubscribed.' });
	} catch (error) {
		console.error('Unsubscribe error:', error);
		return json({ error: 'Failed to process unsubscribe request.' }, { status: 500 });
	}
};

export const POST = async ({ request }) => {
	try {
		const { userId, type } = await request.json();

		if (!userId || !type) {
			return json({ error: 'Missing userId or type' }, { status: 400 });
		}

		const updateField = getUnsubscribeUpdates(type);

		if (!updateField) {
			return json(
				{
					error:
						'Invalid unsubscribe type. Use: marketing, daily_reminder, product_updates, weekly_digest, security_alerts, or all'
				},
				{ status: 400 }
			);
		}

		await userSettingsRepository.upsertSettings({
			userId,
			...updateField
		});

		return json({ success: true, message: 'Successfully unsubscribed.' });
	} catch (error) {
		console.error('Unsubscribe error:', error);
		return json({ error: 'Failed to process unsubscribe request.' }, { status: 500 });
	}
};
