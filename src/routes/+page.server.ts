import { subscriptionService } from '$lib/server/services/subscription.service';
import { serverTierConfigs } from '$lib/server/tiers';
import { createHomePageJsonLd } from '$lib/seo/jsonld';
import { db } from '$lib/server/db';
import { learningPathAssignments, learningPaths, adaptiveWeeks, scenarios } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { Scenario } from '$lib/server/db/types';
import type { ConversationSeed } from '$lib/server/db/schema/adaptive-weeks';

// Fetch learning path scenarios for a user
async function fetchLearningPathScenarios(userId: string): Promise<{
	hasLearningPath: boolean;
	pathInfo?: { title: string; weekNumber: number; theme: string };
	scenarios: Scenario[];
}> {
	try {
		// Get active assignment
		const assignment = await db.query.learningPathAssignments.findFirst({
			where: and(
				eq(learningPathAssignments.userId, userId),
				eq(learningPathAssignments.status, 'active')
			)
		});

		if (!assignment) {
			return { hasLearningPath: false, scenarios: [] };
		}

		// Get the path
		const path = await db.query.learningPaths.findFirst({
			where: eq(learningPaths.id, assignment.pathId)
		});

		if (!path) {
			return { hasLearningPath: false, scenarios: [] };
		}

		// For adaptive paths, get the current active week
		if (path.mode === 'adaptive') {
			const activeWeek = await db.query.adaptiveWeeks.findFirst({
				where: and(
					eq(adaptiveWeeks.pathId, path.id),
					eq(adaptiveWeeks.status, 'active')
				)
			});

			if (!activeWeek) {
				return {
					hasLearningPath: true,
					pathInfo: {
						title: path.title,
						weekNumber: assignment.currentWeekNumber,
						theme: 'Getting started'
					},
					scenarios: []
				};
			}

			// Get scenario IDs from conversation seeds
			const seeds = activeWeek.conversationSeeds as ConversationSeed[];
			const scenarioIds = seeds
				.filter((seed) => seed.scenarioId)
				.map((seed) => seed.scenarioId as string);

			if (scenarioIds.length === 0) {
				return {
					hasLearningPath: true,
					pathInfo: {
						title: path.title,
						weekNumber: activeWeek.weekNumber,
						theme: activeWeek.theme
					},
					scenarios: []
				};
			}

			// Fetch actual scenarios
			const pathScenarios = await db.query.scenarios.findMany({
				where: inArray(scenarios.id, scenarioIds)
			});

			return {
				hasLearningPath: true,
				pathInfo: {
					title: path.title,
					weekNumber: activeWeek.weekNumber,
					theme: activeWeek.theme
				},
				scenarios: pathScenarios
			};
		}

		// For classic paths, get scenarios from schedule
		const scheduleScenarioIds = (path.schedule || [])
			.filter((day) => day.scenarioId)
			.slice(0, 7) // Current week's worth
			.map((day) => day.scenarioId as string);

		if (scheduleScenarioIds.length === 0) {
			return {
				hasLearningPath: true,
				pathInfo: {
					title: path.title,
					weekNumber: assignment.currentWeekNumber,
					theme: 'Current Week'
				},
				scenarios: []
			};
		}

		const pathScenarios = await db.query.scenarios.findMany({
			where: inArray(scenarios.id, scheduleScenarioIds)
		});

		return {
			hasLearningPath: true,
			pathInfo: {
				title: path.title,
				weekNumber: assignment.currentWeekNumber,
				theme: 'Current Week'
			},
			scenarios: pathScenarios
		};
	} catch (error) {
		console.error('Error fetching learning path scenarios:', error);
		return { hasLearningPath: false, scenarios: [] };
	}
}

export const load = async ({ locals, url }) => {
	// Get user data from locals (set by hooks.server.ts)
	const user = locals.user || null;

	// Get usage limits for the user (including guests)
	let usageLimits = null;
	let tierInfo = null;
	let learningPathData: Awaited<ReturnType<typeof fetchLearningPathScenarios>> | null = null;

	if (user && user.id !== 'guest') {
		try {
			usageLimits = await subscriptionService.getUsageLimits(user.id);
			const userTier = await subscriptionService.getUserTier(user.id);
			tierInfo = serverTierConfigs[userTier];

			// Fetch learning path scenarios for logged-in users
			learningPathData = await fetchLearningPathScenarios(user.id);
		} catch (error) {
			console.error('Error loading usage limits:', error);
		}
	} else {
		// Get free tier config for guest users
		tierInfo = serverTierConfigs.free;
		usageLimits = {
			conversationsPerMonth: tierInfo.monthlyConversations,
			messagesPerConversation: 50,
			audioMinutesPerMonth: Math.floor(tierInfo.monthlySeconds / 60), // Convert seconds to minutes
			audioSecondsPerMonth: tierInfo.monthlySeconds, // Keep original seconds
			canUseRealtime: tierInfo.hasRealtimeAccess,
			canUseAdvancedAnalytics: tierInfo.hasAnalytics
		};
	}

	// SEO data optimized for daily speaking practice positioning
	const seo = {
		title: 'Speak Any Language in 5 Minutes a Day - AI Conversation Practice',
		description:
			'Build real speaking confidence in 5 minutes a day. Practice 30+ authentic scenarios with your AI language partner in 8+ languages. Get instant feedback and master conversations before talking with real people. Free to start, no scheduling required.',
		keywords:
			'5 minute daily language practice, speaking practice, scenario-based conversation, AI language partner, language confidence, speaking skills, authentic practice, daily habit, language immersion, conversation practice app, learn languages fast',
		author: 'Kaiwa',
		robots: 'index, follow',
		canonical: url.href,
		url: url.href,
		ogType: 'website',
		twitterCard: 'summary_large_image'
	};

	const jsonLd = createHomePageJsonLd(url.origin);

	return {
		user,
		usageLimits,
		tierInfo,
		seo,
		jsonLd,
		learningPath: learningPathData
	};
};
