import { logger } from '$lib/logger';
import { json } from '@sveltejs/kit';
import { analysisQuotaService } from '$lib/server/services/analysis-quota.service';
import { userUsageRepository } from '$lib/server/repositories/user-usage.repository';

export const POST = async ({ request, locals }) => {
	try {
		const { userId: requestUserId, analysisType = 'basic' } = await request.json();

		// Use authenticated user ID if available, otherwise use the provided userId
		const userId = locals.user?.id || requestUserId;

		if (!userId) {
			return json({ error: 'User authentication required' }, { status: 401 });
		}

		// Record usage in existing system (maintains compatibility)
		await analysisQuotaService.recordAnalysisUsage(userId);

		// Map analysis type to schema field and increment
		const updates: Record<string, number> = { analysesUsed: 1 };

		switch (analysisType) {
			case 'basic':
				updates.basicAnalysesUsed = 1;
				break;
			case 'advanced-grammar':
				updates.advancedGrammarUsed = 1;
				break;
			case 'fluency-analysis':
				updates.fluencyAnalysisUsed = 1;
				break;
			case 'onboarding-profile':
				updates.onboardingProfileUsed = 1;
				break;
			case 'pronunciation-analysis':
				updates.pronunciationAnalysisUsed = 1;
				break;
			case 'speech-rhythm':
				updates.speechRhythmUsed = 1;
				break;
			default:
				// For unknown types, just increment basic
				updates.basicAnalysesUsed = 1;
		}

		// Update usage in database
		const updatedUsage = await userUsageRepository.incrementUsage(userId, updates);

		if (!updatedUsage) {
			return json({ error: 'Failed to update usage' }, { status: 500 });
		}

		return json({
			success: true,
			message: 'Analysis usage recorded successfully',
			usage: {
				totalUsed: updatedUsage.analysesUsed,
				basicUsed: updatedUsage.basicAnalysesUsed,
				advancedGrammarUsed: updatedUsage.advancedGrammarUsed,
				fluencyAnalysisUsed: updatedUsage.fluencyAnalysisUsed,
				onboardingProfileUsed: updatedUsage.onboardingProfileUsed,
				pronunciationAnalysisUsed: updatedUsage.pronunciationAnalysisUsed,
				speechRhythmUsed: updatedUsage.speechRhythmUsed
			}
		});
	} catch (error) {
		logger.error('Failed to record analysis usage:', error);
		return json({ error: 'Failed to record analysis usage' }, { status: 500 });
	}
};
