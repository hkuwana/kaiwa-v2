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
}
