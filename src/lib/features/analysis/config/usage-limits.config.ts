export interface UsageLimits {
	daily: Record<string, number>;
	monthly: Record<string, number>;
	resetDays: number[]; // Days of month when monthly limits reset (e.g., [1] for 1st of month)
}

export interface TierLimits {
	free: UsageLimits;
	pro: UsageLimits;
	premium: UsageLimits;
}

// Usage limits by tier and analysis type
export const analysisUsageLimits: TierLimits = {
	free: {
		daily: {
			'quick-stats': 50, // Generous for basic features
			'grammar-suggestions': 20,
			'phrase-suggestions': 15,
			'onboarding-profile': 5,
			// Limited access to premium features
			'advanced-grammar': 3,
			'fluency-analysis': 2,
			'pronunciation-analysis': 1,
			'speech-rhythm': 1,
			'audio-suggestion': 10
		},
		monthly: {
			'quick-stats': 1000,
			'grammar-suggestions': 400,
			'phrase-suggestions': 300,
			'onboarding-profile': 100,
			// Give taste of premium features
			'advanced-grammar': 10,
			'fluency-analysis': 5,
			'pronunciation-analysis': 2,
			'speech-rhythm': 2,
			'audio-suggestion': 200
		},
		resetDays: [1] // Reset on 1st of each month
	},
	pro: {
		daily: {
			'quick-stats': 200,
			'grammar-suggestions': 100,
			'phrase-suggestions': 75,
			'onboarding-profile': 25,
			// Full access to pro features
			'advanced-grammar': 50,
			'fluency-analysis': 30,
			// Limited premium features
			'pronunciation-analysis': 5,
			'speech-rhythm': 5,
			'audio-suggestion': 50
		},
		monthly: {
			'quick-stats': 5000,
			'grammar-suggestions': 2000,
			'phrase-suggestions': 1500,
			'onboarding-profile': 500,
			'advanced-grammar': 1000,
			'fluency-analysis': 600,
			// Generous premium access
			'pronunciation-analysis': 100,
			'speech-rhythm': 100,
			'audio-suggestion': 1000
		},
		resetDays: [1]
	},
	premium: {
		daily: {
			// Effectively unlimited daily usage
			'quick-stats': 1000,
			'grammar-suggestions': 500,
			'phrase-suggestions': 400,
			'onboarding-profile': 100,
			'advanced-grammar': 200,
			'fluency-analysis': 150,
			'pronunciation-analysis': 100,
			'speech-rhythm': 100,
			'audio-suggestion': 200
		},
		monthly: {
			// Very high monthly limits
			'quick-stats': 20000,
			'grammar-suggestions': 10000,
			'phrase-suggestions': 8000,
			'onboarding-profile': 2000,
			'advanced-grammar': 5000,
			'fluency-analysis': 3000,
			'pronunciation-analysis': 2000,
			'speech-rhythm': 2000,
			'audio-suggestion': 5000
		},
		resetDays: [1]
	}
};

// Special limits for specific scenarios
export const specialLimits = {
	// New user grace period (first 7 days)
	newUser: {
		duration: 7, // days
		bonus: {
			'advanced-grammar': 5,
			'fluency-analysis': 3,
			'pronunciation-analysis': 2,
			'speech-rhythm': 2
		}
	},
	// Trial conversion incentive
	preConversion: {
		trigger: 0.8, // When user hits 80% of free tier limit
		bonus: {
			'advanced-grammar': 2,
			'fluency-analysis': 1
		}
	}
};

export function getUserTierLimits(userTier: 'free' | 'pro' | 'premium'): UsageLimits {
	return analysisUsageLimits[userTier];
}

export function getAnalysisLimit(
	userTier: 'free' | 'pro' | 'premium',
	analysisType: string,
	period: 'daily' | 'monthly'
): number {
	const limits = getUserTierLimits(userTier);
	return limits[period][analysisType] || 0;
}

export function isAnalysisAllowed(
	userTier: 'free' | 'pro' | 'premium',
	analysisType: string,
	currentUsage: { daily: number; monthly: number }
): {
	allowed: boolean;
	reason?: string;
	dailyRemaining: number;
	monthlyRemaining: number;
} {
	const limits = getUserTierLimits(userTier);

	const dailyLimit = limits.daily[analysisType] || 0;
	const monthlyLimit = limits.monthly[analysisType] || 0;

	const dailyRemaining = Math.max(0, dailyLimit - currentUsage.daily);
	const monthlyRemaining = Math.max(0, monthlyLimit - currentUsage.monthly);

	if (currentUsage.daily >= dailyLimit) {
		return {
			allowed: false,
			reason: `Daily limit reached (${dailyLimit}). Resets at midnight.`,
			dailyRemaining: 0,
			monthlyRemaining
		};
	}

	if (currentUsage.monthly >= monthlyLimit) {
		return {
			allowed: false,
			reason: `Monthly limit reached (${monthlyLimit}). Upgrade for more analyses.`,
			dailyRemaining,
			monthlyRemaining: 0
		};
	}

	return {
		allowed: true,
		dailyRemaining,
		monthlyRemaining
	};
}

// Helper to suggest upgrades based on usage patterns
export function getUpgradeRecommendation(
	currentTier: 'free' | 'pro',
	usagePatterns: Record<string, { daily: number; monthly: number }>
): {
	shouldRecommend: boolean;
	reason: string;
	targetTier: 'pro' | 'premium';
	benefits: string[];
} {
	const currentLimits = getUserTierLimits(currentTier);
	const nextTier = currentTier === 'free' ? 'pro' : 'premium';
	const nextLimits = getUserTierLimits(nextTier);

	let hitLimits: string[] = [];
	let benefits: string[] = [];

	Object.entries(usagePatterns).forEach(([analysisType, usage]) => {
		const currentMonthlyLimit = currentLimits.monthly[analysisType] || 0;
		const nextMonthlyLimit = nextLimits.monthly[analysisType] || 0;

		if (usage.monthly >= currentMonthlyLimit * 0.8) { // 80% threshold
			hitLimits.push(analysisType);
		}

		if (nextMonthlyLimit > currentMonthlyLimit) {
			const increase = nextMonthlyLimit - currentMonthlyLimit;
			benefits.push(`${increase} more ${analysisType.replace('-', ' ')} analyses`);
		}
	});

	return {
		shouldRecommend: hitLimits.length > 0,
		reason: hitLimits.length > 0
			? `You're approaching limits for: ${hitLimits.join(', ')}`
			: 'Usage within normal range',
		targetTier: nextTier,
		benefits
	};
}