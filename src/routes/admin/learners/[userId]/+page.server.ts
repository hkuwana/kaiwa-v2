// src/routes/admin/learners/[userId]/+page.server.ts

import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	learningPathAssignments,
	learningPaths,
	users,
	weekProgress,
	conversations,
	weekSessions
} from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export type LearnerSession = {
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
	sessions: LearnerSession[];
};

export const load: PageServerLoad = async ({ params, url }) => {
	const { userId } = params;
	const assignmentId = url.searchParams.get('assignment');

	// Fetch user
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId)
	});

	if (!user) {
		throw error(404, 'User not found');
	}

	// Fetch assignment(s) for this user
	let assignmentQuery = db
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

	const assignments = await assignmentQuery;

	if (assignments.length === 0) {
		throw error(404, 'No learning path assignments found for this user');
	}

	// Use specified assignment or first one
	const selectedAssignment = assignmentId
		? assignments.find((a) => a.assignmentId === assignmentId) || assignments[0]
		: assignments[0];

	// Fetch week progress for this assignment
	const progressRecords = await db
		.select()
		.from(weekProgress)
		.where(eq(weekProgress.assignmentId, selectedAssignment.assignmentId))
		.orderBy(weekProgress.createdAt);

	// Fetch sessions for each week
	const weekProgressDetails: WeekProgressDetail[] = [];

	for (const progress of progressRecords) {
		const sessions = await db
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
			weekNumber:
				progressRecords.indexOf(progress) + 1 || selectedAssignment.currentWeekNumber || 1,
			sessionsCompleted: progress.sessionsCompleted,
			totalMinutes: Number(progress.totalMinutes) || 0,
			lastSessionAt: progress.lastSessionAt,
			currentStreakDays: progress.currentStreakDays,
			activeDaysThisWeek: progress.activeDaysThisWeek,
			sessions
		});
	}

	// Also fetch recent conversations for this user (last 10)
	const recentConversations = await db
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
		learner: {
			id: user.id,
			email: user.email,
			displayName: user.displayName,
			avatarUrl: user.avatarUrl,
			createdAt: user.createdAt,
			lastUsage: user.lastUsage
		},
		assignment: {
			id: selectedAssignment.assignmentId,
			status: selectedAssignment.assignmentStatus,
			role: selectedAssignment.assignmentRole,
			currentDayIndex: selectedAssignment.currentDayIndex,
			currentWeekNumber: selectedAssignment.currentWeekNumber,
			startsAt: selectedAssignment.startsAt,
			completedAt: selectedAssignment.completedAt,
			emailRemindersEnabled: selectedAssignment.emailRemindersEnabled,
			lastEmailSentAt: selectedAssignment.lastEmailSentAt
		},
		path: {
			id: selectedAssignment.pathId,
			title: selectedAssignment.pathTitle,
			description: selectedAssignment.pathDescription,
			targetLanguage: selectedAssignment.pathTargetLanguage,
			durationWeeks: selectedAssignment.pathDurationWeeks,
			mode: selectedAssignment.pathMode,
			schedule: selectedAssignment.pathSchedule
		},
		allAssignments: assignments.map((a) => ({
			id: a.assignmentId,
			pathId: a.pathId,
			pathTitle: a.pathTitle,
			status: a.assignmentStatus
		})),
		weekProgress: weekProgressDetails,
		recentConversations,
		stats: {
			totalSessions: weekProgressDetails.reduce((sum, w) => sum + w.sessionsCompleted, 0),
			totalMinutes: weekProgressDetails.reduce((sum, w) => sum + w.totalMinutes, 0),
			totalConversations: recentConversations.length,
			completedConversations: recentConversations.filter((c) => c.endedAt !== null).length
		}
	};
};
