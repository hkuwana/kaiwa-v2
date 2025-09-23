import { redirect } from '@sveltejs/kit';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { messagesRepository } from '$lib/server/repositories/messages.repository';

export const load = async ({ url, locals }) => {
	const user = locals.user || null;
	const sessionId = url.searchParams.get('sessionId');

	// Require sessionId parameter
	if (!sessionId) {
		throw redirect(302, '/');
	}

	// For authenticated users, try to verify session exists
	if (user) {
		try {
			const existingSession = await conversationSessionsRepository.getSessionById(sessionId);

			// If session exists and has ended, load it with messages
			if (existingSession && existingSession.endTime) {
				const messages = await messagesRepository.getConversationMessages(sessionId);

				return {
					user,
					isGuest: false,
					sessionId,
					conversationSession: existingSession,
					messages,
					hasExistingData: true
				};
			}

			// If session exists but hasn't ended yet, redirect back to conversation
			if (existingSession && !existingSession.endTime) {
				throw redirect(302, `/conversation?sessionId=${sessionId}`);
			}
		} catch (error) {
			console.warn('Could not load conversation session:', error);
			// Session might not be persisted yet (e.g., fresh conversation end)
			// Allow analysis to proceed with store data
		}

		// Session not found in DB - could be a fresh conversation end
		// Allow analysis page to proceed and use data from conversation store
		return {
			user,
			isGuest: false,
			sessionId,
			conversationSession: null,
			messages: [],
			hasExistingData: false,
			note: 'Session not found in database - using store data'
		};
	}

	// For guest users, just show the analysis interface
	return {
		user,
		isGuest: true,
		sessionId,
		conversationSession: null,
		messages: [],
		hasExistingData: false
	};
};
