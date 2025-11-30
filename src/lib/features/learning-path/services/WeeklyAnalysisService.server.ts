import { db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import {
	weeklyAnalysis,
	weekProgress,
	adaptiveWeeks,
	learningPathAssignments,
	conversations,
	messages,
	WEEKLY_ANALYSIS_PROMPT_TEMPLATE,
	DEFAULT_WEEK_THEMES,
	type IdentifiedStrength,
	type IdentifiedChallenge,
	type TopicAffinity,
	type NextWeekRecommendation,
	type GeneratedSeed,
	type ConversationSeed,
	type FocusArea,
	type LeverageArea
} from '$lib/server/db/schema';
import OpenAI from 'openai';

// ============================================================================
// TYPES
// ============================================================================

export interface AnalysisInput {
	weekProgressId: string;
}

export interface ProcessedAnalysis {
	strengths: IdentifiedStrength[];
	challenges: IdentifiedChallenge[];
	topicAffinities: TopicAffinity[];
	preferredSessionTypes: string[];
	recommendations: NextWeekRecommendation[];
	generatedSeeds: GeneratedSeed[];
	suggestedNextTheme?: string;
	suggestedDifficultyAdjustment?: 'maintain' | 'increase' | 'decrease';
	weekSummary: string;
	encouragementMessage: string;
	nextWeekPreview: string;
}

export interface ConversationData {
	id: string;
	sessionTypeId: string;
	messages: {
		role: 'user' | 'assistant';
		content: string;
	}[];
	comfortRating?: number;
	mood?: string;
	durationSeconds: number;
}

// ============================================================================
// SERVICE
// ============================================================================

export class WeeklyAnalysisService {
	private openai: OpenAI;

	constructor(
		private database = db,
		openaiClient?: OpenAI
	) {
		this.openai = openaiClient ?? new OpenAI();
	}

	/**
	 * Queue an analysis for a completed week
	 *
	 * Creates a pending analysis record that will be processed asynchronously.
	 * In production, this would add to a job queue.
	 */
	async queueAnalysis(weekProgressId: string): Promise<typeof weeklyAnalysis.$inferSelect> {
		const progress = await this.database.query.weekProgress.findFirst({
			where: eq(weekProgress.id, weekProgressId)
		});

		if (!progress) {
			throw new Error(`Week progress not found: ${weekProgressId}`);
		}

		// Check if analysis already exists
		const existingAnalysis = await this.database.query.weeklyAnalysis.findFirst({
			where: eq(weeklyAnalysis.weekProgressId, weekProgressId)
		});

		if (existingAnalysis) {
			return existingAnalysis;
		}

		const [analysis] = await this.database
			.insert(weeklyAnalysis)
			.values({
				userId: progress.userId,
				assignmentId: progress.assignmentId,
				weekId: progress.weekId,
				weekProgressId: progress.id,
				status: 'pending',
				totalSessions: progress.sessionsCompleted,
				totalMinutes: progress.totalMinutes,
				averageComfort: progress.averageComfortRating,
				activeDays: progress.activeDaysThisWeek
			})
			.returning();

		// TODO: In production, add to job queue here
		// await jobQueue.add('weekly-analysis', { analysisId: analysis.id });

		return analysis;
	}

	/**
	 * Process a pending analysis
	 *
	 * This is the main analysis logic:
	 * 1. Gather all conversation data from the week
	 * 2. Send to AI for analysis
	 * 3. Store results and generate next week's seeds
	 */
	async processAnalysis(analysisId: string): Promise<typeof weeklyAnalysis.$inferSelect> {
		// Update status to processing
		await this.database
			.update(weeklyAnalysis)
			.set({
				status: 'processing',
				processingStartedAt: new Date()
			})
			.where(eq(weeklyAnalysis.id, analysisId));

		try {
			// Get the analysis record
			const analysis = await this.database.query.weeklyAnalysis.findFirst({
				where: eq(weeklyAnalysis.id, analysisId)
			});

			if (!analysis) {
				throw new Error(`Analysis not found: ${analysisId}`);
			}

			// Get progress data
			const progress = await this.database.query.weekProgress.findFirst({
				where: eq(weekProgress.id, analysis.weekProgressId)
			});

			if (!progress) {
				throw new Error(`Progress not found: ${analysis.weekProgressId}`);
			}

			// Get conversation data for the week
			const conversationData = await this.gatherConversationData(progress);

			// Get the current week for context
			const currentWeek = await this.database.query.adaptiveWeeks.findFirst({
				where: eq(adaptiveWeeks.id, analysis.weekId)
			});

			if (!currentWeek) {
				throw new Error(`Week not found: ${analysis.weekId}`);
			}

			// Run AI analysis
			const analysisResult = await this.runAIAnalysis(
				conversationData,
				progress,
				currentWeek
			);

			// Update analysis with results
			const [updatedAnalysis] = await this.database
				.update(weeklyAnalysis)
				.set({
					status: 'completed',
					completedAt: new Date(),
					strengths: analysisResult.strengths,
					challenges: analysisResult.challenges,
					topicAffinities: analysisResult.topicAffinities,
					preferredSessionTypes: analysisResult.preferredSessionTypes,
					recommendations: analysisResult.recommendations,
					generatedSeeds: analysisResult.generatedSeeds,
					suggestedNextTheme: analysisResult.suggestedNextTheme,
					suggestedDifficultyAdjustment: analysisResult.suggestedDifficultyAdjustment,
					weekSummary: analysisResult.weekSummary,
					encouragementMessage: analysisResult.encouragementMessage,
					nextWeekPreview: analysisResult.nextWeekPreview
				})
				.where(eq(weeklyAnalysis.id, analysisId))
				.returning();

			return updatedAnalysis;
		} catch (error) {
			// Update status to failed
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			const [failedAnalysis] = await this.database
				.update(weeklyAnalysis)
				.set({
					status: 'failed',
					errorMessage,
					retryCount: eq(weeklyAnalysis.retryCount, weeklyAnalysis.retryCount)
				})
				.where(eq(weeklyAnalysis.id, analysisId))
				.returning();

			throw error;
		}
	}

	/**
	 * Generate the next week from a completed analysis
	 */
	async generateNextWeek(analysisId: string): Promise<typeof adaptiveWeeks.$inferSelect> {
		const analysis = await this.database.query.weeklyAnalysis.findFirst({
			where: eq(weeklyAnalysis.id, analysisId)
		});

		if (!analysis) {
			throw new Error(`Analysis not found: ${analysisId}`);
		}

		if (analysis.status !== 'completed') {
			throw new Error(`Analysis not completed: ${analysis.status}`);
		}

		// Get current week
		const currentWeek = await this.database.query.adaptiveWeeks.findFirst({
			where: eq(adaptiveWeeks.id, analysis.weekId)
		});

		if (!currentWeek) {
			throw new Error(`Current week not found: ${analysis.weekId}`);
		}

		// Get assignment for updating
		const assignment = await this.database.query.learningPathAssignments.findFirst({
			where: eq(learningPathAssignments.id, analysis.assignmentId)
		});

		if (!assignment) {
			throw new Error(`Assignment not found: ${analysis.assignmentId}`);
		}

		const nextWeekNumber = currentWeek.weekNumber + 1;

		// Determine difficulty for next week
		const { difficultyMin, difficultyMax } = this.calculateNextDifficulty(
			currentWeek,
			analysis.suggestedDifficultyAdjustment as 'maintain' | 'increase' | 'decrease' | undefined
		);

		// Convert generated seeds to conversation seeds
		const generatedSeeds = analysis.generatedSeeds as GeneratedSeed[];
		const conversationSeeds: ConversationSeed[] = generatedSeeds.map((seed) => ({
			id: seed.id,
			title: seed.title,
			description: seed.description,
			suggestedSessionTypes: seed.suggestedSessionTypes,
			vocabularyHints: seed.vocabularyHints,
			grammarHints: seed.grammarHints
		}));

		// Convert recommendations to focus areas
		const recommendations = analysis.recommendations as NextWeekRecommendation[];
		const focusAreas: FocusArea[] = recommendations
			.filter((r) => r.type === 'focus')
			.map((r) => ({
				type: this.mapRecommendationAreaToFocusType(r.area),
				description: r.description,
				priority: r.priority,
				source: 'analysis' as const
			}));

		// Build leverage areas from strengths
		const strengths = analysis.strengths as IdentifiedStrength[];
		const leverageAreas: LeverageArea[] = strengths.map((s) => ({
			type: s.area,
			description: s.description,
			confidence: s.confidenceScore
		}));

		return await this.database.transaction(async (tx) => {
			// 1. Mark current week as completed
			await tx
				.update(adaptiveWeeks)
				.set({
					status: 'completed',
					completedAt: new Date()
				})
				.where(eq(adaptiveWeeks.id, currentWeek.id));

			// 2. Create next week
			const [nextWeek] = await tx
				.insert(adaptiveWeeks)
				.values({
					pathId: currentWeek.pathId,
					weekNumber: nextWeekNumber,
					theme: analysis.suggestedNextTheme ?? `Week ${nextWeekNumber}`,
					themeDescription: analysis.nextWeekPreview ?? 'Continue your learning journey',
					difficultyMin,
					difficultyMax,
					status: 'active',
					isAnchorWeek: false,
					conversationSeeds,
					focusAreas,
					leverageAreas,
					suggestedSessionCount: 5,
					minimumSessionCount: 3,
					generatedFromAnalysisId: analysis.id,
					startedAt: new Date()
				})
				.returning();

			// 3. Create empty progress for new week
			await tx.insert(weekProgress).values({
				userId: analysis.userId,
				assignmentId: analysis.assignmentId,
				weekId: nextWeek.id,
				sessionsCompleted: 0,
				totalMinutes: '0',
				sessionTypesUsed: 0,
				seedsExplored: 0,
				sessions: [],
				sessionTypeIdsUsed: [],
				seedIdsExplored: [],
				vocabularyEncounters: [],
				grammarEncounters: [],
				topicsThatSparkedJoy: [],
				topicsThatWereChallenging: [],
				activeDaysThisWeek: 0,
				currentStreakDays: 0,
				longestStreakThisWeek: 0
			});

			// 4. Update assignment
			await tx
				.update(learningPathAssignments)
				.set({
					currentWeekNumber: nextWeekNumber
				})
				.where(eq(learningPathAssignments.id, assignment.id));

			// 5. Link analysis to generated week
			await tx
				.update(weeklyAnalysis)
				.set({
					generatedWeekId: nextWeek.id
				})
				.where(eq(weeklyAnalysis.id, analysisId));

			return nextWeek;
		});
	}

	/**
	 * Get analysis for a week (if exists)
	 */
	async getAnalysisForWeek(
		weekId: string
	): Promise<typeof weeklyAnalysis.$inferSelect | undefined> {
		return await this.database.query.weeklyAnalysis.findFirst({
			where: eq(weeklyAnalysis.weekId, weekId)
		});
	}

	// ============================================================================
	// PRIVATE HELPERS
	// ============================================================================

	/**
	 * Gather all conversation data from the week for analysis
	 */
	private async gatherConversationData(
		progress: typeof weekProgress.$inferSelect
	): Promise<ConversationData[]> {
		// TODO: Implement actual conversation fetching
		// This should get all conversations from week_sessions
		// and their messages for analysis

		const sessions = progress.sessions as {
			conversationId: string;
			sessionTypeId: string;
			comfortRating?: number;
			mood?: string;
			durationSeconds: number;
		}[];

		const conversationData: ConversationData[] = [];

		for (const session of sessions) {
			// Get messages for this conversation
			const conversationMessages = await this.database.query.messages.findMany({
				where: eq(messages.conversationId, session.conversationId),
				orderBy: (table, { asc }) => asc(table.createdAt)
			});

			conversationData.push({
				id: session.conversationId,
				sessionTypeId: session.sessionTypeId,
				messages: conversationMessages.map((m) => ({
					role: m.role as 'user' | 'assistant',
					content: m.content
				})),
				comfortRating: session.comfortRating,
				mood: session.mood,
				durationSeconds: session.durationSeconds
			});
		}

		return conversationData;
	}

	/**
	 * Run AI analysis on the conversation data
	 */
	private async runAIAnalysis(
		conversationData: ConversationData[],
		progress: typeof weekProgress.$inferSelect,
		currentWeek: typeof adaptiveWeeks.$inferSelect
	): Promise<ProcessedAnalysis> {
		// Build the prompt
		const systemPrompt = WEEKLY_ANALYSIS_PROMPT_TEMPLATE;

		const userPrompt = this.buildAnalysisPrompt(conversationData, progress, currentWeek);

		// TODO: Call OpenAI API
		// For now, return placeholder data
		// In production:
		// const response = await this.openai.chat.completions.create({
		//   model: 'gpt-4o',
		//   messages: [
		//     { role: 'system', content: systemPrompt },
		//     { role: 'user', content: userPrompt }
		//   ],
		//   response_format: { type: 'json_object' }
		// });
		// return JSON.parse(response.choices[0].message.content);

		// Placeholder response
		return {
			strengths: [
				{
					area: 'vocabulary',
					description: 'Good use of everyday vocabulary',
					evidence: ['Used common greetings naturally'],
					confidenceScore: 75
				}
			],
			challenges: [
				{
					area: 'grammar',
					description: 'Past tense verbs need practice',
					evidence: ['Hesitation when describing yesterday'],
					suggestedApproach: 'More storytelling about recent events',
					severity: 'moderate'
				}
			],
			topicAffinities: [
				{
					topic: 'daily routines',
					engagementLevel: 'high',
					sessionsInTopic: 3,
					averageComfortInTopic: 4
				}
			],
			preferredSessionTypes: ['quick-checkin', 'story-moment'],
			recommendations: [
				{
					type: 'focus',
					area: 'past tense',
					description: 'Practice past tense through storytelling',
					reasoning: 'User showed hesitation with past tense verbs',
					priority: 'high'
				},
				{
					type: 'leverage',
					area: 'daily routines',
					description: 'Continue with daily routine topics',
					reasoning: 'User showed high engagement with this topic',
					priority: 'medium'
				}
			],
			generatedSeeds: [
				{
					id: 'seed-week2-1',
					title: 'What did you do last weekend?',
					description: 'Practice past tense with weekend activities',
					suggestedSessionTypes: ['story-moment'],
					vocabularyHints: ['weekend', 'Saturday', 'Sunday', 'did'],
					grammarHints: ['past tense'],
					reasoning: 'Builds on daily routine comfort while introducing more past tense'
				},
				{
					id: 'seed-week2-2',
					title: 'A meal you made recently',
					description: 'Describe a meal you cooked or ate recently',
					suggestedSessionTypes: ['story-moment', 'question-game'],
					vocabularyHints: ['cook', 'eat', 'ingredients', 'delicious'],
					grammarHints: ['past tense', 'adjectives'],
					reasoning: 'Food topics often spark joy; good vehicle for past tense'
				}
			],
			suggestedNextTheme: 'Last Week',
			suggestedDifficultyAdjustment: 'maintain',
			weekSummary: `You completed ${progress.sessionsCompleted} conversations this week, practicing for ${Math.round(parseFloat(progress.totalMinutes?.toString() ?? '0'))} minutes total.`,
			encouragementMessage:
				'You\'re building a real foundation. The consistency matters more than perfection.',
			nextWeekPreview:
				'Next week, we\'ll build on your daily routine vocabulary while gently adding more past tense through storytelling.'
		};
	}

	/**
	 * Build the user prompt for AI analysis
	 */
	private buildAnalysisPrompt(
		conversationData: ConversationData[],
		progress: typeof weekProgress.$inferSelect,
		currentWeek: typeof adaptiveWeeks.$inferSelect
	): string {
		return `
## Week Summary
- Week theme: ${currentWeek.theme}
- Sessions completed: ${progress.sessionsCompleted}
- Total minutes: ${progress.totalMinutes}
- Average comfort rating: ${progress.averageComfortRating ?? 'N/A'}
- Session types used: ${(progress.sessionTypeIdsUsed as string[]).join(', ')}
- Topics that sparked joy: ${(progress.topicsThatSparkedJoy as string[]).join(', ') || 'None recorded'}
- Topics that were challenging: ${(progress.topicsThatWereChallenging as string[]).join(', ') || 'None recorded'}

## Conversation Transcripts
${conversationData
	.map(
		(conv, i) => `
### Conversation ${i + 1} (${conv.sessionTypeId})
Duration: ${Math.round(conv.durationSeconds / 60)} minutes
Comfort: ${conv.comfortRating ?? 'N/A'}/5
Mood: ${conv.mood ?? 'N/A'}

${conv.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}
`
	)
	.join('\n---\n')}

Please analyze this week and provide:
1. Identified strengths (what they did well)
2. Identified challenges (areas for gentle improvement)
3. Topic affinities (what topics engaged them)
4. Recommendations for next week
5. Generated conversation seeds for next week (4-6 seeds)
6. A warm, encouraging summary

Output as JSON.
`;
	}

	/**
	 * Calculate difficulty for next week based on current and adjustment
	 */
	private calculateNextDifficulty(
		currentWeek: typeof adaptiveWeeks.$inferSelect,
		adjustment?: 'maintain' | 'increase' | 'decrease'
	): { difficultyMin: string; difficultyMax: string } {
		const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

		const currentMinIdx = levels.indexOf(currentWeek.difficultyMin);
		const currentMaxIdx = levels.indexOf(currentWeek.difficultyMax);

		if (adjustment === 'increase') {
			return {
				difficultyMin: levels[Math.min(currentMinIdx + 1, levels.length - 1)],
				difficultyMax: levels[Math.min(currentMaxIdx + 1, levels.length - 1)]
			};
		}

		if (adjustment === 'decrease') {
			return {
				difficultyMin: levels[Math.max(currentMinIdx - 1, 0)],
				difficultyMax: levels[Math.max(currentMaxIdx - 1, 0)]
			};
		}

		// maintain
		return {
			difficultyMin: currentWeek.difficultyMin,
			difficultyMax: currentWeek.difficultyMax
		};
	}

	/**
	 * Map recommendation area string to FocusArea type
	 */
	private mapRecommendationAreaToFocusType(
		area: string
	): 'vocabulary' | 'grammar' | 'pronunciation' | 'fluency' | 'confidence' {
		const mapping: Record<
			string,
			'vocabulary' | 'grammar' | 'pronunciation' | 'fluency' | 'confidence'
		> = {
			vocabulary: 'vocabulary',
			grammar: 'grammar',
			pronunciation: 'pronunciation',
			fluency: 'fluency',
			confidence: 'confidence',
			'past tense': 'grammar',
			'present tense': 'grammar',
			'question formation': 'grammar'
		};

		return mapping[area.toLowerCase()] ?? 'grammar';
	}
}

// Export singleton instance
export const weeklyAnalysisService = new WeeklyAnalysisService();
