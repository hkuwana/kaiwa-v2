import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { conversationSessionsRepository } from '$lib/server/repositories/conversationSessions.repository';

export const load: PageServerLoad = async ({ url, locals }) => {
	const user = locals.user || null;
	const sessionId = url.searchParams.get('sessionId');

	// Require sessionId parameter
	if (!sessionId) {
		throw redirect(302, '/');
	}

	// For authenticated users, verify session exists and has ended
	if (user) {
		const existingSession = await conversationSessionsRepository.getSessionById(sessionId);

		// If session doesn't exist, redirect to home
		if (!existingSession) {
			throw error(404, 'Conversation session not found');
		}

		// If session hasn't ended yet, redirect back to conversation
		if (!existingSession.endTime) {
			throw redirect(302, `/conversation?sessionId=${sessionId}`);
		}

		return {
			user,
			isGuest: false,
			sessionId,
			conversationSession: existingSession
		};
	}

	// For guest users, just show the analysis interface
	return {
		user,
		isGuest: true,
		sessionId,
		conversationSession: null
	};
};