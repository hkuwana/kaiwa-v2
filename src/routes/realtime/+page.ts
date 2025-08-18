import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	// Automatically start conversation when user lands on realtime page
	// This aligns with the "Invisible Tutor" philosophy - no setup steps needed

	// Note: We can't directly start the conversation here due to SSR constraints
	// Instead, we'll set a flag that the component will use to auto-start
	return {
		autoStartConversation: true,
		defaultLanguage: 'en',
		defaultVoice: 'alloy'
	};
};
