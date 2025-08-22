// 🎯 InstructionService - Updated to work with your DB schema
import type { User, Scenario, Language, Speaker } from '$lib/server/db/types';

// Types based on your actual schema

export interface TranscriptionEvent {
	type: 'user_transcript' | 'assistant_transcript';
	text: string;
	isFinal: boolean;
	timestamp: Date;
}

// Guest experience constants for impressive demos
export const GUEST_EXPERIENCES = {
	en: {
		language: 'en',
		personalizedGreeting: (name?: string) =>
			`Hello ${name || 'there'}! Welcome to our AI language tutoring experience. I'm excited to show you how I can help you master English through natural conversation!`,
		demoScenario: {
			id: 'guest-coffee-shop-en',
			title: 'Coffee Shop Conversation',
			description: 'Experience ordering coffee with real-time feedback',
			context:
				"You're in a cozy coffee shop in downtown. I'm your friendly barista, ready to take your order and chat!",
			goal: 'Order a coffee and engage in natural conversation',
			aiRole: 'friendly and patient barista',
			aiPersonality: 'encouraging, helpful, and naturally conversational',
			targetVocabulary: ['coffee', 'latte', 'cappuccino', 'medium', 'large', 'sugar', 'milk'],
			exampleResponses: [
				"I'd like a medium latte, please",
				'Can I get a cappuccino with extra foam?'
			]
		},
		showoffFeatures: [
			'Watch how I gently correct pronunciation in real-time',
			'Notice how I adapt my speaking speed to match yours',
			'See how I introduce new vocabulary naturally in context',
			'Experience how I keep the conversation flowing naturally',
			'Observe how I provide cultural context when relevant'
		],
		demoObjectives: [
			'Feel the natural flow of AI conversation',
			'Experience gentle, encouraging correction techniques',
			'See how vocabulary is introduced contextually',
			'Understand the personalized learning approach',
			'Get excited about accelerated language learning'
		]
	},
	ja: {
		language: 'ja',
		personalizedGreeting: (name?: string) =>
			`こんにちは${name ? `、${name}さん` : ''}！私たちのAI日本語チューターへようこそ。自然な会話を通して日本語を学ぶお手伝いができることを楽しみにしています！`,
		demoScenario: {
			id: 'guest-cafe-ordering-ja',
			title: 'カフェでの注文',
			description: 'リアルタイムフィードバック付きでコーヒーの注文を体験',
			context:
				'東京の素敵なカフェにいます。私は親切な店員で、ご注文をお聞きしたり、お話ししたりする準備ができています！',
			goal: 'コーヒーを注文し、自然な会話をする',
			aiRole: '親切で忍耐強いカフェ店員',
			aiPersonality: '励ましてくれる、助けになる、自然に会話する',
			targetVocabulary: ['コーヒー', 'ラテ', 'カプチーノ', 'Mサイズ', 'Lサイズ', '砂糖', 'ミルク'],
			exampleResponses: ['Mサイズのラテをお願いします', 'カプチーノを泡多めでお願いできますか？']
		},
		showoffFeatures: [
			'リアルタイムで発音を優しく修正する様子をご覧ください',
			'あなたの話すスピードに合わせて調整する様子をご確認ください',
			'文脈の中で新しい語彙を自然に紹介する方法をご体験ください',
			'会話を自然に続ける技術をご体験ください',
			'関連する文化的背景を提供する様子をご観察ください'
		],
		demoObjectives: [
			'AI会話の自然な流れを感じる',
			'優しく励ます修正技術を体験する',
			'語彙が文脈的に紹介される様子を見る',
			'個人化された学習アプローチを理解する',
			'加速的な言語学習に興奮する'
		]
	},
	es: {
		language: 'es',
		personalizedGreeting: (name?: string) =>
			`¡Hola${name ? `, ${name}` : ''}! Bienvenido a nuestra experiencia de tutoría de español con IA. ¡Estoy emocionado de mostrarte cómo puedo ayudarte a dominar el español a través de conversación natural!`,
		demoScenario: {
			id: 'guest-restaurant-es',
			title: 'En el Restaurante',
			description: 'Practica pidiendo comida con retroalimentación en tiempo real',
			context:
				'Estás en un restaurante acogedor en Barcelona. Soy tu camarero amable, listo para tomar tu pedido y charlar!',
			goal: 'Pedir comida y tener una conversación natural',
			aiRole: 'camarero amable y paciente',
			aiPersonality: 'alentador, servicial, y naturalmente conversacional',
			targetVocabulary: ['menú', 'paella', 'tapas', 'bebida', 'agua', 'vino', 'postre'],
			exampleResponses: ['Me gustaría la paella, por favor', '¿Qué tapas recomiendan?']
		},
		showoffFeatures: [
			'Observa cómo corrijo suavemente la pronunciación en tiempo real',
			'Nota cómo adapto mi velocidad de habla para coincidir con la tuya',
			'Ve cómo introduzco vocabulario nuevo naturalmente en contexto',
			'Experimenta cómo mantengo la conversación fluyendo naturalmente',
			'Observa cómo proporciono contexto cultural cuando es relevante'
		],
		demoObjectives: [
			'Siente el flujo natural de la conversación con IA',
			'Experimenta técnicas de corrección gentiles y alentadoras',
			'Ve cómo se introduce el vocabulario contextualmente',
			'Entiende el enfoque de aprendizaje personalizado',
			'Emociónate sobre el aprendizaje acelerado de idiomas'
		]
	}
} as const;

