// src/routes/admin/learners/+page.server.ts

import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { learningPathAssignments, learningPaths, users, weekProgress } from '$lib/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export type LearnerWithPath = {
	id: string;
	email: string;
	displayName: string | null;
	avatarUrl: string | null;
	assignment: {
		id: string;
		status: 'invited' | 'active' | 'completed' | 'archived';
		role: 'tester' | 'learner';
		currentDayIndex: number;
		currentWeekNumber: number;
		startsAt: Date;
		completedAt: Date | null;
		lastEmailSentAt: Date | null;
	};
	path: {
		id: string;
		title: string;
		targetLanguage: string;
		durationWeeks: number;
		mode: 'classic' | 'adaptive';
	};
	progress: {
		sessionsCompleted: number;
		totalMinutes: number;
		lastSessionAt: Date | null;
		currentStreakDays: number;
	} | null;
	// Computed status for grouping
	attentionStatus: 'needs_attention' | 'slow_progress' | 'on_track' | 'completed' | 'invited';
};

function calculateAttentionStatus(
	assignment: LearnerWithPath['assignment'],
	progress: LearnerWithPath['progress']
): LearnerWithPath['attentionStatus'] {
	// Invited users aren't started yet
	if (assignment.status === 'invited') {
		return 'invited';
	}

	// Completed users are done
	if (assignment.status === 'completed') {
		return 'completed';
	}

	// If no progress record or no sessions, check how long since they started
	if (!progress || progress.sessionsCompleted === 0) {
		const daysSinceStart = Math.floor(
			(Date.now() - new Date(assignment.startsAt).getTime()) / (1000 * 60 * 60 * 24)
		);
		// If started more than 3 days ago with no sessions, needs attention
		if (daysSinceStart > 3) {
			return 'needs_attention';
		}
		return 'slow_progress';
	}

	// Check last session date
	if (progress.lastSessionAt) {
		const daysSinceLastSession = Math.floor(
			(Date.now() - new Date(progress.lastSessionAt).getTime()) / (1000 * 60 * 60 * 24)
		);

		// No activity for more than 5 days
		if (daysSinceLastSession > 5) {
			return 'needs_attention';
		}

		// No activity for 3-5 days
		if (daysSinceLastSession > 3) {
			return 'slow_progress';
		}
	}

	return 'on_track';
}

export const load: PageServerLoad = async () => {
	// Fetch all assignments with user and path data
	const assignmentsWithData = await db
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

	// Get progress data for each assignment
	const assignmentIds = assignmentsWithData.map((a) => a.assignmentId);

	// Aggregate progress per assignment
	const progressData =
		assignmentIds.length > 0
			? await db
					.select({
						assignmentId: weekProgress.assignmentId,
						sessionsCompleted: sql<number>`sum(${weekProgress.sessionsCompleted})::int`,
						totalMinutes: sql<number>`sum(${weekProgress.totalMinutes})::float`,
						lastSessionAt: sql<Date>`max(${weekProgress.lastSessionAt})`,
						currentStreakDays: sql<number>`max(${weekProgress.currentStreakDays})::int`
					})
					.from(weekProgress)
					.groupBy(weekProgress.assignmentId)
			: [];

	// Create a map for quick lookup
	const progressMap = new Map(progressData.map((p) => [p.assignmentId, p]));

	// Transform into LearnerWithPath objects
	const learners: LearnerWithPath[] = assignmentsWithData.map((row) => {
		const progressRecord = progressMap.get(row.assignmentId);

		const progress = progressRecord
			? {
					sessionsCompleted: progressRecord.sessionsCompleted || 0,
					totalMinutes: progressRecord.totalMinutes || 0,
					lastSessionAt: progressRecord.lastSessionAt,
					currentStreakDays: progressRecord.currentStreakDays || 0
				}
			: null;

		const assignment = {
			id: row.assignmentId,
			status: row.assignmentStatus,
			role: row.assignmentRole,
			currentDayIndex: row.currentDayIndex,
			currentWeekNumber: row.currentWeekNumber,
			startsAt: row.startsAt,
			completedAt: row.completedAt,
			lastEmailSentAt: row.lastEmailSentAt
		};

		return {
			id: row.userId,
			email: row.userEmail,
			displayName: row.userDisplayName,
			avatarUrl: row.userAvatarUrl,
			assignment,
			path: {
				id: row.pathId,
				title: row.pathTitle,
				targetLanguage: row.pathTargetLanguage,
				durationWeeks: row.pathDurationWeeks,
				mode: row.pathMode
			},
			progress,
			attentionStatus: calculateAttentionStatus(assignment, progress)
		};
	});

	// Group by status
	const grouped = {
		needsAttention: learners.filter((l) => l.attentionStatus === 'needs_attention'),
		slowProgress: learners.filter((l) => l.attentionStatus === 'slow_progress'),
		onTrack: learners.filter((l) => l.attentionStatus === 'on_track'),
		completed: learners.filter((l) => l.attentionStatus === 'completed'),
		invited: learners.filter((l) => l.attentionStatus === 'invited')
	};

	return {
		learners,
		grouped,
		stats: {
			total: learners.length,
			needsAttention: grouped.needsAttention.length,
			slowProgress: grouped.slowProgress.length,
			onTrack: grouped.onTrack.length,
			completed: grouped.completed.length,
			invited: grouped.invited.length
		}
	};
};
