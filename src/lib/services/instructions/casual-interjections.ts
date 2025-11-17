// src/lib/services/instructions/casual-interjections.ts
// Language-specific casual interjections and reactions for natural conversation
// These are common expressions native speakers use in everyday conversation

/**
 * Casual interjection categories
 */
export interface CasualInterjections {
	/** Positive reactions: "Nice!", "Cool!", "Awesome!" */
	positive: string[];
	/** Surprise reactions: "Really?", "No way!", "Seriously?" */
	surprise: string[];
	/** Understanding/agreement: "I see", "Got it", "Right" */
	understanding: string[];
	/** Sympathy/empathy: "Oh no", "That's tough", "I feel you" */
	sympathy: string[];
	/** Excitement: "Wow!", "Amazing!", "That's great!" */
	excitement: string[];
	/** Casual questions: "Like what?", "How come?", "Which one?" */
	questions: string[];
	/** Filler/thinking: "Hmm", "Let's see", "Well" */
	fillers: string[];
}

/**
 * Regional variation of casual expressions
 */
export interface RegionalCasualExpressions {
	/** Language code (e.g., 'ja', 'es', 'zh') */
	languageCode: string;
	/** Optional region (e.g., 'Tokyo', 'Osaka', 'Mexico', 'Spain') */
	region?: string;
	/** Display name for this variant */
	displayName: string;
	/** Casual interjections in this language/region */
	interjections: CasualInterjections;
	/** Natural filler words specific to this region */
	naturalFillers?: string[];
}

/**
 * Database of casual expressions by language and region
 */
