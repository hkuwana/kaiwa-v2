// 🎯 Sample Learning Scenarios
// Pre-built scenarios for common, overlooked situations

import type { LearningScenario } from './learning';

// 🍜 Japanese Scenarios (Kaiwa = 会話 = Conversation)
export const japaneseScenarios: LearningScenario[] = [
	{
		id: 'ja-cafe-ordering',
		languageId: 'ja',
		title: 'Ordering at a Café',
		description: 'Practice ordering coffee and food at a Japanese café',
		context: 'あなたは東京のカフェにいます。お腹が空いていて、コーヒーとケーキを注文したいです。',
		goal: 'コーヒーを一つとケーキを一つ注文してください。',
		difficulty: 'beginner',
		category: 'food',
		targetGrammar: 'polite form (-masu), counters (一つ)',
		targetVocabulary: ['コーヒー', 'ケーキ', 'お願いします', '一つ', 'ください'],
		exampleResponses: [
			'コーヒーを一つお願いします',
			'ケーキも一つお願いします',
			'コーヒーとケーキを一つずつください'
		],
		translationHints: {
			コーヒー: 'coffee',
			ケーキ: 'cake',
			お願いします: 'please',
			一つ: 'one',
			ください: 'please give me'
		},
		vocabularyPreview: ['コーヒー', 'ケーキ', 'お願いします'],
		aiRole: 'カフェのスタッフ',
		aiPersonality: '親切で丁寧',
		// 🎯 Success criteria for assessment
		successCriteria: {
			requiredVocabulary: ['コーヒー', 'ケーキ', 'お願いします'],
			optionalVocabulary: ['一つ', 'ください', 'ありがとう'],
			grammarPatterns: ['polite form', 'counters'],
			goalSteps: ['greet staff', 'order coffee', 'order cake', 'use polite language']
		},
		isActive: false,
		createdAt: null,
		updatedAt: null
	},
	{
		id: 'ja-directions-asking',
		languageId: 'ja',
		title: 'Asking for Directions',
		description: 'Learn how to ask for directions when lost in Japan',
		context: 'あなたは東京で道に迷っています。駅までの道順を聞きたいです。',
		goal: '駅までの道順を聞いてください。',
		difficulty: 'beginner',
		category: 'travel',
		targetGrammar: 'question particles (か), polite form',
		targetVocabulary: ['駅', '道', '教えて', 'ください', 'どこ', '行き方'],
		exampleResponses: [
			'駅までの道を教えてください',
			'駅はどこですか',
			'駅への行き方を教えてください'
		],
		translationHints: {
			駅: 'station',
			道: 'way/road',
			教えて: 'tell me',
			ください: 'please',
			どこ: 'where',
			行き方: 'how to get there'
		},
		vocabularyPreview: ['駅', '道', '教えて'],
		aiRole: '親切な通行人',
		aiPersonality: '親切で丁寧',
		// 🎯 Success criteria for assessment
		successCriteria: {
			requiredVocabulary: ['駅', '教えて', 'ください'],
			optionalVocabulary: ['道', 'どこ', '行き方', 'ありがとう'],
			grammarPatterns: ['polite form', 'question particles'],
			goalSteps: ['greet politely', 'ask for directions', 'use polite language', 'thank them']
		},
		isActive: false,
		createdAt: null,
		updatedAt: null
	},
	{
		id: 'ja-pharmacy-asking',
		languageId: 'ja',
		title: 'Asking for Medicine at a Pharmacy',
		description: "Practice asking for basic medicine when you're not feeling well",
		context: 'あなたは頭痛がして、薬局で薬を買いたいです。',
		goal: '頭痛の薬を買ってください。',
		difficulty: 'beginner',
		category: 'health',
		targetGrammar: 'polite form, が (suffering particle)',
		targetVocabulary: ['頭痛', '薬', 'あります', 'ください', '痛い'],
		exampleResponses: [
			'頭痛の薬はありますか',
			'頭が痛いので、薬をください',
			'頭痛の薬を買いたいです'
		],
		translationHints: {
			頭痛: 'headache',
			薬: 'medicine',
			あります: 'have/exist',
			ください: 'please give me',
			痛い: 'painful'
		},
		vocabularyPreview: ['頭痛', '薬', 'あります'],
		aiRole: '薬局の薬剤師',
		aiPersonality: '親切で専門的',
		// 🎯 Success criteria for assessment
		successCriteria: {
			requiredVocabulary: ['頭痛', '薬', 'あります'],
			optionalVocabulary: ['ください', '痛い', 'ありがとう'],
			grammarPatterns: ['polite form', 'が particle'],
			goalSteps: ['explain symptom', 'ask for medicine', 'use polite language']
		},
		isActive: false,
		createdAt: null,
		updatedAt: null
	}
];

// 🇪🇸 Spanish Scenarios
export const spanishScenarios: LearningScenario[] = [
	{
		id: 'es-restaurant-reservation',
		languageId: 'es',
		title: 'Making a Restaurant Reservation',
		description: 'Practice calling to make a dinner reservation',
		context: 'Quieres hacer una reserva para cenar en un restaurante español.',
		goal: 'Haz una reserva para 2 personas a las 8:00 PM.',
		difficulty: 'beginner',
		category: 'food',
		targetGrammar: 'present tense, time expressions',
		targetVocabulary: ['reserva', 'mesa', 'personas', 'hora', 'cenar'],
		exampleResponses: [
			'Quiero hacer una reserva para 2 personas',
			'¿Tienen mesa disponible a las 8:00?',
			'Me gustaría reservar una mesa para cenar'
		],
		translationHints: {
			reserva: 'reservation',
			mesa: 'table',
			personas: 'people',
			hora: 'time',
			cenar: 'to have dinner'
		},
		vocabularyPreview: ['reserva', 'mesa', 'personas'],
		aiRole: 'recepcionista del restaurante',
		aiPersonality: 'amable y profesional',
		// 🎯 Success criteria for assessment
		successCriteria: {
			requiredVocabulary: ['reserva', 'mesa', 'personas'],
			optionalVocabulary: ['hora', 'cenar', 'gracias'],
			grammarPatterns: ['present tense', 'time expressions'],
			goalSteps: ['greet politely', 'request reservation', 'specify details', 'confirm']
		},
		isActive: false,
		createdAt: null,
		updatedAt: null
	}
];

