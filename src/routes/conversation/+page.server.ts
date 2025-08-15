import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
	// Get query parameters
	const language = url.searchParams.get('language') || 'en';
	const voice = url.searchParams.get('voice') || 'alloy';
	const scenario = url.searchParams.get('scenario') || null;
	const speaker = url.searchParams.get('speaker') || null;
	const sessionId = url.searchParams.get('sessionId') || null;

	// If no sessionId, generate one and redirect
	if (!sessionId) {
		const newSessionId = crypto.randomUUID();
		const newUrl = new URL(url);
		newUrl.searchParams.set('sessionId', newSessionId);
		throw redirect(302, newUrl.toString());
	}

	// Get user info if authenticated
	const user = locals.user;
	// Default to intermediate level (B1) if no user level is available
	const userLevel = 350; // B1 level
	const formattedMemory = user ? generateFormattedMemory(user) : '';

	// Prepare conversation configuration
	const conversationConfig = {
		language,
		voice,
		userLevel,
		scenario: scenario ? JSON.parse(decodeURIComponent(scenario)) : null,
		speaker: speaker ? JSON.parse(decodeURIComponent(speaker)) : null,
		formattedMemory,
		sessionId
	};

	return {
		conversationConfig,
		user: user || null,
		isGuest: !user
	};
};

// Helper function to generate formatted memory from user data
function generateFormattedMemory(user: any): string {
	const memories = [];

	// Use available user properties
	if (user.nativeLanguageId) {
		memories.push(`NATIVE LANGUAGE: ${user.nativeLanguageId}`);
	}

	if (user.preferredUILanguageId) {
		memories.push(`PREFERRED UI LANGUAGE: ${user.preferredUILanguageId}`);
	}

	if (user.tier && user.tier !== 'free') {
		memories.push(`SUBSCRIPTION: ${user.tier} tier`);
	}

	// Add some default context for new users
	if (memories.length === 0) {
		return 'PERSONAL CONTEXT: This is a new learner. Focus on building rapport and understanding their interests.';
	}

	return `PERSONAL CONTEXT:\n${memories.join('\n')}`;
}
