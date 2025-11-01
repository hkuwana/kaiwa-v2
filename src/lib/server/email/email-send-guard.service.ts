import { analyticsEventsRepository } from '$lib/server/repositories/analytics-events.repository';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import type { User } from '$lib/server/db/types';

const WEEKLY_CAP_DEFAULT = 4;
const DEFAULT_ACTIVITY_WINDOW_HOURS = 48;

const TRACKED_EMAIL_EVENTS = new Set([
	'scenario_inspiration_sent',
	'community_story_sent',
	'weekly_digest_sent',
	'weekly_stats_sent',
	'practice_reminder_sent'
]);

export class EmailSendGuardService {
	static isWithinFounderSequence(user: User, days: number = 3): boolean {
		if (!user.createdAt) return false;
		const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
		return user.createdAt.getTime() > cutoff;
	}

	static async hasRecentPractice(userId: string, hours: number = DEFAULT_ACTIVITY_WINDOW_HOURS): Promise<boolean> {
		const now = new Date();
		const since = new Date(now.getTime() - hours * 60 * 60 * 1000);
		const sessions = await conversationSessionsRepository.getUserSessionsInRange(userId, since, now);
		return sessions.length > 0;
	}

	static async canSendAdditionalEmail(
		userId: string,
		weeklyCap: number = WEEKLY_CAP_DEFAULT
	): Promise<boolean> {
		const count = await this.getEmailSendCount(userId, 7);
		return count < weeklyCap;
	}

	static async getEmailSendCount(userId: string, days: number): Promise<number> {
		const now = new Date();
		const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
		const events = await analyticsEventsRepository.getAnalyticsEventsInDateRange(start, now, userId);
		return events.filter((event) => TRACKED_EMAIL_EVENTS.has(event.eventName)).length;
	}
}
