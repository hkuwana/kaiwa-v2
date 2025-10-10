import { json } from '@sveltejs/kit';
import { usageService } from '$lib/server/services/usage.service';
import { getUserCurrentTier } from '$lib/server/services/payment.service';

// Simplified MVP approach: monthly limits only
const ANALYSIS_LIMITS = {
	free: {
		basic: 50,
		'advanced-grammar': 10,
		'fluency-analysis': 5,
		'onboarding-profile': 1,
		'pronunciation-analysis': 3,
		'speech-rhythm': 3
	},
	pro: {
		basic: 500,
		'advanced-grammar': 100,
		'fluency-analysis': 50,
		'onboarding-profile': 5,
		'pronunciation-analysis': 25,
		'speech-rhythm': 25
	},
	premium: {
		basic: 2000,
		'advanced-grammar': 500,
		'fluency-analysis': 200,
		'onboarding-profile': 20,
		'pronunciation-analysis': 100,
		'speech-rhythm': 100
	}
} as const;

export const POST = async ({ request }) => {
	try {
		const { userId, analysisType = 'basic' } = await request.json();

		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		// Get user tier and usage
		const [userTier, currentUsage] = await Promise.all([
			getUserCurrentTier(userId),
			usageService.getCurrentUsage(userId)
		]);

		// Get monthly usage for the specific analysis type
		let monthlyUsed = 0;
		switch (analysisType) {
			case 'basic':
				monthlyUsed = currentUsage.basicAnalysesUsed || 0;
				break;
			case 'advanced-grammar':
				monthlyUsed = currentUsage.advancedGrammarUsed || 0;
				break;
			case 'fluency-analysis':
				monthlyUsed = currentUsage.fluencyAnalysisUsed || 0;
				break;
			case 'onboarding-profile':
				monthlyUsed = currentUsage.onboardingProfileUsed || 0;
				break;
			case 'pronunciation-analysis':
				monthlyUsed = currentUsage.pronunciationAnalysisUsed || 0;
				break;
			case 'speech-rhythm':
				monthlyUsed = currentUsage.speechRhythmUsed || 0;
				break;
			default:
				monthlyUsed = currentUsage.basicAnalysesUsed || 0;
		}

		// Get limits for user tier
		const limits =
			ANALYSIS_LIMITS[userTier as keyof typeof ANALYSIS_LIMITS] || ANALYSIS_LIMITS.free;
		const monthlyLimit = limits[analysisType as keyof typeof limits] || limits['basic'];

		// Check if allowed
		const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);
		const allowed = monthlyUsed < monthlyLimit;

		let reason = '';
		if (!allowed) {
			reason = `Monthly limit reached (${monthlyLimit}). Resets next month or upgrade for more analyses.`;
		}

		// Upgrade recommendations
		const upgradeRecommendations: string[] = [];
		if (!allowed && userTier !== 'premium') {
			const nextTier = userTier === 'free' ? 'pro' : 'premium';
			upgradeRecommendations.push(`Upgrade to ${nextTier} for more ${analysisType} analyses`);
		}

		return json({
			allowed,
			reason,
			dailyRemaining: 0, // No daily limits in MVP
			monthlyRemaining,
			monthlyUsed,
			monthlyLimit,
			tier: userTier,
			upgradeRecommendations
		});
	} catch (error) {
		console.error('Error checking analysis usage:', error);
		return json({ error: 'Failed to check analysis usage' }, { status: 500 });
	}
};
