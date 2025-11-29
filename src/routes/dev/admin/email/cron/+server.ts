import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const POST = async ({ locals, fetch }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const secret = env.CRON_SECRET || 'development_secret';

		const response = await fetch(`/api/cron/send-reminders?dryRun=true`, {
			method: 'GET',
			headers: {
				authorization: `Bearer ${secret}`
			}
		});

		const data = await response.json();

		if (!response.ok) {
			return json(
				{
					error: 'Failed to run cron dry run',
					details: data?.error || data
				},
				{ status: response.status }
			);
		}

		return json({
			success: true,
			stats: data.stats
		});
	} catch (error) {
		console.error('Error running cron dry run:', error);
		return json(
			{
				error: 'Failed to run cron dry run',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
