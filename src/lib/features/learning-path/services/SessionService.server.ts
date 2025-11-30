import { db } from '$lib/server/db';
import { eq, and, sql } from 'drizzle-orm';
import {
	weekProgress,
	weekSessions,
	sessionTypes,
	conversations,
	adaptiveWeeks,
	type SessionRecord
} from '$lib/server/db/schema';
import { nanoid } from 'nanoid';

// ============================================================================
// TYPES
// ============================================================================

export interface StartSessionParams {
	weekProgressId: string;
	sessionTypeId: string;
	conversationSeedId?: string;
}

export interface StartSessionResult {
	session: typeof weekSessions.$inferSelect;
	conversation: typeof conversations.$inferSelect;
	sessionType: typeof sessionTypes.$inferSelect;
}

export interface CompleteSessionParams {
	sessionId: string;
	comfortRating?: number; // 1-5
	mood?: 'great' | 'good' | 'okay' | 'struggling';
	userReflection?: string;
}

export interface CompleteSessionResult {
	session: typeof weekSessions.$inferSelect;
	progress: typeof weekProgress.$inferSelect;
	encouragement?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export class SessionService {
	constructor(private database = db) {}

	/**
	 * Get all active session types
	 */
	async getSessionTypes(): Promise<(typeof sessionTypes.$inferSelect)[]> {
		return await this.database.query.sessionTypes.findMany({
			where: eq(sessionTypes.isActive, true),
			orderBy: (table, { asc }) => asc(table.displayOrder)
		});
	}

	/**
	 * Get a specific session type by ID
	 */
	async getSessionType(id: string): Promise<typeof sessionTypes.$inferSelect | undefined> {
		return await this.database.query.sessionTypes.findFirst({
			where: eq(sessionTypes.id, id)
		});
	}

	/**
	 * Start a new session
	 *
	 * This creates:
	 * 1. A new conversation record
	 * 2. A week_session linking the conversation to the week
	 *
	 * Returns the session and conversation so the UI can navigate to the conversation.
	 */
	async startSession(params: StartSessionParams): Promise<StartSessionResult> {
		const { weekProgressId, sessionTypeId, conversationSeedId } = params;

		// Get the week progress to find user and week info
		const progress = await this.database.query.weekProgress.findFirst({
			where: eq(weekProgress.id, weekProgressId)
		});

		if (!progress) {
			throw new Error(`Week progress not found: ${weekProgressId}`);
		}

		// Get session type for conversation setup
		const sessionType = await this.getSessionType(sessionTypeId);
		if (!sessionType) {
			throw new Error(`Session type not found: ${sessionTypeId}`);
		}

		// Get the week to find the path and language
		const week = await this.database.query.adaptiveWeeks.findFirst({
			where: eq(adaptiveWeeks.id, progress.weekId)
		});

		if (!week) {
			throw new Error(`Week not found: ${progress.weekId}`);
		}

		// Get the path for language info
		const path = await this.database.query.learningPaths.findFirst({
			where: eq(adaptiveWeeks.pathId, week.pathId)
		});

		if (!path) {
			throw new Error(`Path not found: ${week.pathId}`);
		}

		const conversationId = `conv-${nanoid(12)}`;
		const now = new Date();

		return await this.database.transaction(async (tx) => {
			// 1. Create the conversation
			// TODO: Set up conversation with session type prompt hints
			const [conversation] = await tx
				.insert(conversations)
				.values({
					id: conversationId,
					userId: progress.userId,
					targetLanguageId: path.targetLanguage,
					title: `${sessionType.name}: ${week.theme}`,
					mode: 'realtime',
					isOnboarding: 'false',
					startedAt: now
					// TODO: Add scenario linking if we generate scenarios for seeds
				})
				.returning();

			// 2. Create the week session record
			const [session] = await tx
				.insert(weekSessions)
				.values({
					weekProgressId,
					conversationId,
					sessionTypeId,
					conversationSeedId: conversationSeedId ?? null,
					startedAt: now,
					exchangeCount: 0
				})
				.returning();

			return { session, conversation, sessionType };
		});
	}

	/**
	 * Complete a session and update week progress
	 *
	 * This:
	 * 1. Updates the week_session with completion data
	 * 2. Updates week_progress counters
	 * 3. Returns an encouraging message based on progress
	 */
	async completeSession(params: CompleteSessionParams): Promise<CompleteSessionResult> {
		const { sessionId, comfortRating, mood, userReflection } = params;

		// Get the session
		const session = await this.database.query.weekSessions.findFirst({
			where: eq(weekSessions.id, sessionId)
		});

		if (!session) {
			throw new Error(`Session not found: ${sessionId}`);
		}

		// Calculate duration
		const now = new Date();
		const durationSeconds = Math.floor(
			(now.getTime() - session.startedAt.getTime()) / 1000
		);
		const durationMinutes = durationSeconds / 60;

		// Get conversation to count exchanges
		const conversation = await this.database.query.conversations.findFirst({
			where: eq(conversations.id, session.conversationId)
		});

		const exchangeCount = conversation?.messageCount ?? 0;

		return await this.database.transaction(async (tx) => {
			// 1. Update the session
			const [updatedSession] = await tx
				.update(weekSessions)
				.set({
					completedAt: now,
					durationSeconds,
					exchangeCount,
					comfortRating,
					mood,
					userReflection
				})
				.where(eq(weekSessions.id, sessionId))
				.returning();

			// 2. Get current progress
			const currentProgress = await tx.query.weekProgress.findFirst({
				where: eq(weekProgress.id, session.weekProgressId)
			});

			if (!currentProgress) {
				throw new Error(`Progress not found: ${session.weekProgressId}`);
			}

			// 3. Calculate new values
			const newSessionsCompleted = currentProgress.sessionsCompleted + 1;
			const newTotalMinutes =
				parseFloat(currentProgress.totalMinutes?.toString() ?? '0') + durationMinutes;

			// Track session types used
			const sessionTypeIdsUsed = currentProgress.sessionTypeIdsUsed as string[];
			const newSessionTypeIdsUsed = sessionTypeIdsUsed.includes(session.sessionTypeId)
				? sessionTypeIdsUsed
				: [...sessionTypeIdsUsed, session.sessionTypeId];

			// Track seeds explored
			const seedIdsExplored = currentProgress.seedIdsExplored as string[];
			const newSeedIdsExplored =
				session.conversationSeedId && !seedIdsExplored.includes(session.conversationSeedId)
					? [...seedIdsExplored, session.conversationSeedId]
					: seedIdsExplored;

			// Calculate new average comfort rating
			let newAverageComfort = currentProgress.averageComfortRating;
			if (comfortRating) {
				const currentAvg = parseFloat(currentProgress.averageComfortRating?.toString() ?? '0');
				const prevCount = currentProgress.sessionsCompleted;
				if (prevCount === 0) {
					newAverageComfort = comfortRating.toString();
				} else {
					const newAvg = (currentAvg * prevCount + comfortRating) / (prevCount + 1);
					newAverageComfort = newAvg.toFixed(2);
				}
			}

			// Build session record for the sessions array
			const sessionRecord: SessionRecord = {
				conversationId: session.conversationId,
				sessionTypeId: session.sessionTypeId,
				conversationSeedId: session.conversationSeedId ?? undefined,
				startedAt: session.startedAt.toISOString(),
				completedAt: now.toISOString(),
				durationSeconds,
				exchangeCount,
				comfortRating,
				mood
			};

			const currentSessions = currentProgress.sessions as SessionRecord[];

			// 4. Update progress
			const [updatedProgress] = await tx
				.update(weekProgress)
				.set({
					sessionsCompleted: newSessionsCompleted,
					totalMinutes: newTotalMinutes.toFixed(2),
					sessionTypesUsed: newSessionTypeIdsUsed.length,
					seedsExplored: newSeedIdsExplored.length,
					averageComfortRating: newAverageComfort,
					sessions: [...currentSessions, sessionRecord],
					sessionTypeIdsUsed: newSessionTypeIdsUsed,
					seedIdsExplored: newSeedIdsExplored,
					lastSessionAt: now
				})
				.where(eq(weekProgress.id, session.weekProgressId))
				.returning();

			// 5. Generate encouragement message
			const encouragement = this.generateEncouragement(newSessionsCompleted, newTotalMinutes);

			return {
				session: updatedSession,
				progress: updatedProgress,
				encouragement
			};
		});
	}

	/**
	 * Get an active (incomplete) session for a user
	 * Useful for resuming an interrupted session
	 */
	async getActiveSession(
		weekProgressId: string
	): Promise<typeof weekSessions.$inferSelect | undefined> {
		return await this.database.query.weekSessions.findFirst({
			where: and(
				eq(weekSessions.weekProgressId, weekProgressId),
				sql`${weekSessions.completedAt} IS NULL`
			)
		});
	}

	// ============================================================================
	// PRIVATE HELPERS
	// ============================================================================

	/**
	 * Generate an encouraging message based on progress
	 * No gamification - just warm acknowledgment
	 */
	private generateEncouragement(sessionsCompleted: number, totalMinutes: number): string {
		const roundedMinutes = Math.round(totalMinutes);

		if (sessionsCompleted === 1) {
			return 'Nice start to your week!';
		}

		if (sessionsCompleted === 3) {
			return `${sessionsCompleted} conversations this week. You're building a rhythm.`;
		}

		if (sessionsCompleted === 5) {
			return `${roundedMinutes} minutes of practice this week. That's real progress.`;
		}

		if (sessionsCompleted >= 7) {
			return 'You\'re really committing to this. It shows.';
		}

		return `${sessionsCompleted} conversations this week.`;
	}
}

// Export singleton instance
export const sessionService = new SessionService();
