// src/lib/features/learning-path/services/WeeklyAnalysisService.server.ts

/**
 * WeeklyAnalysisService - Analyzes user progress and generates weekly insights
 *
 * This service supports the adaptive weekly learning model by:
 * 1. Analyzing completed conversations from learning path sessions
 * 2. Aggregating performance metrics (completion, engagement, linguistic findings)
 * 3. Generating insights and recommendations for next week
 * 4. Preparing data for GPT-based adaptive content generation
 *
 * **Key Features:**
 * - Analyze conversations linked to learning path scenarios
 * - Aggregate analysis findings (grammar, vocabulary corrections)
 * - Calculate engagement and comfort metrics
 * - Generate weekly performance summaries
 * - Queue next week's content generation based on performance
 *
 * **Server-Side Only** - Runs as part of cron jobs
 */

import { logger } from '$lib/logger';
import { db } from '$lib/server/db/index';
import { conversations, analysisFindings, learningPathAssignments, learningPaths } from '$lib/server/db/schema';
import { eq, and, gte, lt, sql, inArray } from 'drizzle-orm';
import type { LearningPathAssignment, LearningPath, Conversation } from '$lib/server/db/types';

/**
 * Weekly performance metrics for a user's learning path
 */
export interface WeeklyPerformanceMetrics {
	assignmentId: string;
	userId: string;
	pathId: string;
	weekNumber: number;

	// Session metrics
	sessionsCompleted: number;
	sessionsExpected: number;
	completionRate: number;

	// Time metrics
	totalDurationMinutes: number;
	averageSessionMinutes: number;

	// Engagement metrics
	averageComfortRating: number | null;
	engagementBreakdown: {
		high: number;
		medium: number;
		low: number;
	};

	// Linguistic metrics
	totalFindings: number;
	findingsAccepted: number;
	findingsIgnored: number;
	findingsByFeature: Record<string, number>;

	// Analysis summary
	strengths: string[];
	areasForImprovement: string[];
	recommendedFocus: string[];
}

/**
 * Assignment ready for weekly analysis
 */
export interface AnalysisCandidate {
	assignment: LearningPathAssignment;
	path: LearningPath;
	weekNumber: number;
	weekStartDate: Date;
	weekEndDate: Date;
	scenarioIds: string[];
}

export class WeeklyAnalysisService {
	/**
	 * Find all assignments that need weekly analysis
	 *
	 * This finds assignments where:
	 * - Status is 'active'
	 * - User has completed at least one week
	 * - Analysis hasn't been run recently for this week
	 *
	 * @param limit - Maximum number of assignments to process
	 * @returns Array of analysis candidates
	 */
	static async findAssignmentsNeedingAnalysis(limit = 20): Promise<AnalysisCandidate[]> {
		const now = new Date();
		const candidates: AnalysisCandidate[] = [];

		try {
			// Get all active assignments with their paths
			const activeAssignments = await db
				.select({
					assignment: learningPathAssignments,
					path: learningPaths
				})
				.from(learningPathAssignments)
				.innerJoin(learningPaths, eq(learningPathAssignments.pathId, learningPaths.id))
				.where(eq(learningPathAssignments.status, 'active'))
				.limit(limit * 2); // Fetch more to filter

			for (const { assignment, path } of activeAssignments) {
				// Calculate which week the user is in
				const daysSinceStart = Math.floor(
					(now.getTime() - new Date(assignment.startsAt).getTime()) / (1000 * 60 * 60 * 24)
				);
				const currentWeek = Math.ceil((daysSinceStart + 1) / 7);

				// Only process if they've completed at least one full week
				if (currentWeek < 2) continue;

				// Get the week that just ended
				const analysisWeek = currentWeek - 1;
				const weekStartDate = new Date(assignment.startsAt);
				weekStartDate.setDate(weekStartDate.getDate() + (analysisWeek - 1) * 7);
				weekStartDate.setHours(0, 0, 0, 0);

				const weekEndDate = new Date(weekStartDate);
				weekEndDate.setDate(weekEndDate.getDate() + 7);
				weekEndDate.setHours(0, 0, 0, 0);

				// Get scenario IDs for this week from the schedule
				const weekDayStart = (analysisWeek - 1) * 7 + 1;
				const weekDayEnd = analysisWeek * 7;
				const scenarioIds = path.schedule
					.filter((day) => day.dayIndex >= weekDayStart && day.dayIndex <= weekDayEnd)
					.map((day) => day.scenarioId)
					.filter((id): id is string => !!id);

				if (scenarioIds.length === 0) continue;

				candidates.push({
					assignment,
					path,
					weekNumber: analysisWeek,
					weekStartDate,
					weekEndDate,
					scenarioIds
				});

				if (candidates.length >= limit) break;
			}

			logger.info(`📊 [WeeklyAnalysis] Found ${candidates.length} assignments needing analysis`);
			return candidates;
		} catch (error) {
			logger.error('❌ [WeeklyAnalysis] Failed to find assignments', error);
			throw error;
		}
	}

