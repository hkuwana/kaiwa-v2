import { db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import {
	learningPaths,
	learningPathAssignments,
	adaptiveWeeks,
	weekProgress,
	sessionTypes,
	DEFAULT_WEEK_THEMES,
	type ConversationSeed,
	type FocusArea
} from '$lib/server/db/schema';
import { nanoid } from 'nanoid';

// ============================================================================
// TYPES
// ============================================================================

export type WeekThemeTemplate = 'meet-family' | 'daily-life' | 'professional';

export interface CreateAdaptivePathParams {
	userId: string;
	targetLanguage: string;
	title: string;
	description: string;
	weekThemeTemplate: WeekThemeTemplate;
	cefrLevel: string;
	/** User's specific goal, e.g., "Meet my girlfriend's parents" */
	userGoal?: string;
}

export interface AdaptivePathResult {
	path: typeof learningPaths.$inferSelect;
	assignment: typeof learningPathAssignments.$inferSelect;
	week1: typeof adaptiveWeeks.$inferSelect;
	weekProgress: typeof weekProgress.$inferSelect;
}

export interface CurrentWeekResult {
	week: typeof adaptiveWeeks.$inferSelect;
	progress: typeof weekProgress.$inferSelect;
	sessionTypes: (typeof sessionTypes.$inferSelect)[];
	assignment: typeof learningPathAssignments.$inferSelect;
}

// ============================================================================
// SERVICE
// ============================================================================

export class AdaptivePathService {
	constructor(private database = db) {}

	/**
	 * Create a new adaptive learning path with Week 1 (Anchor Week)
	 *
	 * This sets up:
	 * 1. The learning path with mode='adaptive'
	 * 2. An assignment for the user
	 * 3. Week 1 with conversation seeds from the template
	 * 4. An empty week_progress record
	 */
	async createPath(params: CreateAdaptivePathParams): Promise<AdaptivePathResult> {
		const { userId, targetLanguage, title, description, weekThemeTemplate, cefrLevel, userGoal } =
			params;

		const pathId = `${targetLanguage}-adaptive-${nanoid(10)}`;

		// Get week themes from template
		const weekThemes = DEFAULT_WEEK_THEMES[weekThemeTemplate] ?? DEFAULT_WEEK_THEMES['daily-life'];
		const week1Theme = weekThemes[0];

		return await this.database.transaction(async (tx) => {
			// 1. Create the learning path
			const [path] = await tx
				.insert(learningPaths)
				.values({
					id: pathId,
					userId,
					title,
					description,
					targetLanguage,
					mode: 'adaptive',
					durationWeeks: 4,
					status: 'active',
					metadata: {
						cefrLevel,
						suggestedSessionsPerWeek: 5,
						minimumSessionsPerWeek: 3,
						targetMinutesPerSession: 7,
						weekThemeTemplate
					}
				})
				.returning();

			// 2. Create assignment
			const [assignment] = await tx
				.insert(learningPathAssignments)
				.values({
					pathId: path.id,
					userId,
					role: 'learner',
					status: 'active',
					startsAt: new Date(),
					currentDayIndex: 0,
					currentWeekNumber: 1
				})
				.returning();

			// 3. Create Week 1 (Anchor Week)
			const conversationSeeds = this.generateWeek1Seeds(
				targetLanguage,
				weekThemeTemplate,
				userGoal
			);

			const [week1] = await tx
				.insert(adaptiveWeeks)
				.values({
					pathId: path.id,
					weekNumber: 1,
					theme: week1Theme.theme,
					themeDescription: week1Theme.themeDescription,
					difficultyMin: week1Theme.difficultyMin,
					difficultyMax: week1Theme.difficultyMax,
					status: 'active',
					isAnchorWeek: true,
					conversationSeeds,
					focusAreas: [],
					leverageAreas: [],
					suggestedSessionCount: 5,
					minimumSessionCount: 3,
					startedAt: new Date()
				})
				.returning();

			// 4. Create empty week_progress record
			const [progress] = await tx
				.insert(weekProgress)
				.values({
					userId,
					assignmentId: assignment.id,
					weekId: week1.id,
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
				})
				.returning();

			return { path, assignment, week1, weekProgress: progress };
		});
	}

	/**
	 * Get the user's current active week with progress and session types
	 */
	async getCurrentWeek(assignmentId: string): Promise<CurrentWeekResult | null> {
		// Get assignment
		const assignment = await this.database.query.learningPathAssignments.findFirst({
			where: eq(learningPathAssignments.id, assignmentId)
		});

		if (!assignment) return null;

		// Get active week for this path
		const week = await this.database.query.adaptiveWeeks.findFirst({
			where: and(eq(adaptiveWeeks.pathId, assignment.pathId), eq(adaptiveWeeks.status, 'active'))
		});

		if (!week) return null;

		// Get progress for this week
		const progress = await this.database.query.weekProgress.findFirst({
			where: and(eq(weekProgress.weekId, week.id), eq(weekProgress.userId, assignment.userId))
		});

		if (!progress) return null;

		// Get all active session types
		const types = await this.database.query.sessionTypes.findMany({
			where: eq(sessionTypes.isActive, true),
			orderBy: (table, { asc }) => asc(table.displayOrder)
		});

		return {
			week,
			progress,
			sessionTypes: types,
			assignment
		};
	}

	/**
	 * Advance to the next week
	 * This should be called after weekly analysis is complete
	 */
	async advanceToNextWeek(assignmentId: string): Promise<typeof adaptiveWeeks.$inferSelect | null> {
		// TODO: Implement
		// 1. Check if analysis is complete for current week
		// 2. If not, trigger analysis first
		// 3. Get the generated next week from analysis
		// 4. Mark current week as completed
		// 5. Update assignment.currentWeekNumber
		// 6. Return the new week
		throw new Error('Not implemented: advanceToNextWeek');
	}

	/**
	 * Get all weeks for a path (for overview/timeline view)
	 */
	async getPathWeeks(pathId: string): Promise<(typeof adaptiveWeeks.$inferSelect)[]> {
		return await this.database.query.adaptiveWeeks.findMany({
			where: eq(adaptiveWeeks.pathId, pathId),
			orderBy: (table, { asc }) => asc(table.weekNumber)
		});
	}

	// ============================================================================
	// PRIVATE HELPERS
	// ============================================================================

	/**
	 * Generate conversation seeds for Week 1 based on template
	 * These are the initial seeds before any adaptation happens
	 */
	private generateWeek1Seeds(
		targetLanguage: string,
		template: WeekThemeTemplate,
		userGoal?: string
	): ConversationSeed[] {
		// TODO: These should be generated based on language and template
		// For now, return hardcoded seeds for the 'meet-family' template

		if (template === 'meet-family') {
			return [
				{
					id: 'seed-introduce-yourself',
					title: 'Introduce yourself',
					description: "Practice introducing yourself: name, where you're from, what you do",
					suggestedSessionTypes: ['quick-checkin', 'mini-roleplay'],
					vocabularyHints: ['name', 'work', 'live', 'from'],
					grammarHints: ['present tense', 'simple sentences']
				},
				{
					id: 'seed-how-you-met',
					title: 'How you met your partner',
					description: 'Tell the story of how you met - a common question from family',
					suggestedSessionTypes: ['story-moment', 'mini-roleplay'],
					vocabularyHints: ['meet', 'first time', 'together', 'relationship'],
					grammarHints: ['past tense', 'time expressions']
				},
				{
					id: 'seed-your-hobbies',
					title: 'Your hobbies and interests',
					description: 'Talk about what you like to do in your free time',
					suggestedSessionTypes: ['quick-checkin', 'question-game'],
					vocabularyHints: ['like', 'enjoy', 'free time', 'weekend'],
					grammarHints: ['present tense', 'likes/preferences']
				},
				{
					id: 'seed-your-work',
					title: 'What you do for work',
					description: 'Explain your job in simple terms',
					suggestedSessionTypes: ['quick-checkin', 'story-moment'],
					vocabularyHints: ['work', 'job', 'company', 'every day'],
					grammarHints: ['present tense', 'daily routines']
				},
				{
					id: 'seed-ask-about-them',
					title: 'Ask about their life',
					description: 'Practice asking questions about family members',
					suggestedSessionTypes: ['question-game', 'mini-roleplay'],
					vocabularyHints: ['how', 'what', 'where', 'family'],
					grammarHints: ['question formation', 'polite forms']
				}
			];
		}

		// Default seeds for 'daily-life' template
		return [
			{
				id: 'seed-morning-routine',
				title: 'Your morning routine',
				description: 'Describe what you do in the morning',
				suggestedSessionTypes: ['quick-checkin', 'story-moment'],
				vocabularyHints: ['wake up', 'breakfast', 'morning', 'usually'],
				grammarHints: ['present tense', 'time words']
			},
			{
				id: 'seed-today-plans',
				title: 'What are you doing today?',
				description: 'Talk about your plans for today',
				suggestedSessionTypes: ['quick-checkin'],
				vocabularyHints: ['today', 'going to', 'later', 'evening'],
				grammarHints: ['future/present', 'time expressions']
			},
			{
				id: 'seed-yesterday',
				title: 'How was yesterday?',
				description: 'Tell a short story about yesterday',
				suggestedSessionTypes: ['story-moment', 'question-game'],
				vocabularyHints: ['yesterday', 'was', 'did', 'went'],
				grammarHints: ['past tense', 'sequence words']
			},
			{
				id: 'seed-weekend',
				title: 'Weekend activities',
				description: 'Talk about what you do on weekends',
				suggestedSessionTypes: ['story-moment', 'question-game'],
				vocabularyHints: ['weekend', 'Saturday', 'Sunday', 'relax'],
				grammarHints: ['present/past tense', 'frequency words']
			}
		];
	}
}

// Export singleton instance
export const adaptivePathService = new AdaptivePathService();
