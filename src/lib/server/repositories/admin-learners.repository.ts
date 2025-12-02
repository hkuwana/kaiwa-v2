// src/lib/server/repositories/admin-learners.repository.ts

import { db } from '$lib/server/db';
import {
	learningPathAssignments,
	learningPaths,
	users,
	weekProgress,
	weekSessions,
	conversations
} from '$lib/server/db/schema';
import { desc, eq, inArray, sql } from 'drizzle-orm';

type LearnerAssignment = {
	id: string;
	status: 'invited' | 'active' | 'completed' | 'archived';
	role: 'tester' | 'learner';
	currentDayIndex: number;
	currentWeekNumber: number;
	startsAt: Date;
	completedAt: Date | null;
	lastEmailSentAt: Date | null;
	emailRemindersEnabled?: boolean | null;
};

type LearnerPath = {
	id: string;
	title: string;
	description?: string | null;
	targetLanguage: string;
	durationWeeks: number;
	mode: 'classic' | 'adaptive';
	schedule?: unknown;
};

type LearnerProgressSummary = {
	sessionsCompleted: number;
	totalMinutes: number;
	lastSessionAt: Date | null;
	currentStreakDays: number;
} | null;

export type LearnerSummary = {
	user: {
		id: string;
		email: string;
		displayName: string | null;
		avatarUrl: string | null;
	};
	assignment: LearnerAssignment;
	path: LearnerPath;
	progress: LearnerProgressSummary;
};

export type WeekSessionSummary = {
	id: string;
	conversationId: string;
	startedAt: Date;
	completedAt: Date | null;
	durationSeconds: number | null;
	exchangeCount: number;
	comfortRating: number | null;
	mood: 'great' | 'good' | 'okay' | 'struggling' | null;
	sessionTypeId: string;
};

export type WeekProgressDetail = {
	id: string;
	weekNumber: number;
	sessionsCompleted: number;
	totalMinutes: number;
	lastSessionAt: Date | null;
	currentStreakDays: number;
	activeDaysThisWeek: number;
	sessions: WeekSessionSummary[];
};

export type LearnerDetail = {
	user: {
		id: string;
		email: string;
		displayName: string | null;
		avatarUrl: string | null;
		createdAt: Date;
		lastUsage: Date | null;
	};
	assignments: {
		id: string;
		pathId: string;
		pathTitle: string;
		status: LearnerAssignment['status'];
	}[];
	selectedAssignment: LearnerAssignment & { emailRemindersEnabled: boolean; pathId: string };
	path: LearnerPath & { description: string | null; schedule: unknown };
	weekProgress: WeekProgressDetail[];
	recentConversations: {
		id: string;
		scenarioId: string | null;
		targetLanguageId: string;
		startedAt: Date;
		endedAt: Date | null;
		durationSeconds: number | null;
	}[];
};

class AdminLearnersRepository {
	constructor(private database = db) {}

	/**
	 * List learners with their current assignment, path, and progress aggregates.
	 */
	async listLearnersWithProgress(): Promise<LearnerSummary[]> {
		const assignmentsWithData = await this.database
			.select({
				// User fields
				userId: users.id,
				userEmail: users.email,
				userDisplayName: users.displayName,
				userAvatarUrl: users.avatarUrl,
				// Assignment fields
				assignmentId: learningPathAssignments.id,
				assignmentStatus: learningPathAssignments.status,
				assignmentRole: learningPathAssignments.role,
				currentDayIndex: learningPathAssignments.currentDayIndex,
				currentWeekNumber: learningPathAssignments.currentWeekNumber,
				startsAt: learningPathAssignments.startsAt,
				completedAt: learningPathAssignments.completedAt,
				lastEmailSentAt: learningPathAssignments.lastEmailSentAt,
				// Path fields
				pathId: learningPaths.id,
				pathTitle: learningPaths.title,
				pathTargetLanguage: learningPaths.targetLanguage,
				pathDurationWeeks: learningPaths.durationWeeks,
				pathMode: learningPaths.mode
			})
			.from(learningPathAssignments)
			.innerJoin(users, eq(learningPathAssignments.userId, users.id))
			.innerJoin(learningPaths, eq(learningPathAssignments.pathId, learningPaths.id))
			.orderBy(desc(learningPathAssignments.updatedAt));

		const assignmentIds = assignmentsWithData.map((a) => a.assignmentId);

		const progressData =
			assignmentIds.length > 0
				? await this.database
						.select({
							assignmentId: weekProgress.assignmentId,
							sessionsCompleted: sql<number>`sum(${weekProgress.sessionsCompleted})::int`,
							totalMinutes: sql<number>`sum(${weekProgress.totalMinutes})::float`,
							lastSessionAt: sql<Date>`max(${weekProgress.lastSessionAt})`,
							currentStreakDays: sql<number>`max(${weekProgress.currentStreakDays})::int`
						})
						.from(weekProgress)
						.where(inArray(weekProgress.assignmentId, assignmentIds))
						.groupBy(weekProgress.assignmentId)
				: [];

		const progressMap = new Map(progressData.map((p) => [p.assignmentId, p]));

		return assignmentsWithData.map((row) => {
			const progressRecord = progressMap.get(row.assignmentId);

			return {
				user: {
					id: row.userId,
					email: row.userEmail,
					displayName: row.userDisplayName,
					avatarUrl: row.userAvatarUrl
				},
				assignment: {
					id: row.assignmentId,
					status: row.assignmentStatus,
					role: row.assignmentRole,
					currentDayIndex: row.currentDayIndex,
					currentWeekNumber: row.currentWeekNumber,
					startsAt: row.startsAt,
					completedAt: row.completedAt,
					lastEmailSentAt: row.lastEmailSentAt
				},
				path: {
					id: row.pathId,
					title: row.pathTitle,
					targetLanguage: row.pathTargetLanguage,
					durationWeeks: row.pathDurationWeeks,
					mode: row.pathMode
				},
				progress: progressRecord
					? {
							sessionsCompleted: progressRecord.sessionsCompleted || 0,
							totalMinutes: progressRecord.totalMinutes || 0,
							lastSessionAt: progressRecord.lastSessionAt,
							currentStreakDays: progressRecord.currentStreakDays || 0
						}
					: null
			};
		});
	}

