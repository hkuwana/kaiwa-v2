// src/routes/admin/learners/[userId]/+page.server.ts

import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import {
	adminLearnersRepository,
	type LearnerDetail,
	type WeekProgressDetail as RepositoryWeekProgressDetail
} from '$lib/server/repositories/admin-learners.repository';

export type WeekProgressDetail = RepositoryWeekProgressDetail;
export type LearnerSession = RepositoryWeekProgressDetail['sessions'][number];

export const load: PageServerLoad = async ({ params, url }) => {
	const { userId } = params;
	const assignmentId = url.searchParams.get('assignment');

	const learnerDetail: LearnerDetail | undefined = await adminLearnersRepository.getLearnerDetail(
		userId,
		assignmentId
	);

	if (!learnerDetail) {
		throw error(404, 'User not found or no learning path assignments found for this user');
	}

	const { user, assignments, selectedAssignment, path, weekProgress, recentConversations } =
		learnerDetail;

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
			id: selectedAssignment.id,
			status: selectedAssignment.status,
			role: selectedAssignment.role,
			currentDayIndex: selectedAssignment.currentDayIndex,
			currentWeekNumber: selectedAssignment.currentWeekNumber,
			startsAt: selectedAssignment.startsAt,
			completedAt: selectedAssignment.completedAt,
			emailRemindersEnabled: selectedAssignment.emailRemindersEnabled,
			lastEmailSentAt: selectedAssignment.lastEmailSentAt
		},
		path: {
			id: path.id,
			title: path.title,
			description: path.description,
			targetLanguage: path.targetLanguage,
			durationWeeks: path.durationWeeks,
			mode: path.mode,
			schedule: path.schedule
		},
		allAssignments: assignments,
		weekProgress,
		recentConversations,
		stats: {
			totalSessions: weekProgress.reduce((sum, w) => sum + w.sessionsCompleted, 0),
			totalMinutes: weekProgress.reduce((sum, w) => sum + w.totalMinutes, 0),
			totalConversations: recentConversations.length,
			completedConversations: recentConversations.filter((c) => c.endedAt !== null).length
		}
	};
};
