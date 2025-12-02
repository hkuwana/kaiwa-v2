// src/routes/admin/learners/+page.server.ts

import type { PageServerLoad } from './$types';
import {
	adminLearnersRepository,
	type LearnerSummary
} from '$lib/server/repositories/admin-learners.repository';

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
	const summaries: LearnerSummary[] = await adminLearnersRepository.listLearnersWithProgress();

	// Transform into LearnerWithPath objects
	const learners: LearnerWithPath[] = summaries.map((summary) => {
		const assignment = summary.assignment;
		const progress = summary.progress;

		return {
			id: summary.user.id,
			email: summary.user.email,
			displayName: summary.user.displayName,
			avatarUrl: summary.user.avatarUrl,
			assignment,
			path: summary.path,
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