	/**
	 * Analyze a user's weekly performance
	 *
	 * @param candidate - Analysis candidate with assignment and path info
	 * @returns Performance metrics for the week
	 */
	static async analyzeWeeklyPerformance(
		candidate: AnalysisCandidate
	): Promise<WeeklyPerformanceMetrics> {
		const { assignment, path, weekNumber, weekStartDate, weekEndDate, scenarioIds } = candidate;

		logger.info(`📈 [WeeklyAnalysis] Analyzing week ${weekNumber} for assignment ${assignment.id}`, {
			userId: assignment.userId,
			pathId: path.id,
			weekStartDate: weekStartDate.toISOString(),
			weekEndDate: weekEndDate.toISOString()
		});

		// Get conversations for this week's scenarios
		const weekConversations = await db
			.select()
			.from(conversations)
			.where(
				and(
					eq(conversations.userId, assignment.userId),
					inArray(conversations.scenarioId, scenarioIds),
					gte(conversations.startedAt, weekStartDate),
					lt(conversations.startedAt, weekEndDate)
				)
			);

		// Calculate session metrics
		const sessionsCompleted = weekConversations.length;
		const sessionsExpected = scenarioIds.length;
		const completionRate = sessionsExpected > 0 ? (sessionsCompleted / sessionsExpected) * 100 : 0;

		// Calculate time metrics
		const totalDurationMinutes = weekConversations.reduce(
			(sum, c) => sum + (c.durationSeconds || 0) / 60,
			0
		);
		const averageSessionMinutes =
			sessionsCompleted > 0 ? totalDurationMinutes / sessionsCompleted : 0;

		// Calculate engagement metrics
		const comfortRatings = weekConversations
			.map((c) => c.comfortRating)
			.filter((r): r is number => r !== null);
		const averageComfortRating =
			comfortRatings.length > 0
				? comfortRatings.reduce((a, b) => a + b, 0) / comfortRatings.length
				: null;

		const engagementBreakdown = {
			high: weekConversations.filter((c) => c.engagementLevel === 'high').length,
			medium: weekConversations.filter((c) => c.engagementLevel === 'medium').length,
			low: weekConversations.filter((c) => c.engagementLevel === 'low').length
		};

		// Get analysis findings for these conversations
		const conversationIds = weekConversations.map((c) => c.id);
		let totalFindings = 0;
		let findingsAccepted = 0;
		let findingsIgnored = 0;
		const findingsByFeature: Record<string, number> = {};

		if (conversationIds.length > 0) {
			const findings = await db
				.select()
				.from(analysisFindings)
				.where(inArray(analysisFindings.conversationId, conversationIds));

			totalFindings = findings.length;
			findingsAccepted = findings.filter((f) => f.actionStatus === 'accepted').length;
			findingsIgnored = findings.filter((f) => f.actionStatus === 'ignored').length;

			// Group by feature
			for (const finding of findings) {
				const feature = finding.featureId;
				findingsByFeature[feature] = (findingsByFeature[feature] || 0) + 1;
			}
		}

		// Generate insights (simplified - in production would use GPT)
		const strengths: string[] = [];
		const areasForImprovement: string[] = [];
		const recommendedFocus: string[] = [];

		if (completionRate >= 80) {
			strengths.push('Excellent session completion rate');
		} else if (completionRate < 50) {
			areasForImprovement.push('Session completion needs improvement');
			recommendedFocus.push('Schedule regular practice times');
		}

		if (averageComfortRating !== null && averageComfortRating >= 4) {
			strengths.push('High comfort level with conversations');
		} else if (averageComfortRating !== null && averageComfortRating < 3) {
			areasForImprovement.push('Comfort level could improve');
			recommendedFocus.push('Review vocabulary before sessions');
		}

		if (findingsAccepted > findingsIgnored) {
			strengths.push('Actively learning from corrections');
		}

		// Top features to focus on (most frequent findings)
		const sortedFeatures = Object.entries(findingsByFeature)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 3);

		for (const [feature] of sortedFeatures) {
			recommendedFocus.push(`Review: ${feature}`);
		}

