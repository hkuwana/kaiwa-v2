import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { conversationSessionsRepository } from '$lib/server/repositories/conversationSessions.repository';
import { messagesRepository } from '$lib/server/repositories/messages.repository';

export const load: PageServerLoad = async ({ url, locals }) => {
	// Get user data from locals (set by hooks.server.ts)
	const user = locals.user || null;
	const sessionId = url.searchParams.get('sessionId');

	// If sessionId is provided, check if this conversation exists and its state
	if (sessionId && user) {
		const existingSession = await conversationSessionsRepository.getSessionById(sessionId);

		if (existingSession) {
			// If session exists and has ended (has endTime), redirect to analysis view
			if (existingSession.endTime) {
				throw redirect(302, `/analysis?sessionId=${sessionId}`);
			}

			// If session exists but hasn't ended, load it with messages for viewing
			const messages = await messagesRepository.getConversationMessages(sessionId);

			return {
				user,
				isGuest: false,
				sessionId: sessionId,
				existingSession,
				messages,
				isStaticView: true // Flag to indicate this is a static view of existing conversation
			};
		}
	}

	// Generate new sessionId if not provided
	const finalSessionId = sessionId || crypto.randomUUID();

	return {
		user,
		isGuest: !user,
		sessionId: finalSessionId,
		existingSession: null,
		messages: [],
		isStaticView: false
	};
};
