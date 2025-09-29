import { json } from '@sveltejs/kit';
import { MarketingAutomationService } from '$lib/server/services/marketing-automation.service';

export const GET = async ({ locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const phrases = MarketingAutomationService.getJapanesePhrases();

		return json({ success: true, phrases });
	} catch (error) {
		console.error('Error getting Japanese phrases:', error);
		return json({ error: 'Failed to get Japanese phrases' }, { status: 500 });
	}
};