	/**
	 * Get full detail for a learner, including assignments, week progress, and recent conversations.
	 */
	async getLearnerDetail(
		userId: string,
		assignmentId?: string | null
	): Promise<LearnerDetail | undefined> {
		const user = await this.database.query.users.findFirst({
			where: eq(users.id, userId)
		});

		if (!user) {
			return undefined;
		}

		const assignments = await this.database
			.select({
				assignmentId: learningPathAssignments.id,
				assignmentStatus: learningPathAssignments.status,
				assignmentRole: learningPathAssignments.role,
				currentDayIndex: learningPathAssignments.currentDayIndex,
				currentWeekNumber: learningPathAssignments.currentWeekNumber,
				startsAt: learningPathAssignments.startsAt,
				completedAt: learningPathAssignments.completedAt,
				emailRemindersEnabled: learningPathAssignments.emailRemindersEnabled,
				lastEmailSentAt: learningPathAssignments.lastEmailSentAt,
				pathId: learningPaths.id,
				pathTitle: learningPaths.title,
				pathDescription: learningPaths.description,
				pathTargetLanguage: learningPaths.targetLanguage,
				pathDurationWeeks: learningPaths.durationWeeks,
				pathMode: learningPaths.mode,
				pathSchedule: learningPaths.schedule
			})
			.from(learningPathAssignments)
			.innerJoin(learningPaths, eq(learningPathAssignments.pathId, learningPaths.id))
			.where(eq(learningPathAssignments.userId, userId))
			.orderBy(desc(learningPathAssignments.startsAt));

		if (assignments.length === 0) {
			return undefined;
		}

		const selectedAssignment =
			assignments.find((a) => assignmentId && a.assignmentId === assignmentId) || assignments[0];

		const progressRecords = await this.database
			.select()
			.from(weekProgress)
			.where(eq(weekProgress.assignmentId, selectedAssignment.assignmentId))
			.orderBy(weekProgress.createdAt);

		const weekProgressDetails: WeekProgressDetail[] = [];

		for (const [index, progress] of progressRecords.entries()) {
			const sessions = await this.database
				.select({
					id: weekSessions.id,
					conversationId: weekSessions.conversationId,
					startedAt: weekSessions.startedAt,
					completedAt: weekSessions.completedAt,
					durationSeconds: weekSessions.durationSeconds,
					exchangeCount: weekSessions.exchangeCount,
					comfortRating: weekSessions.comfortRating,
					mood: weekSessions.mood,
					sessionTypeId: weekSessions.sessionTypeId
				})
				.from(weekSessions)
				.where(eq(weekSessions.weekProgressId, progress.id))
				.orderBy(desc(weekSessions.startedAt));

			weekProgressDetails.push({
				id: progress.id,
				weekNumber: index + 1,
				sessionsCompleted: progress.sessionsCompleted,
				totalMinutes: Number(progress.totalMinutes) || 0,
				lastSessionAt: progress.lastSessionAt,
				currentStreakDays: progress.currentStreakDays,
				activeDaysThisWeek: progress.activeDaysThisWeek,
				sessions
			});
		}

		const recentConversations = await this.database
			.select({
				id: conversations.id,
				scenarioId: conversations.scenarioId,
				targetLanguageId: conversations.targetLanguageId,
				startedAt: conversations.startedAt,
				endedAt: conversations.endedAt,
				durationSeconds: conversations.durationSeconds
			})
			.from(conversations)
			.where(eq(conversations.userId, userId))
			.orderBy(desc(conversations.startedAt))
			.limit(10);

		return {
			user: {
				id: user.id,
				email: user.email,
				displayName: user.displayName,
				avatarUrl: user.avatarUrl,
				createdAt: user.createdAt,
				lastUsage: user.lastUsage
			},
			assignments: assignments.map((a) => ({
				id: a.assignmentId,
				pathId: a.pathId,
				pathTitle: a.pathTitle,
				status: a.assignmentStatus
			})),
			selectedAssignment: {
				id: selectedAssignment.assignmentId,
				status: selectedAssignment.assignmentStatus,
				role: selectedAssignment.assignmentRole,
				currentDayIndex: selectedAssignment.currentDayIndex,
				currentWeekNumber: selectedAssignment.currentWeekNumber,
				startsAt: selectedAssignment.startsAt,
				completedAt: selectedAssignment.completedAt,
				lastEmailSentAt: selectedAssignment.lastEmailSentAt,
				emailRemindersEnabled: selectedAssignment.emailRemindersEnabled ?? false,
				pathId: selectedAssignment.pathId
			},
			path: {
				id: selectedAssignment.pathId,
				title: selectedAssignment.pathTitle,
				description: selectedAssignment.pathDescription ?? null,
				targetLanguage: selectedAssignment.pathTargetLanguage,
				durationWeeks: selectedAssignment.pathDurationWeeks,
				mode: selectedAssignment.pathMode,
				schedule: selectedAssignment.pathSchedule
			},
			weekProgress: weekProgressDetails,
			recentConversations
		};
	}
}

export const adminLearnersRepository = new AdminLearnersRepository();
