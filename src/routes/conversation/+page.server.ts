import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { messagesRepository } from '$lib/server/repositories/messages.repository';

export const load = async ({ url, locals }) => {
	// Get user data from locals (set by hooks.server.ts)
	const user = locals.user || null;
	const sessionId = url.searchParams.get('sessionId');

	// If sessionId is provided, check if this conversation exists and its state
	if (sessionId && user) {
		const existingSession = await conversationSessionsRepository.getSessionById(sessionId);

		if (existingSession) {
			if (dev) {
				console.log('📋 [DEV] Found existing session in database:', {
					sessionId,
					hasEnded: !!existingSession.endTime,
					startTime: existingSession.startTime
				});
			}

			// If session exists and has ended (has endTime), redirect to analysis view
			if (existingSession.endTime) {
				if (dev) {
					console.log('🔄 [DEV] Redirecting to analysis - session has ended');
				}
				throw redirect(302, `/analysis?sessionId=${sessionId}`);
			}

			// If session exists but hasn't ended, load it with messages for viewing
			const messages = await messagesRepository.getConversationMessages(sessionId);

			if (dev) {
				console.log('👁️ [DEV] Loading existing conversation in static view mode', {
					messageCount: messages.length
				});
			}

			return {
				user,
				isGuest: false,
				sessionId: sessionId,
				existingSession,
				messages,
				isStaticView: true // Flag to indicate this is a static view of existing conversation
			};
		} else if (dev) {
			console.log('✨ [DEV] No existing session found - starting new conversation', {
				sessionId
			});
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