export class InstructionService {
	// 🎬 Generate instructions for authenticated users
	async generateUserInstructions(
		user: User,
		scenario?: Scenario,
		language?: Language,
		speaker?: Speaker
	): Promise<{
		instructions: string;
		sessionConfig: {
			language: string;
			voice: string;
			turnDetection: {
				type: string;
				threshold: number;
				prefix_padding_ms: number;
				silence_duration_ms: number;
			};
		};
	}> {
		const instructions = this.buildPersonalizedInstructions(user, scenario, language);
		const sessionConfig = this.buildSessionConfig(user, language, speaker);

		return { instructions, sessionConfig };
	}

	// ✨ Generate impressive guest experience
	generateGuestInstructions(
		languageCode: keyof typeof GUEST_EXPERIENCES,
		guestName?: string
	): {
		instructions: string;
		sessionConfig: {
			language: string;
			voice: string;
			turnDetection: {
				type: string;
				threshold: number;
				prefix_padding_ms: number;
				silence_duration_ms: number;
			};
		};
	} {
		const experience = GUEST_EXPERIENCES[languageCode];
		if (!experience) {
			throw new Error(`Guest experience not available for language: ${languageCode}`);
		}

		const instructions = this.buildGuestInstructions(experience, guestName);
		const sessionConfig = this.buildGuestSessionConfig(experience);

		return { instructions, sessionConfig };
	}

	// 🏗️ Build personalized instructions for registered users
	private buildPersonalizedInstructions(
		user: User,
		scenario?: Scenario,
		language?: Language
	): string {
		const targetLanguage = language?.name || 'the target language';
		const nativeLanguage = user.nativeLanguageId; // You'd need to resolve this to language name

		const parts = [
			`You are an expert ${targetLanguage} tutor speaking with ${user.displayName || user.username}.`,
			`Student profile: Learning ${targetLanguage}, native ${nativeLanguage} speaker.`,
			`User tier: ${user.defaultTier} (adjust complexity accordingly).`
		];

		// Add scenario context if provided
		if (scenario) {
			parts.push(`\nCurrent scenario: "${scenario.title}" - ${scenario.description}`);
			parts.push(`Context: ${scenario.context}`);
		}

		// Add tutoring guidelines based on user tier and scenario
		parts.push(
			'\nTutoring approach:',
			'- Speak naturally but adjust complexity to their subscription level',
			'- Gently correct mistakes by restating correctly',
			'- Ask follow-up questions to encourage conversation',
			'- Praise progress and effort',
			'- Keep conversations engaging and relevant'
		);

		// Tier-specific adjustments
		if (user.defaultTier === 'free') {
			parts.push('- Keep vocabulary simple and commonly used');
			parts.push('- Focus on basic conversational patterns');
		} else if (user.defaultTier === 'premium') {
			parts.push('- Introduce advanced vocabulary and nuanced expressions');
			parts.push('- Discuss cultural context and regional variations');
			parts.push('- Provide detailed explanations when requested');
		}

		return parts.join('\n');
	}

