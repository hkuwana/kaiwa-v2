// 📝 InstructionsService - Manages AI instructions for different languages and contexts
// Plain TypeScript class with no Svelte dependencies

export interface LanguageInstructions {
	language: string;
	code: string;
	instructions: string;
	examples: string[];
	culturalNotes: string[];
}

export interface ConversationContext {
	type: 'casual' | 'formal' | 'business' | 'academic';
	level: 'beginner' | 'intermediate' | 'advanced';
	instructions: string;
}

export class InstructionsService {
	private languageInstructions: Map<string, LanguageInstructions> = new Map();
	private conversationContexts: Map<string, ConversationContext> = new Map();

	constructor() {
		this.initializeLanguageInstructions();
		this.initializeConversationContexts();
	}

	private initializeLanguageInstructions(): void {
		// Japanese
		this.languageInstructions.set('ja', {
			language: 'Japanese',
			code: 'ja',
			instructions: `You are a helpful Japanese language tutor. Help the user practice and improve their Japanese skills through natural conversation. Be patient, encouraging, and provide gentle corrections when needed. Pay special attention to pronunciation, honorifics (敬語), and cultural context. Use appropriate politeness levels and explain cultural nuances when relevant.`,
			examples: [
				'こんにちは (Konnichiwa) - Hello',
				'ありがとうございます (Arigatou gozaimasu) - Thank you very much',
				'お疲れ様です (Otsukaresama desu) - Good work/Thank you for your effort'
			],
			culturalNotes: [
				'Japanese has different politeness levels (敬語) used based on social context',
				'Bowing is an important cultural gesture',
				'Direct eye contact can be considered rude in some situations'
			]
		});

		// Korean
		this.languageInstructions.set('ko', {
			language: 'Korean',
			code: 'ko',
			instructions: `You are a helpful Korean language tutor. Help the user practice and improve their Korean skills through natural conversation. Be patient, encouraging, and provide gentle corrections when needed. Focus on pronunciation, honorifics (존댓말), and sentence structure. Help with formal vs informal speech patterns.`,
			examples: [
				'안녕하세요 (Annyeonghaseyo) - Hello',
				'감사합니다 (Kamsahamnida) - Thank you',
				'수고하셨습니다 (Sugohasyeosseumnida) - Good work/Thank you for your effort'
			],
			culturalNotes: [
				'Korean has formal (존댓말) and informal (반말) speech levels',
				'Age and social status determine which speech level to use',
				'Bowing is a common greeting gesture'
			]
		});

		// Chinese
		this.languageInstructions.set('zh', {
			language: 'Chinese',
			code: 'zh',
			instructions: `You are a helpful Chinese language tutor. Help the user practice and improve their Chinese skills through natural conversation. Be patient, encouraging, and provide gentle corrections when needed. Emphasize tones, character recognition, and cultural context. Help with simplified vs traditional characters if relevant.`,
			examples: ['你好 (Nǐ hǎo) - Hello', '谢谢 (Xièxie) - Thank you', '再见 (Zàijiàn) - Goodbye'],
			culturalNotes: [
				'Chinese is a tonal language with 4 main tones',
				'There are simplified and traditional character systems',
				'Family names come before given names'
			]
		});

		// Arabic
		this.languageInstructions.set('ar', {
			language: 'Arabic',
			code: 'ar',
			instructions: `You are a helpful Arabic language tutor. Help the user practice and improve their Arabic skills through natural conversation. Be patient, encouraging, and provide gentle corrections when needed. Focus on pronunciation, script reading, and cultural context. Pay attention to formal vs informal speech.`,
			examples: [
				'مرحبا (Marhaba) - Hello',
				'شكرا (Shukran) - Thank you',
				"مع السلامة (Ma'a as-salaama) - Goodbye"
			],
			culturalNotes: [
				'Arabic is written right-to-left',
				'There are many regional dialects',
				'Formal Arabic (Modern Standard Arabic) is used in media and formal situations'
			]
		});

		// Hebrew
		this.languageInstructions.set('he', {
			language: 'Hebrew',
			code: 'he',
			instructions: `You are a helpful Hebrew language tutor. Help the user practice and improve their Hebrew skills through natural conversation. Be patient, encouraging, and provide gentle corrections when needed. Emphasize pronunciation, script reading, and cultural context. Help with formal vs informal speech patterns.`,
			examples: [
				'שלום (Shalom) - Hello/Peace',
				'תודה (Toda) - Thank you',
				"להתראות (Lehitra'ot) - Goodbye"
			],
			culturalNotes: [
				'Hebrew is written right-to-left',
				'Modern Hebrew was revived in the 19th century',
				'Biblical Hebrew is still used in religious contexts'
			]
		});

		// English (default)
		this.languageInstructions.set('en', {
			language: 'English',
			code: 'en',
			instructions: `You are a helpful English language tutor. Help the user practice and improve their English skills through natural conversation. Be patient, encouraging, and provide gentle corrections when needed. Focus on pronunciation, grammar, and natural expression.`,
			examples: [
				'Hello - Greeting',
				'Thank you - Expressing gratitude',
				'How are you? - Asking about well-being'
			],
			culturalNotes: [
				'English has many regional variations and accents',
				'Informal speech is common in casual settings',
				'Direct communication is generally appreciated'
			]
		});
	}