export const CASUAL_EXPRESSIONS: RegionalCasualExpressions[] = [
	// ========================================
	// JAPANESE - Standard (Tokyo)
	// ========================================
	{
		languageCode: 'ja',
		region: 'Tokyo',
		displayName: 'Japanese (Standard)',
		interjections: {
			positive: [
				'いいね！', // Nice!
				'すごい！', // Cool!/Great!
				'素敵！', // Lovely!
				'良かった！', // That's good!
				'最高！', // Awesome!
				'そうだね！' // That's right!
			],
			surprise: [
				'本当？', // Really?
				'マジで？', // Seriously?
				'えー！', // Eh?! (surprise)
				'そうなの？', // Is that so?
				'信じられない！', // Unbelievable!
				'うそ！' // No way!
			],
			understanding: [
				'なるほど', // I see
				'そっか', // I get it
				'分かった', // Got it
				'うん、うん', // Yeah, yeah
				'そうですね', // Indeed
				'確かに' // True/For sure
			],
			sympathy: [
				'大変だね', // That's tough
				'お疲れ様', // You must be tired
				'残念', // That's a shame
				'気持ち分かる', // I understand how you feel
				'それは困るね' // That's troublesome
			],
			excitement: [
				'わあ！', // Wow!
				'やった！', // Yes!/I did it!
				'楽しみ！', // I'm excited!
				'うれしい！', // I'm happy!
				'素晴らしい！' // Wonderful!
			],
			questions: [
				'例えば？', // Like what?
				'どうして？', // Why?/How come?
				'どれ？', // Which one?
				'いつ？', // When?
				'本当に？', // Really?
				'どう思う？' // What do you think?
			],
			fillers: [
				'えーと', // Umm
				'あの', // Well
				'そうですね', // Let's see
				'まあ' // Well (casual)
			]
		},
		naturalFillers: ['ね', 'よ', 'さ', 'な']
	},

	// ========================================
	// JAPANESE - Kansai (Osaka)
	// ========================================
	{
		languageCode: 'ja',
		region: 'Osaka',
		displayName: 'Japanese (Kansai)',
		interjections: {
			positive: [
				'ええやん！', // Nice! (Kansai)
				'めっちゃええ！', // Really good!
				'ほんまええな！', // That's really good!
				'最高やん！' // Awesome! (Kansai)
			],
			surprise: [
				'ほんまに？', // Really? (Kansai)
				'マジで？', // Seriously?
				'えー！', // Eh?!
				'うそやん！' // No way! (Kansai)
			],
			understanding: [
				'なるほどな', // I see (Kansai)
				'せやな', // That's right (Kansai)
				'分かったわ', // Got it (Kansai)
				'ほんまやな' // True (Kansai)
			],
			sympathy: [
				'大変やな', // That's tough (Kansai)
				'しんどいな', // That's hard (Kansai)
				'お疲れさん' // Thanks for your hard work (Kansai)
			],
			excitement: [
				'めっちゃ楽しみ！', // Super excited! (Kansai)
				'ほんま嬉しい！', // Really happy! (Kansai)
				'すごいやん！' // That's great! (Kansai)
			],
			questions: [
				'なんで？', // Why? (Kansai casual)
				'どれやねん？', // Which one? (Kansai)
				'ほんまに？' // Really? (Kansai)
			],
			fillers: [
				'えーと', // Umm
				'あのな', // Well (Kansai)
				'まあな' // Well (Kansai casual)
			]
		},
		naturalFillers: ['な', 'やん', 'わ', 'ねん']
	},

	// ========================================
	// SPANISH - Spain
	// ========================================
	{
		languageCode: 'es',
		region: 'Spain',
		displayName: 'Spanish (Spain)',
		interjections: {
			positive: [
				'¡Guay!', // Cool! (Spain)
				'¡Genial!', // Great!
				'¡Qué bien!', // How nice!
				'¡Vale!', // OK!/Cool! (Spain)
				'¡Mola!', // Cool! (Spain slang)
				'¡Estupendo!' // Wonderful!
			],
			surprise: [
				'¿En serio?', // Really?
				'¿De verdad?', // For real?
				'¡No me digas!', // No way!/You don't say!
				'¿Sí?', // Yes? (surprised)
				'¡Madre mía!', // My goodness! (Spain)
				'¡Anda!' // Wow!/Really! (Spain)
			],
			understanding: [
				'Ya veo', // I see
				'Claro', // Of course/Clear
				'Entiendo', // I understand
				'Vale, vale', // OK, OK (Spain)
				'Tiene sentido', // Makes sense
				'Por supuesto' // Of course
			],
			sympathy: [
				'Qué pena', // What a shame
				'Lo siento', // I'm sorry
				'Qué mal', // That's bad
				'Vaya', // Oh dear
				'Qué fastidio' // What a nuisance
			],
			excitement: [
				'¡Qué guay!', // How cool! (Spain)
				'¡Increíble!', // Incredible!
				'¡Qué pasada!', // How awesome! (Spain)
				'¡Flipante!', // Amazing! (Spain slang)
				'¡Qué ilusión!' // How exciting!
			],
			questions: [
				'¿Cómo?', // How?/What?
				'¿Por qué?', // Why?
				'¿Cuál?', // Which one?
				'¿Cuándo?', // When?
				'¿Tipo qué?', // Like what?
				'¿De veras?' // Really?
			],
			fillers: [
				'Pues', // Well
				'A ver', // Let's see
				'Bueno', // Well
				'O sea' // I mean
			]
		},
		naturalFillers: ['¿no?', '¿eh?', 'tío', 'tía']
	},

	// ========================================
	// SPANISH - Mexico
	// ========================================
	{
		languageCode: 'es',
		region: 'Mexico',
		displayName: 'Spanish (Mexico)',
		interjections: {
			positive: [
				'¡Qué padre!', // Cool! (Mexico)
				'¡Genial!', // Great!
				'¡Qué chido!', // Cool! (Mexico slang)
				'¡Súper!', // Super!
				'¡Está bien!', // That's good!
				'¡Qué bueno!' // How good!
			],
			surprise: [
				'¿En serio?', // Really?
				'¿De verdad?', // For real?
				'¡No manches!', // No way! (Mexico)
				'¿A poco?', // Really? (Mexico)
				'¡Órale!', // Wow! (Mexico)
				'¿Neta?' // Really? (Mexico slang)
			],
			understanding: [
				'Ya veo', // I see
				'Claro', // Of course
				'Entiendo', // I understand
				'Órale, órale', // OK, OK (Mexico)
				'Ándale', // Right!/Exactly! (Mexico)
				'Simón' // Yes/Right (Mexico slang)
			],
			sympathy: [
				'Qué pena', // What a shame
				'Lo siento', // I'm sorry
				'Qué mal', // That's bad
				'Qué gacho', // That sucks (Mexico slang)
				'Qué lástima' // What a pity
			],
			excitement: [
				'¡Qué padre!', // How cool! (Mexico)
				'¡Increíble!', // Incredible!
				'¡Qué emoción!', // How exciting!
				'¡Padrísimo!', // Super cool! (Mexico)
				'¡Está chido!' // That's cool! (Mexico)
			],
			questions: [
				'¿Cómo?', // How?/What?
				'¿Por qué?', // Why?
				'¿Cuál?', // Which one?
				'¿Cuándo?', // When?
				'¿Cómo cuál?', // Like what?
				'¿En serio?' // Really?
			],
			fillers: [
				'Pues', // Well
				'A ver', // Let's see
				'Bueno', // Well
				'Este' // Umm (Mexico)
			]
		},
		naturalFillers: ['¿verdad?', '¿no?', 'wey', 'güey']
	},

	// ========================================
	// SPANISH - Argentina
	// ========================================
	{
		languageCode: 'es',
		region: 'Argentina',
		displayName: 'Spanish (Argentina)',
		interjections: {
			positive: [
				'¡Buenísimo!', // Great! (Argentina)
				'¡Genial!', // Great!
				'¡Copado!', // Cool! (Argentina)
				'¡Bárbaro!', // Awesome! (Argentina)
				'¡Qué bueno!', // How good!
				'¡Re bien!' // Really good! (Argentina)
			],
			surprise: [
				'¿En serio?', // Really?
				'¿Posta?', // Really? (Argentina)
				'¡No me digas!', // No way!
				'¡Qué decís!', // What are you saying! (Argentina)
				'¡Boludo!', // Dude! (Argentina, can express surprise)
				'¿De verdad?' // For real?
			],
			understanding: [
				'Ya veo', // I see
				'Claro', // Of course
				'Entiendo', // I understand
				'Dale, dale', // OK, OK (Argentina)
				'Sí, sí', // Yes, yes
				'Re claro' // Very clear (Argentina)
			],
			sympathy: [
				'Qué cagada', // That sucks (Argentina vulgar but common)
				'Qué bajón', // What a downer (Argentina)
				'Qué feo', // That's bad (Argentina)
				'Qué garrón', // What a drag (Argentina)
				'Lo siento' // I'm sorry
			],
			excitement: [
				'¡Qué copado!', // How cool! (Argentina)
				'¡Increíble!', // Incredible!
				'¡Qué groso!', // How great! (Argentina)
				'¡Zarpado!', // Awesome! (Argentina slang)
				'¡Re piola!' // Really cool! (Argentina)
			],
			questions: [
				'¿Cómo?', // How?/What?
				'¿Por qué?', // Why?
				'¿Cuál?', // Which one?
				'¿Cuándo?', // When?
				'¿Tipo qué?', // Like what? (Argentina)
				'¿Posta?' // Really? (Argentina)
			],
			fillers: [
				'Bueno', // Well
				'Che', // Hey (Argentina)
				'Este', // Umm
				'Y' // And (as filler)
			]
		},
		naturalFillers: ['boludo', 'che', 'viste', '¿viste?']
	},

	// ========================================
	// MANDARIN CHINESE - China
	// ========================================
	{
		languageCode: 'zh',
		region: 'China',
		displayName: 'Mandarin Chinese',
		interjections: {
			positive: [
				'不错！', // Not bad!/Good!
				'很好！', // Very good!
				'棒！', // Great!
				'厉害！', // Awesome!/Impressive!
				'太好了！', // That's great!
				'赞！' // Cool!/Like! (internet slang)
			],
			surprise: [
				'真的吗？', // Really?
				'是吗？', // Is that so?
				'啊？', // Huh?/What?
				'不会吧？', // No way?
				'天啊！', // Oh my!
				'我的妈呀！' // Oh my goodness!
			],
			understanding: [
				'哦', // Oh (understanding)
				'明白了', // I understand
				'懂了', // Got it
				'对对对', // Right, right, right
				'是啊', // Yes/That's right
				'原来如此' // I see/So that's how it is
			],
			sympathy: [
				'哎呀', // Oh dear
				'真糟糕', // That's terrible
				'太可惜了', // What a pity
				'好难过', // That's sad
				'辛苦了' // You've had it tough
			],
			excitement: [
				'哇！', // Wow!
				'太棒了！', // That's awesome!
				'太好了！', // That's great!
				'真厉害！', // Really impressive!
				'好激动！' // So excited!
			],
			questions: [
				'什么？', // What?
				'为什么？', // Why?
				'哪个？', // Which one?
				'什么时候？', // When?
				'比如说？', // Like what?/For example?
				'真的吗？' // Really?
			],
			fillers: [
				'嗯', // Umm
				'那个', // Umm/That (as filler)
				'就是', // It's just
				'其实' // Actually
			]
		},
		naturalFillers: ['啊', '呢', '吧', '哦']
	},

	// ========================================
	// FRENCH - France
	// ========================================
	{
		languageCode: 'fr',
		region: 'France',
		displayName: 'French (France)',
		interjections: {
			positive: [
				'Génial !', // Great!
				'Super !', // Super!
				'Cool !', // Cool!
				'Chouette !', // Nice! (a bit dated but still used)
				'Nickel !', // Perfect! (slang)
				'Top !' // Top!/Great! (modern slang)
			],
			surprise: [
				'Vraiment ?', // Really?
				'Sérieux ?', // Seriously?
				"C'est vrai ?", // Is that true?
				'Sans blague !', // No kidding!
				'Oh là là !', // Oh my!
				'Ah bon ?' // Really?/Is that so?
			],
			understanding: [
				'Je vois', // I see
				"D'accord", // OK/Agreed
				'Ah oui', // Ah yes
				'Compris', // Understood
				"C'est ça", // That's it
				'Exactement' // Exactly
			],
			sympathy: [
				'Oh non', // Oh no
				'Désolé', // Sorry
				'Dommage', // That's a shame
				'Quelle galère', // What a hassle (slang)
				"C'est nul" // That sucks (casual)
			],
			excitement: [
				'Génial !', // Great!
				'Trop bien !', // Too good!/So cool!
				'Incroyable !', // Incredible!
				'Trop cool !', // So cool!
				"J'adore !" // I love it!
			],
			questions: [
				'Comment ?', // How?/What?
				'Pourquoi ?', // Why?
				'Lequel ?', // Which one?
				'Quand ?', // When?
				'Genre quoi ?', // Like what? (casual)
				"C'est vrai ?" // Really?
			],
			fillers: [
				'Euh', // Umm
				'Ben', // Well (casual)
				'Alors', // So/Well
				'Bah', // Well (casual)
				'Donc' // So
			]
		},
		naturalFillers: ['quoi', 'hein', 'tu vois', 'voilà']
	},

	// ========================================
	// KOREAN
	// ========================================
	{
		languageCode: 'ko',
		displayName: 'Korean',
		interjections: {
			positive: [
				'좋아요!', // Good!/Nice!
				'대박!', // Awesome!/Daebak!
				'멋지다!', // Cool!
				'짱이에요!', // The best!
				'완전 좋아!', // Totally good!
				'굿!' // Good! (Konglish)
			],
			surprise: [
				'진짜요?', // Really?
				'정말이에요?', // Is that true?
				'헐!', // OMG! (slang)
				'어머!', // Oh my!
				'설마!', // No way!
				'대박!' // Wow!/Amazing!
			],
			understanding: [
				'아', // Ah (understanding)
				'그렇구나', // I see
				'알겠어요', // I understand
				'맞아요', // That's right
				'네네', // Yes, yes
				'그러네요' // That's true
			],
			sympathy: [
				'아이고', // Oh dear
				'안됐다', // That's too bad
				'속상하겠어요', // That must be upsetting
				'힘들겠어요', // That must be hard
				'수고했어요' // You worked hard
			],
			excitement: [
				'와!', // Wow!
				'대박!', // Amazing!
				'신난다!', // I'm excited!
				'좋다!', // Great!
				'최고예요!' // The best!
			],
			questions: [
				'뭐?', // What?
				'왜?', // Why?
				'어느 거?', // Which one?
				'언제?', // When?
				'예를 들면?', // Like what?
				'정말?' // Really?
			],
			fillers: [
				'음', // Umm
				'저', // Well (humble)
				'그', // Umm/That
				'뭐' // Well/What (as filler)
			]
		},
		naturalFillers: ['요', '네', '아', '어']
	},

	// ========================================
	// ENGLISH - General
	// ========================================
	{
		languageCode: 'en',
		displayName: 'English',
		interjections: {
			positive: ['Nice!', 'Cool!', 'Awesome!', 'Great!', 'Sweet!', 'Perfect!'],
			surprise: ['Really?', 'Seriously?', 'No way!', 'What?!', 'For real?', 'Wow!'],
			understanding: ['I see', 'Got it', 'Right', 'OK', 'Makes sense', 'Fair enough'],
			sympathy: ['Oh no', 'That sucks', "I'm sorry", "That's tough", 'Bummer', 'Aw man'],
			excitement: ['Wow!', 'Amazing!', "That's great!", 'So cool!', 'Love it!', 'Incredible!'],
			questions: [
				'Like what?',
				'How come?',
				'Which one?',
				'When?',
				'Really?',
				'What do you think?'
			],
			fillers: ['Umm', 'Well', "Let's see", 'So', 'I mean']
		},
		naturalFillers: ['you know', 'right', 'like', 'yeah']
	}
];