// 🇫🇷 French Scenarios
export const frenchScenarios: LearningScenario[] = [
	{
		id: 'fr-shopping-clothes',
		languageId: 'fr',
		title: 'Shopping for Clothes',
		description: 'Practice asking about clothes and trying them on',
		context: 'Vous êtes dans un magasin de vêtements et vous voulez essayer une chemise.',
		goal: 'Demandez à essayer une chemise et demandez la taille.',
		difficulty: 'beginner',
		category: 'shopping',
		targetGrammar: 'vouloir + infinitive, questions with est-ce que',
		targetVocabulary: ['chemise', 'essayer', 'taille', 'grande', 'petite'],
		exampleResponses: [
			'Je voudrais essayer cette chemise',
			'Quelle est la taille de cette chemise?',
			'Puis-je essayer cette chemise?'
		],
		translationHints: {
			chemise: 'shirt',
			essayer: 'to try on',
			taille: 'size',
			grande: 'large',
			petite: 'small'
		},
		vocabularyPreview: ['chemise', 'essayer', 'taille'],
		aiRole: 'vendeur de vêtements',
		aiPersonality: 'serviable et professionnel',
		// 🎯 Success criteria for assessment
		successCriteria: {
			requiredVocabulary: ['chemise', 'essayer', 'taille'],
			optionalVocabulary: ['grande', 'petite', 'merci'],
			grammarPatterns: ['vouloir + infinitive', 'questions'],
			goalSteps: ['ask to try on', 'ask about size', 'use polite language']
		},
		isActive: false,
		createdAt: null,
		updatedAt: null
	}
];

// 🇮🇹 Italian Scenarios
export const italianScenarios: LearningScenario[] = [
	{
		id: 'it-train-ticket',
		languageId: 'it',
		title: 'Buying a Train Ticket',
		description: 'Practice buying a train ticket at the station',
		context: 'Sei alla stazione e vuoi comprare un biglietto per Roma.',
		goal: 'Compra un biglietto per Roma per domani mattina.',
		difficulty: 'beginner',
		category: 'travel',
		targetGrammar: 'present tense, time expressions, prepositions',
		targetVocabulary: ['biglietto', 'Roma', 'domani', 'mattina', 'quanto costa'],
		exampleResponses: [
			'Vorrei un biglietto per Roma',
			'Per domani mattina, per favore',
			'Quanto costa il biglietto?'
		],
		translationHints: {
			biglietto: 'ticket',
			Roma: 'Rome',
			domani: 'tomorrow',
			mattina: 'morning',
			'quanto costa': 'how much does it cost'
		},
		vocabularyPreview: ['biglietto', 'Roma', 'domani'],
		aiRole: 'impiegato della biglietteria',
		aiPersonality: 'cortese e professionale',
		// 🎯 Success criteria for assessment
		successCriteria: {
			requiredVocabulary: ['biglietto', 'Roma', 'domani'],
			optionalVocabulary: ['mattina', 'quanto costa', 'grazie'],
			grammarPatterns: ['present tense', 'prepositions', 'time expressions'],
			goalSteps: ['request ticket', 'specify destination', 'specify time', 'ask price']
		},
		isActive: false,
		createdAt: null,
		updatedAt: null
	}
];

// 🎯 All Scenarios Combined
export const allScenarios: LearningScenario[] = [
	...japaneseScenarios,
	...spanishScenarios,
	...frenchScenarios,
	...italianScenarios
];

// 🔍 Scenario Lookup Functions
export function getScenariosByLanguage(languageId: string): LearningScenario[] {
	return allScenarios.filter((scenario) => scenario.languageId === languageId);
}

export function getScenariosByDifficulty(
	difficulty: 'beginner' | 'intermediate' | 'advanced'
): LearningScenario[] {
	return allScenarios.filter((scenario) => scenario.difficulty === difficulty);
}

export function getScenariosByCategory(category: string): LearningScenario[] {
	return allScenarios.filter((scenario) => scenario.category === category);
}

export function getScenarioById(id: string): LearningScenario | undefined {
	return allScenarios.find((scenario) => scenario.id === id);
}

// 🎯 Beginner Scenarios for Anonymous Users
export function getBeginnerScenariosForLanguage(languageId: string): LearningScenario[] {
	return getScenariosByLanguage(languageId).filter(
		(scenario) => scenario.difficulty === 'beginner'
	);
}

// 🎭 Scenario Categories for UI
export const scenarioCategories = [
	{ id: 'food', name: 'Food & Dining', emoji: '🍽️' },
	{ id: 'travel', name: 'Travel & Transportation', emoji: '✈️' },
	{ id: 'shopping', name: 'Shopping & Services', emoji: '🛍️' },
	{ id: 'health', name: 'Health & Wellness', emoji: '🏥' },
	{ id: 'social', name: 'Social & Casual', emoji: '👥' },
	{ id: 'business', name: 'Business & Professional', emoji: '💼' },
	{ id: 'education', name: 'Education & Learning', emoji: '📚' }
];