	private initializeConversationContexts(): void {
		// Casual conversation
		this.conversationContexts.set('casual', {
			type: 'casual',
			level: 'beginner',
			instructions:
				'Keep the conversation light and friendly. Use simple vocabulary and encourage natural expression. Focus on everyday topics like hobbies, food, and daily activities.'
		});

		// Formal conversation
		this.conversationContexts.set('formal', {
			type: 'formal',
			level: 'intermediate',
			instructions:
				'Maintain a polite and respectful tone. Use appropriate honorifics and formal expressions. Focus on topics like work, education, and cultural exchange.'
		});

		// Business conversation
		this.conversationContexts.set('business', {
			type: 'business',
			level: 'advanced',
			instructions:
				'Use professional language and business vocabulary. Focus on topics like work, industry trends, and professional development. Maintain a formal but approachable tone.'
		});

		// Academic conversation
		this.conversationContexts.set('academic', {
			type: 'academic',
			level: 'advanced',
			instructions:
				'Use academic vocabulary and complex sentence structures. Focus on intellectual topics, research, and scholarly discussion. Encourage critical thinking and analysis.'
		});
	}

	// Get instructions for a specific language
	getLanguageInstructions(languageCode: string): LanguageInstructions | undefined {
		return this.languageInstructions.get(languageCode.toLowerCase());
	}

	// Get conversation context
	getConversationContext(contextType: string): ConversationContext | undefined {
		return this.conversationContexts.get(contextType);
	}

	// Generate custom instructions for a language and context
	generateCustomInstructions(
		languageCode: string,
		contextType: string = 'casual',
		level: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
	): string {
		const language = this.getLanguageInstructions(languageCode);
		const context = this.getConversationContext(contextType);

		if (!language) {
			return `You are a helpful language tutor. Help the user practice and improve their language skills through natural conversation. Be patient, encouraging, and provide gentle corrections when needed.`;
		}

		let baseInstructions = language.instructions;

		// Adjust for context
		if (context) {
			baseInstructions += ` This conversation should be ${context.type} in nature. ${context.instructions}`;
		}

		// Adjust for level
		switch (level) {
			case 'beginner':
				baseInstructions +=
					' Use simple vocabulary and short sentences. Provide lots of encouragement and gentle corrections.';
				break;
			case 'intermediate':
				baseInstructions +=
					' Use moderate vocabulary and encourage more complex expression. Provide helpful corrections and explanations.';
				break;
			case 'advanced':
				baseInstructions +=
					' Use advanced vocabulary and complex sentence structures. Challenge the user with sophisticated topics and nuanced corrections.';
				break;
		}

		return baseInstructions;
	}

	// Get all available languages
	getAvailableLanguages(): LanguageInstructions[] {
		return Array.from(this.languageInstructions.values());
	}

	// Get all available contexts
	getAvailableContexts(): ConversationContext[] {
		return Array.from(this.conversationContexts.values());
	}

	// Add custom language instructions
	addLanguageInstructions(instructions: LanguageInstructions): void {
		this.languageInstructions.set(instructions.code.toLowerCase(), instructions);
	}

	// Add custom conversation context
	addConversationContext(context: ConversationContext): void {
		this.conversationContexts.set(context.type, context);
	}
}

// Export a singleton instance
export const instructionsService = new InstructionsService();
