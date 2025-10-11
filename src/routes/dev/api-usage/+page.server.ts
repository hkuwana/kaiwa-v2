import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { getUserFromSession } from '$lib/server/auth';

export const load = async ({ cookies }) => {
	const userId = await getUserFromSession(cookies);

	if (!userId) {
		return {
			userId: null,
			stats: null,
			summary: null,
			sessions: []
		};
	}

	const [stats, sessions] = await Promise.all([
		conversationSessionsRepository.getUserSessionStats(userId),
		conversationSessionsRepository.getUserSessions(userId, 50)
	]);

	const totalDurationSeconds = sessions.reduce(
		(acc, session) => acc + (session.durationSeconds ?? 0),
		0
	);
	const totalConsumedSeconds = sessions.reduce(
		(acc, session) => acc + (session.secondsConsumed ?? 0),
		0
	);
	const totalInputTokens = sessions.reduce((acc, session) => acc + (session.inputTokens ?? 0), 0);

	return {
		userId,
		stats,
		summary: {
			totalDurationSeconds,
			totalConsumedSeconds,
			totalInputTokens
		},
		sessions
	};
};
