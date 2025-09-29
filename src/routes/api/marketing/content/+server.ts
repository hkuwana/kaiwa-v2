import { json } from '@sveltejs/kit';
import { MarketingAutomationService } from '$lib/server/services/marketing-automation.service';

export const POST = async ({ request, locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const { platform, type } = await request.json();

		if (!platform || !type) {
			return json({ error: 'Platform and type are required' }, { status: 400 });
		}

		// Validate platform and type
		const availableTypes = MarketingAutomationService.getContentTypes(platform);
		if (!availableTypes.includes(type)) {
			return json(
				{
					error: 'Invalid type for platform',
					availableTypes
				},
				{ status: 400 }
			);
		}

		const content = MarketingAutomationService.generateContent(platform, type);

		return json({ success: true, content });
	} catch (error) {
		console.error('Error generating marketing content:', error);
		return json({ error: 'Failed to generate content' }, { status: 500 });
	}
};

export const GET = async ({ url, locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const platform = url.searchParams.get('platform');

		if (!platform) {
			return json({ error: 'Platform parameter is required' }, { status: 400 });
		}

		const contentTypes = MarketingAutomationService.getContentTypes(platform);

		return json({ success: true, contentTypes });
	} catch (error) {
		console.error('Error getting content types:', error);
		return json({ error: 'Failed to get content types' }, { status: 500 });
	}
};
