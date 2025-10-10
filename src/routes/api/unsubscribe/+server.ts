import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async ({ url }) => {
	try {
		const userId = url.searchParams.get('userId');
		const type = url.searchParams.get('type') || 'all';

		if (!userId) {
			return json({ error: 'Missing userId parameter' }, { status: 400 });
		}

		let updateField: Partial<typeof userSettings.$inferInsert>;

		if (type === 'marketing') {
			updateField = { receiveMarketingEmails: false };
		} else if (type === 'daily_reminder') {
			updateField = { receiveDailyReminderEmails: false };
		} else if (type === 'product_updates') {
			updateField = { receiveProductUpdates: false };
		} else if (type === 'weekly_digest') {
			updateField = { receiveWeeklyDigest: false };
		} else if (type === 'security_alerts') {
			updateField = { receiveSecurityAlerts: false };
		} else if (type === 'all') {
			updateField = { 
				receiveMarketingEmails: false,
				receiveDailyReminderEmails: false,
				receiveProductUpdates: false,
				receiveWeeklyDigest: false,
				receiveSecurityAlerts: false
			};
		} else {
			return json({ error: 'Invalid unsubscribe type. Use: marketing, daily_reminder, product_updates, weekly_digest, security_alerts, or all' }, { status: 400 });
		}

		await db.update(userSettings).set(updateField).where(eq(userSettings.userId, userId));

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

		let updateField: Partial<typeof userSettings.$inferInsert>;

		if (type === 'marketing') {
			updateField = { receiveMarketingEmails: false };
		} else if (type === 'daily_reminder') {
			updateField = { receiveDailyReminderEmails: false };
		} else if (type === 'product_updates') {
			updateField = { receiveProductUpdates: false };
		} else if (type === 'weekly_digest') {
			updateField = { receiveWeeklyDigest: false };
		} else if (type === 'security_alerts') {
			updateField = { receiveSecurityAlerts: false };
		} else if (type === 'all') {
			updateField = { 
				receiveMarketingEmails: false,
				receiveDailyReminderEmails: false,
				receiveProductUpdates: false,
				receiveWeeklyDigest: false,
				receiveSecurityAlerts: false
			};
		} else {
			return json({ error: 'Invalid unsubscribe type. Use: marketing, daily_reminder, product_updates, weekly_digest, security_alerts, or all' }, { status: 400 });
		}

		await db.update(userSettings).set(updateField).where(eq(userSettings.userId, userId));

		return json({ success: true, message: 'Successfully unsubscribed.' });
	} catch (error) {
		console.error('Unsubscribe error:', error);
		return json({ error: 'Failed to process unsubscribe request.' }, { status: 500 });
	}
};