/**
 * Get casual expressions for a specific language and region
 */
export function getCasualExpressions(languageCode: string, region?: string): CasualInterjections {
	// Try to find exact match with region
	if (region) {
		const exactMatch = CASUAL_EXPRESSIONS.find(
			(expr) =>
				expr.languageCode === languageCode && expr.region?.toLowerCase() === region.toLowerCase()
		);
		if (exactMatch) {
			return exactMatch.interjections;
		}
	}

	// Fall back to language without region
	const languageMatch = CASUAL_EXPRESSIONS.find((expr) => expr.languageCode === languageCode);
	if (languageMatch) {
		return languageMatch.interjections;
	}

	// Default to English if not found
	const english = CASUAL_EXPRESSIONS.find((expr) => expr.languageCode === 'en');
	if (!english) {
		// Fallback to basic English expressions if somehow not found
		return {
			positive: ['Nice!', 'Cool!', 'Awesome!', 'Great!'],
			surprise: ['Really?', 'Seriously?', 'No way!', 'What?!'],
			understanding: ['I see', 'Got it', 'Right', 'OK'],
			sympathy: ['Oh no', 'That sucks', "I'm sorry", "That's tough"],
			excitement: ['Wow!', 'Amazing!', "That's great!", 'So cool!'],
			questions: ['Like what?', 'How come?', 'Which one?', 'When?'],
			fillers: ['Umm', 'Well', "Let's see", 'So']
		};
	}
	return english.interjections;
}

