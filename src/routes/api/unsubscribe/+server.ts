import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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
		} else {
			return json({ error: 'Invalid unsubscribe type' }, { status: 400 });
		}

		await db.update(userSettings).set(updateField).where(eq(userSettings.userId, userId));

		return json({ success: true, message: 'Successfully unsubscribed.' });
	} catch (error) {
		console.error('Unsubscribe error:', error);
		return json({ error: 'Failed to process unsubscribe request.' }, { status: 500 });
	}
};
