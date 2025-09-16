import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { conversationSessionsRepository } from '$lib/server/repositories/conversationSessions.repository';

export const load: PageServerLoad = async ({ url, locals }) => {
	// Get user data from locals (set by hooks.server.ts)
	const user = locals.user || null;
	const sessionId = url.searchParams.get('sessionId');

	// If sessionId is provided, check if this conversation has already ended
	if (sessionId && user) {
		const existingSession = await conversationSessionsRepository.getSessionById(sessionId);

		// If session exists and has ended (has endTime), redirect to analysis view
		if (existingSession && existingSession.endTime) {
			// Redirect to analysis view with the same sessionId
			throw redirect(302, `/analysis?sessionId=${sessionId}`);
		}
	}

	// Generate new sessionId if not provided
	const finalSessionId = sessionId || crypto.randomUUID();

	return {
		user,
		isGuest: !user,
		sessionId: finalSessionId
	};
};