/**
 * Get natural filler words for a language/region
 */
export function getNaturalFillers(languageCode: string, region?: string): string[] {
	if (region) {
		const exactMatch = CASUAL_EXPRESSIONS.find(
			(expr) =>
				expr.languageCode === languageCode && expr.region?.toLowerCase() === region.toLowerCase()
		);
		if (exactMatch?.naturalFillers) {
			return exactMatch.naturalFillers;
		}
	}

	const languageMatch = CASUAL_EXPRESSIONS.find((expr) => expr.languageCode === languageCode);
	return languageMatch?.naturalFillers || [];
}

/**
 * Get all available regions for a language
 */
export function getAvailableRegions(languageCode: string): string[] {
	return CASUAL_EXPRESSIONS.filter((expr) => expr.languageCode === languageCode)
		.map((expr) => expr.region)
		.filter((region): region is string => region !== undefined);
}

/**
 * Determine whether we have language-specific casual expressions
 */
export function hasCasualExpressionsForLanguage(languageCode: string): boolean {
	return CASUAL_EXPRESSIONS.some((expr) => expr.languageCode === languageCode);
}

/**
 * Format casual expressions for instruction prompt
 */
export function formatCasualExpressionsForPrompt(
	languageCode: string,
	languageName: string,
	region?: string
): string {
	const expressions = getCasualExpressions(languageCode, region);
	const fillers = getNaturalFillers(languageCode, region);
	const hasCustomData = hasCasualExpressionsForLanguage(languageCode);

	const regionalInfo = CASUAL_EXPRESSIONS.find(
		(expr) =>
			expr.languageCode === languageCode &&
			(!region || expr.region?.toLowerCase() === region.toLowerCase())
	);

	const regionDisplay = hasCustomData && regionalInfo?.region ? ` (${regionalInfo.region})` : '';
	const headerTitle = hasCustomData
		? `## CASUAL EXPRESSIONS IN ${languageName.toUpperCase()}${regionDisplay}`
		: '## CASUAL EXPRESSIONS (GENERAL GUIDANCE)';
	const introLine = hasCustomData
		? "USE THESE NATURAL INTERJECTIONS - Don't always use formal textbook language!"
		: `We don't have language-specific examples for ${languageName} yet. Translate these short reactions into natural ${languageName} when you speak.`;

	let prompt = `${headerTitle}

${introLine}

### Positive Reactions
${expressions.positive.map((exp) => `- ${exp}`).join('\n')}

### Surprise Reactions
${expressions.surprise.map((exp) => `- ${exp}`).join('\n')}

### Understanding/Agreement
${expressions.understanding.map((exp) => `- ${exp}`).join('\n')}

### Sympathy/Empathy
${expressions.sympathy.map((exp) => `- ${exp}`).join('\n')}

### Excitement
${expressions.excitement.map((exp) => `- ${exp}`).join('\n')}

### Quick Questions
${expressions.questions.map((exp) => `- ${exp}`).join('\n')}

### Natural Fillers (use sparingly)
${expressions.fillers.map((exp) => `- ${exp}`).join('\n')}`;

	if (fillers.length > 0) {
		prompt += `

### Sentence-Ending Particles/Fillers
Use these naturally at the end of sentences: ${fillers.join(', ')}`;
	}

	prompt += `

### CRITICAL USAGE RULES:
- MIX these casual expressions into your responses naturally
- Use 1-2 of these per conversation turn to sound authentic
- VARY which ones you use - don't repeat the same expression
- These should replace overly formal textbook phrases
- Example: Instead of "That is very interesting indeed", ${
		hasCustomData
			? `say "${expressions.positive[0]}" or "${expressions.excitement[0]}"`
			: `use the ${languageName} equivalent of "${expressions.positive[0]}" or "${expressions.excitement[0]}"`
	}`;

	return prompt;
}