	// 🎭 Build impressive guest instructions
	private buildGuestInstructions(
		experience: (typeof GUEST_EXPERIENCES)[keyof typeof GUEST_EXPERIENCES],
		guestName?: string
	): string {
		const scenario = experience.demoScenario;

		const parts = [
			`You are an expert ${experience.language} tutor providing a demo experience.`,
			experience.personalizedGreeting(guestName),
			`\nDemo scenario: "${scenario.title}" - ${scenario.description}`,
			`Context: ${scenario.context}`,
			`Goal: ${scenario.goal}`,
			`Your role: ${scenario.aiRole}`,
			`Your personality: ${scenario.aiPersonality}`
		];

		if (scenario.targetVocabulary.length > 0) {
			parts.push(`Focus vocabulary: ${scenario.targetVocabulary.join(', ')}.`);
		}

		// Add demo objectives
		parts.push('\nDemo objectives:');
		experience.demoObjectives.forEach((objective) => {
			parts.push(`- ${objective}`);
		});

		// Showcase features naturally
		parts.push('\nDuring this demo, naturally showcase:');
		experience.showoffFeatures.forEach((feature) => {
			parts.push(`- ${feature}`);
		});

		parts.push(
			'\nDemo tutoring approach:',
			'- Be enthusiastic and welcoming',
			'- Showcase natural conversation flow',
			'- Demonstrate gentle correction techniques',
			'- Show how you adapt to their responses',
			'- Keep it engaging and impressive',
			'- Subtly highlight advanced features',
			'- End with encouragement to continue learning'
		);

		return parts.join('\n');
	}

	// ⚙️ Build session configuration
	private buildSessionConfig(user: User, language?: Language, speaker?: Speaker) {
		const languageCode = language?.code || user.nativeLanguageId;
		const voice = this.selectVoice(speaker?.openaiVoiceId || 'alloy');

		// Adjust turn detection based on user tier (premium users get more sensitive detection)
		const turnDetection = {
			type: 'server_vad',
			threshold: user.defaultTier === 'premium' ? 0.4 : 0.5,
			prefix_padding_ms: user.defaultTier === 'free' ? 500 : 300,
			silence_duration_ms: user.defaultTier === 'free' ? 800 : 500
		};

		return {
			language: languageCode,
			voice,
			turnDetection
		};
	}

	private buildGuestSessionConfig(
		experience: (typeof GUEST_EXPERIENCES)[keyof typeof GUEST_EXPERIENCES]
	) {
		const voice = this.selectVoice(experience.language);

		// Optimized for impressive demo experience
		const turnDetection = {
			type: 'server_vad',
			threshold: 0.45,
			prefix_padding_ms: 400,
			silence_duration_ms: 600
		};

		return {
			language: experience.language,
			voice,
			turnDetection
		};
	}

	// 🎵 Select appropriate voice
	private selectVoice(voiceId: string): string {
		const voices = [
			{ id: 'alloy', name: 'Alloy', description: 'Balanced and neutral', gender: 'neutral' },
			{ id: 'ash', name: 'Ash', description: 'Warm and friendly', gender: 'male' },
			{ id: 'ballad', name: 'Ballad', description: 'Expressive and engaging', gender: 'female' },
			{ id: 'core', name: 'Core', description: 'Clear and professional', gender: 'neutral' },
			{ id: 'sage', name: 'Sage', description: 'Clear and professional', gender: 'neutral' },
			{ id: 'verse', name: 'Verse', description: 'Expressive and engaging', gender: 'female' }
		];
		// Could enhance this to select different voices based on scenario context
		// e.g., more formal voice for business scenarios
		return voices.find((voice) => voice.id === voiceId)?.name || 'alloy';
	}

	// 🎯 Helper methods for getting available options
	getAvailableGuestLanguages(): (keyof typeof GUEST_EXPERIENCES)[] {
		return Object.keys(GUEST_EXPERIENCES) as (keyof typeof GUEST_EXPERIENCES)[];
	}

	getGuestExperience(languageCode: keyof typeof GUEST_EXPERIENCES) {
		return GUEST_EXPERIENCES[languageCode];
	}

	// 📊 Analytics helper for guest demos
	getGuestDemoAnalytics() {
		return {
			availableLanguages: this.getAvailableGuestLanguages(),
			featuresShowcased: Object.values(GUEST_EXPERIENCES)[0].showoffFeatures.length,
			objectives: Object.values(GUEST_EXPERIENCES)[0].demoObjectives.length
		};
	}
}

// Export singleton instance
export const instructionService = new InstructionService();
