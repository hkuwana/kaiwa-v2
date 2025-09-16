import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { analysisQuotaService } from '$lib/server/services/analysis-quota.service';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { userId: requestUserId } = await request.json();

		// Use authenticated user ID if available, otherwise use the provided userId
		const userId = locals.user?.id || requestUserId;

		if (!userId) {
			return json(
				{ error: 'User authentication required' },
				{ status: 401 }
			);
		}

		// Record analysis usage
		await analysisQuotaService.recordAnalysisUsage(userId);

		return json({
			success: true,
			message: 'Analysis usage recorded successfully'
		});
	} catch (error) {
		console.error('Failed to record analysis usage:', error);
		return json(
			{ error: 'Failed to record analysis usage' },
			{ status: 500 }
		);
	}
};