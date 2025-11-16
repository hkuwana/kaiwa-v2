import { logger } from '$lib/server/logger';
import { json } from '@sveltejs/kit';
import { analysisQuotaService } from '$lib/server/services/analysis-quota.service';

export const GET = async ({ locals }) => {
	try {
		// Check if user is authenticated
		if (!locals.user || !locals.session) {
			return json({
				canAnalyze: true, // Guest users can analyze (will be handled by onboarding flow)
				message: 'Guest analysis allowed'
			});
		}

		const userId = locals.user.id;
		const quotaStatus = await analysisQuotaService.getAnalysisQuotaStatus(userId);

		return json({
			canAnalyze: quotaStatus.canAnalyze,
			remainingAnalyses: quotaStatus.remainingAnalyses,
			resetTime: quotaStatus.resetTime,
			resetType: quotaStatus.resetType,
			tier: quotaStatus.tier,
			quotaExceeded: quotaStatus.quotaExceeded,
			upgradeRequired: quotaStatus.upgradeRequired,
			error: quotaStatus.quotaExceeded
				? quotaStatus.upgradeRequired
					? 'Daily analysis limit reached. Upgrade to get more analyses!'
					: 'Monthly analysis limit reached. Your quota will reset soon.'
				: null
		});
	} catch (error) {
		logger.error('Error checking analysis quota:', error);

		return json(
			{
				canAnalyze: false,
				error: 'Unable to check analysis quota. Please try again.'
			},
			{ status: 500 }
		);
	}
};