		return {
			assignmentId: assignment.id,
			userId: assignment.userId,
			pathId: path.id,
			weekNumber,
			sessionsCompleted,
			sessionsExpected,
			completionRate: Math.round(completionRate * 10) / 10,
			totalDurationMinutes: Math.round(totalDurationMinutes * 10) / 10,
			averageSessionMinutes: Math.round(averageSessionMinutes * 10) / 10,
			averageComfortRating: averageComfortRating
				? Math.round(averageComfortRating * 10) / 10
				: null,
			engagementBreakdown,
			totalFindings,
			findingsAccepted,
			findingsIgnored,
			findingsByFeature,
			strengths,
			areasForImprovement,
			recommendedFocus
		};
	}

	/**
	 * Process weekly analysis for all eligible assignments
	 *
	 * @param limit - Maximum number of assignments to process
	 * @param dryRun - If true, don't persist changes
	 * @returns Processing results
	 */
	static async processWeeklyAnalysis(
		limit = 10,
		dryRun = false
	): Promise<{
		processed: number;
		succeeded: number;
		failed: number;
		results: WeeklyPerformanceMetrics[];
		errors: Array<{ assignmentId: string; error: string }>;
	}> {
		const stats = {
			processed: 0,
			succeeded: 0,
			failed: 0,
			results: [] as WeeklyPerformanceMetrics[],
			errors: [] as Array<{ assignmentId: string; error: string }>
		};

		try {
			logger.info('🔄 [WeeklyAnalysis] Starting weekly analysis processing', {
				limit,
				dryRun,
				timestamp: new Date().toISOString()
			});

			const candidates = await this.findAssignmentsNeedingAnalysis(limit);

			if (candidates.length === 0) {
				logger.info('✨ [WeeklyAnalysis] No assignments need analysis');
				return stats;
			}

			for (const candidate of candidates) {
				stats.processed++;

				try {
					const metrics = await this.analyzeWeeklyPerformance(candidate);
					stats.results.push(metrics);

					if (!dryRun) {
						// Store the analysis results (could be in a new table or metadata)
						// For now, we'll just log it - future: store in weekly_analysis table
						logger.info(`✅ [WeeklyAnalysis] Week ${metrics.weekNumber} analysis complete`, {
							assignmentId: metrics.assignmentId,
							completionRate: metrics.completionRate,
							avgComfort: metrics.averageComfortRating,
							totalFindings: metrics.totalFindings
						});
					} else {
						logger.info(`🔍 [WeeklyAnalysis] DRY RUN - Would store analysis`, {
							assignmentId: metrics.assignmentId,
							weekNumber: metrics.weekNumber
						});
					}

					stats.succeeded++;
				} catch (error) {
					stats.failed++;
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					stats.errors.push({
						assignmentId: candidate.assignment.id,
						error: errorMessage
					});

					logger.error(`❌ [WeeklyAnalysis] Failed to analyze assignment`, {
						assignmentId: candidate.assignment.id,
						error: errorMessage
					});
				}
			}

			logger.info('🎉 [WeeklyAnalysis] Weekly analysis processing complete', {
				...stats,
				timestamp: new Date().toISOString()
			});

			return stats;
		} catch (error) {
			logger.error('🚨 [WeeklyAnalysis] Fatal error during processing', error);
			throw error;
		}
	}

	/**
	 * Get weekly analysis stats for a specific assignment
	 *
	 * @param assignmentId - Assignment ID
	 * @param weekNumber - Week number to analyze
	 * @returns Performance metrics or null if not enough data
	 */
	static async getWeekAnalysis(
		assignmentId: string,
		weekNumber: number
	): Promise<WeeklyPerformanceMetrics | null> {
		const assignment = await db.query.learningPathAssignments.findFirst({
			where: eq(learningPathAssignments.id, assignmentId)
		});

		if (!assignment) {
			logger.warn(`[WeeklyAnalysis] Assignment ${assignmentId} not found`);
			return null;
		}

		const path = await db.query.learningPaths.findFirst({
			where: eq(learningPaths.id, assignment.pathId)
		});

		if (!path) {
			logger.warn(`[WeeklyAnalysis] Path ${assignment.pathId} not found`);
			return null;
		}

		// Calculate week dates
		const weekStartDate = new Date(assignment.startsAt);
		weekStartDate.setDate(weekStartDate.getDate() + (weekNumber - 1) * 7);
		weekStartDate.setHours(0, 0, 0, 0);

		const weekEndDate = new Date(weekStartDate);
		weekEndDate.setDate(weekEndDate.getDate() + 7);
		weekEndDate.setHours(0, 0, 0, 0);

		// Get scenario IDs for this week
		const weekDayStart = (weekNumber - 1) * 7 + 1;
		const weekDayEnd = weekNumber * 7;
		const scenarioIds = path.schedule
			.filter((day) => day.dayIndex >= weekDayStart && day.dayIndex <= weekDayEnd)
			.map((day) => day.scenarioId)
			.filter((id): id is string => !!id);

		if (scenarioIds.length === 0) {
			return null;
		}

		const candidate: AnalysisCandidate = {
			assignment,
			path,
			weekNumber,
			weekStartDate,
			weekEndDate,
			scenarioIds
		};

		return this.analyzeWeeklyPerformance(candidate);
	}
}
