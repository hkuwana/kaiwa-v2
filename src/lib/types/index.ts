// 🏗️ Core Types
// Centralized type definitions for the application

export interface Scenarios {
	id: string;
	title: string;
	description: string;
	targetVocabulary?: string[];
	culturalContext?: string;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	language: string;
}

export interface Speaker {
	id: string;
	voiceName: string;
	gender: 'male' | 'female' | 'neutral';
	dialectName: string;
	region: string;
	language: string;
	voiceId: string; // OpenAI voice ID
	openAIId?: string; // OpenAI voice ID for TTS
	languageId?: string; // Language code (e.g., 'en', 'ja')
	bcp47Code?: string; // BCP-47 language tag
	speakerEmoji?: string; // Flag emoji for the language
	voiceProviderId?: string; // Provider-specific voice ID
}
