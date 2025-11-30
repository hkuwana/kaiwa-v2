import { DEFAULT_VOICE } from '$lib/types/openai.realtime.types';
import type { Language } from '$lib/server/db/types';

const defaultLanguage: Language = {
	id: 'en',
	code: 'en',
	name: 'English',
	nativeName: 'English',
	isRTL: false,
	flag: '🇺🇸',
	hasRomanization: true,
	writingSystem: 'latin',
	supportedScripts: [],
	isSupported: true
};

export const load = async () => {
	// Automatically start conversation when user lands on realtime page
	// This aligns with the "Invisible Tutor" philosophy - no setup steps needed

	// Note: We can't directly start the conversation here due to SSR constraints
	// Instead, we'll set a flag that the component will use to auto-start
	return {
		autoStartConversation: true,
		defaultLanguage,
		defaultVoice: DEFAULT_VOICE
	};
};
