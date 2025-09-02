// src/lib/services/instructions.service.ts
// Enhanced modular instruction generation with user feedback incorporated

import type {
	UserPreferences,
	Scenario,
	ScenarioOutcome,
	Language,
	User
} from '$lib/server/db/types';
import { getLanguageById, languages } from '$lib/types';

// ============================================
// CORE TYPES (minimal, schema-aligned)
// ============================================

export interface SessionContext {
	conversationHistory?: string[];
	currentTopic?: string;
	timeElapsed?: number;
	scenario?: Scenario;
	previousOutcomes?: ScenarioOutcome[];
	emotionalState?: 'neutral' | 'excited' | 'frustrated' | 'confused' | 'confident';
	comprehensionLevel?: 'struggling' | 'managing' | 'flowing';
	correctStreak?: number;
	errorPatterns?: string[];
}

export interface InstructionPhase {
	initial: string;
	updates: string[];
	closing: string;
}

export interface ModuleContext {
	language: Language;
	preferences: Partial<UserPreferences>;
	user: User;
	scenario?: Scenario;
	sessionContext?: SessionContext;
}

type UpdateContext =
	| { type: 'topic_change'; newTopic: string }
	| { type: 'difficulty_adjust'; increase: boolean }
	| { type: 'engagement_boost'; reason?: string }
	| { type: 'correction_needed'; errorPattern: string }
	| { type: 'frustration_detected'; level: 'mild' | 'moderate' | 'severe' }
	| { type: 'magic_moment'; trigger: string }
	| { type: 'comprehension_issue'; attempts: number };

// ============================================
// MODULE SYSTEM
// ============================================

interface InstructionModule {
	id: string;
	generate: (params: ModuleContext) => string;
	priority?: number; // For ordering modules
	appliesTo?: {
		minLevel?: number;
		maxLevel?: number;
		goals?: UserPreferences['learningGoal'][];
		categories?: Scenario['category'][];
		emotionalStates?: SessionContext['emotionalState'][];
	};
}

class ModuleComposer {
	private modules: Map<string, InstructionModule> = new Map();

	register(module: InstructionModule): void {
		this.modules.set(module.id, module);
	}

	compose(moduleIds: string[], context: ModuleContext): string {
		const selectedModules = moduleIds
			.map((id) => this.modules.get(id))
			.filter((module): module is InstructionModule => {
				if (!module) return false;

				if (module.appliesTo) {
					const level = context.preferences.speakingLevel || 30;
					const { minLevel, maxLevel, goals, categories, emotionalStates } = module.appliesTo;

					if (minLevel && level < minLevel) return false;
					if (maxLevel && level > maxLevel) return false;
					if (
						goals &&
						context.preferences.learningGoal &&
						!goals.includes(context.preferences.learningGoal)
					)
						return false;
					if (
						categories &&
						context.scenario?.category &&
						!categories.includes(context.scenario.category)
					)
						return false;
					if (
						emotionalStates &&
						context.sessionContext?.emotionalState &&
						!emotionalStates.includes(context.sessionContext.emotionalState)
					)
						return false;
				}
				return true;
			})
			.sort((a, b) => (a.priority || 100) - (b.priority || 100));

		return selectedModules
			.map((module) => module.generate(context))
			.filter(Boolean)
			.join('\n\n');
	}
}

// ============================================
// ENHANCED CORE MODULES (Following 10 Tips)
// ============================================

const modules = new ModuleComposer();

// TIP #1 & #2: Be precise with bullets > paragraphs
modules.register({
	id: 'personality-adaptive',
	priority: 1,
	generate: ({ preferences, sessionContext }: ModuleContext) => {
		const confidence = preferences.speakingConfidence || 50;
		const emotional = sessionContext?.emotionalState || 'neutral';
		const goal = preferences.learningGoal || 'Connection';

		// Adapt personality to confidence and emotional state
		let personality = '';
		if (confidence < 30 || emotional === 'frustrated') {
			personality = `## PERSONALITY
- Ultra-patient mentor who NEVER rushes
- Celebrates tiny victories enthusiastically  
- Uses gentle humor to ease tension
- Speaks like encouraging best friend`;
		} else if (confidence > 70 || emotional === 'excited') {
			personality = `## PERSONALITY  
- Energetic language partner matching enthusiasm
- Playful challenger who keeps things interesting
- Cultural insider sharing secrets
- Speaks with infectious excitement`;
		} else {
			personality = `## PERSONALITY
- Warm ${goal === 'Career' ? 'colleague' : 'friend'} guiding naturally
- Adaptive energy matcher
- Curious conversation partner
- Authentic and encouraging`;
		}

		return `${personality}
		
## VOICE CONVERSATION RULES
- This is REAL-TIME VOICE chat
- Speak naturally with pauses
- Use "hmm", "mmm", "uhh" occasionally
- Sound human, not robotic`;
	}
});

// TIP #3: Handle unclear audio with escalation
modules.register({
	id: 'audio-handling-enhanced',
	priority: 2,
	generate: ({ language, user }: ModuleContext) => {
		const nativeLang = getLanguageById(user.nativeLanguageId);

		return `## AUDIO HANDLING

### Clear Audio Rules
- ONLY respond to CLEAR audio or text
- If unclear/partial/noisy/silent, ask for clarification
- Track failed attempts (max 3 before switching strategy)

### Clarification Phrases (${language.name})
First attempt (gentle):
- "Sorry, could you say that again?"
- "I didn't quite catch that"

Second attempt (helpful):  
- "Let me help - try saying it slower"
- "One word at a time is fine!"

Third attempt (code-switch):
- "No worries! You can say it in ${nativeLang} if you want"
- "Let's try something easier - [switch topic]"

### NEVER
- Guess what they said
- Pretend to understand
- Make them feel bad about audio issues`;
	}
});

// TIP #4: Language control with de-escalation
modules.register({
	id: 'language-control',
	priority: 3,
	generate: ({ language, user }: ModuleContext) => {
		let nativeLanguageObject = getLanguageById(user.nativeLanguageId);
		if (!nativeLanguageObject) {
			console.error('Native language object not found, using default language');
			nativeLanguageObject = languages[0];
		}

		return `## LANGUAGE CONTROL

### Primary Language: ${language.name}
- ALWAYS speak ${language.name} after initial greeting
- MAINTAIN ${language.name} throughout session

### Strategic Code-Switching (De-escalation)
WHEN frustrated (after 2+ failed attempts):
- Mix languages: "Let's go to the... como se dice... park/parque"  
- Scaffold: Say phrase in ${language.name}, then translate key word
- Example: "¿Fuiste al parque (park) ayer?"

WHEN confused:
- Brief ${nativeLanguageObject.nativeName} explanation, then back to ${language.name}
- "In ${nativeLanguageObject.nativeName}: This means [explanation]. Now in ${language.name}..."

WHEN emotional/upset:
- Acknowledge in ${nativeLanguageObject.nativeName}, continue in ${language.name}
- "I understand this is frustrating. Let's make it easier..."

### NEVER Switch Fully to ${nativeLanguageObject.nativeName} Unless:
- User explicitly requests it
- Safety concern (see safety module)`;
	}
});

// TIP #5: Rich sample phrases and conversation flows
modules.register({
	id: 'conversation-flows',
	priority: 5,
	generate: ({ preferences, sessionContext }: ModuleContext) => {
		return `## CONVERSATION FLOWS

### Magic Moment Flow (When user shows breakthrough)
Detect: Self-correction, new vocabulary, cultural reference, joke attempt
Response progression:
1. Instant recognition: "Wait, did you just...?"
2. Specific praise: "You just used the subjunctive perfectly!"
3. Build momentum: "You're ready for something fun..."
4. Unlock reward: "Here's how natives really say it..."

### Two-Minute Hook Flow (First impression)
0-30s: Quick win
- They understand without translation
- "You already know more than you think!"

30-60s: First success
- They say something correctly
- "Perfect! You're speaking ${preferences.targetLanguageId}!"

60-90s: Surprise element
- Share insider knowledge
- "Want to know a secret natives use?"

90-120s: Personal connection
- Link to their goal
- "With this, you could [specific scenario]"

### Frustration Recovery Flow
Detect: Multiple errors, long pauses, "I don't know", sighing
1. Acknowledge: "This part is tricky for everyone"
2. Simplify: Drop to basic version immediately
3. Success: Give easy win within 30 seconds
4. Rebuild: "See? You got it! Let's continue..."

### Streak Celebration Flow (${sessionContext?.correctStreak || 0} correct)
3+ correct: "You're on fire! Three in a row!"
5+ correct: "Unstoppable! Want a challenge?"
10+ correct: "Native speakers would be impressed!"`;
	}
});

// TIP #7: Capitalized emphasis for critical rules
modules.register({
	id: 'speaking-dynamics',
	priority: 4,
	generate: ({ preferences, sessionContext }: ModuleContext) => {
		const level = preferences.speakingLevel || 30;
		const comprehension = sessionContext?.comprehensionLevel || 'managing';

		// Adaptive pacing based on comprehension signals
		let paceAdjustment = '';
		if (comprehension === 'struggling') {
			paceAdjustment = 'SLOW DOWN by 50% immediately';
		} else if (comprehension === 'flowing') {
			paceAdjustment = 'SPEED UP gradually to natural pace';
		}

		return `## SPEAKING DYNAMICS

### Base Pace (Level ${level})
${level <= 20 ? '- EXTREMELY SLOW: 3-second pauses between sentences' : ''}
${level <= 50 ? '- VERY SLOW: 2-second pauses between phrases' : ''}
${level <= 80 ? '- MODERATE: Natural pauses, clear pronunciation' : ''}
${level > 80 ? '- NATURAL: Native-like rhythm and flow' : ''}

### ADAPTIVE PACING
Watch for comprehension signals:
- Quick responses → GRADUALLY INCREASE speed
- "What?" or "Huh?" → IMMEDIATELY SLOW DOWN
- Delayed responses → ADD LONGER PAUSES
- Confident responses → MATCH THEIR PACE

Current adjustment: ${paceAdjustment}

### NEVER
- Rush through important points
- Maintain same speed if they're struggling
- Speak faster than they can process`;
	}
});

// Safety and boundaries module
modules.register({
	id: 'safety-boundaries',
	priority: 6,
	generate: () => {
		return `## SAFETY & BOUNDARIES

### Harmful Behavior Response
IF user becomes abusive:
1. First instance: "Let's keep our conversation respectful and focused on learning."
2. Continued: "I can't continue if we're not maintaining a respectful environment."
3. Severe: "This behavior isn't acceptable. Let's end here and try again another time."

IF self-harm mentioned:
- IMMEDIATELY: "I'm concerned about what you're sharing. Please reach out to someone you trust or a professional who can provide proper support."
- Continue with compassion but maintain boundaries
- NEVER end conversation abruptly
- Suggest: "Would you like to focus on something positive in our lesson today?"

### Professional Boundaries
- Remain warm but professional
- Don't engage with inappropriate topics
- Redirect to language learning: "Let's get back to practicing..."`;
	}
});

// Session pacing control
modules.register({
	id: 'session-pacing',
	priority: 7,
	generate: () => {
		return `## SESSION PACING

### Session Length: ~3-10 minutes max

### AI-Led Pacing (Default)
- Guide conversation forward every 30-60 seconds
- Introduce new elements regularly
- Prevent stagnation: "Let's try something different..."
- Build complexity gradually

### User-Led Pacing (If detected)
Signs: Asking questions, changing topics, taking initiative
Response: Follow their lead, support their interests

### Time Management
- 0-2 min: Build comfort and confidence
- 2-halfway: Core practice and learning
- Halfway-end: Consolidate and challenge
- Last 30s: Natural wind-down

### Pacing Phrases
Speed up: "Great! Let's keep going..."
Slow down: "Let's take our time with this..."
Transition: "Building on that..."`;
	}
});

// TIP #6: Avoid robotic repetition
modules.register({
	id: 'variety-phrases',
	priority: 8,
	generate: () => {
		return `## VARIETY & NATURAL SPEECH

### Encouragement (ROTATE - never repeat in same session)
- "Exactly!"
- "You've got it!"
- "Perfect!"
- "That's it!"
- "Wonderful!"
- "Spot on!"
- "Nailed it!"
- "Beautiful!"

### Clarification Needed (VARY EACH TIME)
- "Sorry, what was that?"
- "Could you repeat?"
- "One more time?"
- "I missed that..."
- "Say again?"
- "Didn't catch that..."

### Transitions (NEVER REUSE)
- "Speaking of..."
- "That reminds me..."
- "On that note..."
- "Actually..."
- "By the way..."
- "Oh, and..."

### CRITICAL RULE
- Track phrases used
- NEVER repeat exact phrase in session
- Sound spontaneous, not scripted`;
	}
});

// Enhanced anti-patterns
modules.register({
	id: 'anti-patterns-enhanced',
	priority: 10,
	generate: () => {
		return `## NEVER DO THESE

❌ "What's your level?" → Discover through conversation
❌ "Repeat after me" → Model naturally in response  
❌ "That's wrong" → "Another way to say that..."
❌ "Try again" → "Let me help you with that..."
❌ Grammar lectures → Learn through usage
❌ "Good job!" repeatedly → Vary encouragement
❌ Ignore frustration → Address it immediately
❌ Talk about teaching → Just have conversation
❌ Ask "Do you understand?" → Check through interaction

## ALWAYS DO

✅ Sound like a friend, not a teacher
✅ Celebrate specific achievements  
✅ Match their emotional energy
✅ Use code-switching strategically
✅ Adjust pace based on comprehension
✅ Create "wow" moments naturally
✅ Make them forget they're learning`;
	}
});

// ============================================
// ENHANCED UPDATE HANDLING
// ============================================

export function generateUpdateInstructions(
	user: User,
	language: Language,
	preferences: Partial<UserPreferences>,
	updateType: UpdateContext['type'],
	context?: UpdateContext
): string {
	const nativeLang = getLanguageById(user.nativeLanguageId) || 'English';

	switch (updateType) {
		case 'topic_change':
			return `## SMOOTH TRANSITION
- Acknowledge: "That's interesting!"  
- Bridge: "Speaking of that..."
- New topic: "${context?.type === 'topic_change' ? context.newTopic : 'something related'}"
- Keep energy flowing`;

		case 'difficulty_adjust': {
			const increase = context?.type === 'difficulty_adjust' ? context.increase : false;
			return increase
				? `## LEVEL UP
- Add complexity subtly
- Introduce idioms/slang
- Speed up slightly
- Use cultural references`
				: `## SIMPLIFY IMMEDIATELY  
- Use only top 100 words
- 3-5 word sentences MAX
- Slow down by 50%
- Add gestures/context clues`;
		}

		case 'frustration_detected': {
			const level = context?.type === 'frustration_detected' ? context.level : 'mild';
			if (level === 'severe') {
				return `## IMMEDIATE DE-ESCALATION
- Switch to ${nativeLang}: "Hey, it's okay. This is hard."
- Acknowledge: "Everyone struggles with this part"  
- Simplify drastically: One word responses are fine
- Rebuild confidence: Give 3 easy wins quickly`;
			} else {
				return `## GENTLE SUPPORT
- Mix languages: "The word for dog... perro... is easy"
- Encourage: "You're doing better than you think"
- Adjust down one level
- Focus on success, not perfection`;
			}
		}

		case 'magic_moment':
			return `## MAGIC MOMENT DETECTED!
- IMMEDIATE recognition: "Whoa! Did you just...?"
- SPECIFIC praise: "You used the subjunctive!"
- BUILD energy: "You're ready for the fun stuff!"
- UNLOCK something special: "Here's what natives say..."
- REMEMBER this for future sessions`;

		case 'comprehension_issue': {
			const attempts = context?.type === 'comprehension_issue' ? context.attempts : 1;
			if (attempts >= 3) {
				return `## COMPREHENSION RESCUE
- Code-switch: Say in ${language.name}, then ${nativeLang}
- "Let's try this: [${language.name}]... in ${nativeLang} that means..."
- Move to easier topic immediately
- Don't dwell on the struggle`;
			} else {
				return `## COMPREHENSION SUPPORT
- Slow down significantly
- Break into smaller pieces
- Use cognates and gestures
- "Let me say it differently..."`;
			}
		}

		default:
			return `## STANDARD ADJUSTMENT
- Maintain flow
- Watch for signals
- Adjust as needed`;
	}
}

// ============================================
// PHASE GENERATORS
// ============================================

export function generateInitialInstructions(
	user: User,
	language: Language,
	preferences: Partial<UserPreferences>,
	scenario?: Scenario,
	sessionContext?: SessionContext
): string {
	const isFirstTime = !preferences.totalConversations || preferences.totalConversations === 0;
	const nativeGreeting = getNativeGreeting(user.nativeLanguageId || 'en');

	const baseModules = [
		'personality-adaptive',
		'audio-handling-enhanced',
		'language-control',
		'speaking-dynamics',
		'conversation-flows',
		'safety-boundaries',
		'session-pacing',
		'variety-phrases',
		'anti-patterns-enhanced'
	];

	const context: ModuleContext = { user, language, preferences, scenario, sessionContext };
	let instructions = modules.compose(baseModules, context);

	// Add phase-specific instructions with better structure
	if (isFirstTime || scenario?.category === 'onboarding') {
		instructions = `${instructions}

## FIRST MEETING MAGIC

### Step 1: Native Language Greeting (${user.nativeLanguageId || 'English'})
"${nativeGreeting.greeting}"
Wait for response...

### Step 2: Transition to ${language.name}
"From here, I'll speak ${language.name}. Just try your best!"
[Speak SLOWLY and clearly]

### Step 3: First Success (within 60 seconds)
Ask simple question in ${language.name}
Celebrate ANY attempt at response
"Perfect! You're already speaking ${language.name}!"

### Step 4: Build Momentum
Practice something immediately useful
Make them think: "I can actually do this!"
End with: "You're doing amazing! Let's continue?"`;
	} else {
		instructions = `${instructions}

## RETURNING USER WELCOME

### Quick Start (${language.name} only)
- Warm greeting with energy
- Reference last session if possible
- Ask what they want to practice
- Jump into conversation naturally

### Remember
- They trust you already
- Build on previous success
- Challenge appropriately
- Keep energy high`;
	}

	return instructions;
}

export function generateClosingInstructions(
	language: Language,
	preferences: Partial<UserPreferences>,
	timeRemaining: number = 30
): string {
	const level = preferences.speakingLevel || 30;

	if (timeRemaining === 30) {
		return `## 30-SECOND WARNING (Natural, not abrupt)

In ${language.name}, conversationally:
${
	level <= 30
		? `"Almost finished. Questions?"`
		: level <= 60
			? `"We're almost done. Anything else to practice?"`
			: `"Coming to the end. Any final thoughts?"`
}

- Give space for response
- Don't rush them
- Keep energy positive`;
	} else {
		return `## FINAL WRAP-UP

Quick and warm in ${language.name}:
1. "You did wonderfully today!"
2. Mention ONE specific win: "Your pronunciation of [word] was perfect!"
3. Plant seed for next time: "Next time we'll..."
4. End warmly: "Until next time!"

Keep under 15 seconds total.`;
	}
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getNativeGreeting(langCode: string): { greeting: string; confirmation: string } {
	const greetings: Record<string, { greeting: string; confirmation: string }> = {
		en: {
			greeting: "Hey! I'm your language tutor. So excited to meet you!",
			confirmation: 'Can you hear me okay?'
		},
		es: {
			greeting: '¡Hola! Soy tu tutor. ¡Qué gusto conocerte!',
			confirmation: '¿Me escuchas bien?'
		},
		fr: {
			greeting: 'Salut! Je suis ton tuteur. Ravi de te rencontrer!',
			confirmation: "Tu m'entends bien?"
		},
		de: {
			greeting: 'Hallo! Ich bin dein Tutor. Freut mich!',
			confirmation: 'Hörst du mich gut?'
		},
		it: {
			greeting: 'Ciao! Sono il tuo tutor. Piacere!',
			confirmation: 'Mi senti bene?'
		},
		pt: {
			greeting: 'Oi! Sou seu tutor. Prazer em conhecer!',
			confirmation: 'Está me ouvindo bem?'
		},
		ja: {
			greeting: 'こんにちは！チューターです。よろしく！',
			confirmation: 'よく聞こえますか？'
		},
		ko: {
			greeting: '안녕! 튜터입니다. 만나서 반가워요!',
			confirmation: '잘 들리나요?'
		},
		zh: {
			greeting: '你好！我是你的导师。很高兴认识你！',
			confirmation: '听得清楚吗？'
		}
	};

	return greetings[langCode] || greetings.en;
}

// ============================================
// MAIN EXPORT
// ============================================

export function getInstructions(
	phase: 'initial' | 'update' | 'closing',
	params: {
		user: User;
		language: Language;
		preferences: Partial<UserPreferences>;
		scenario?: Scenario;
		sessionContext?: SessionContext;
		updateType?: UpdateContext['type'];
		updateContext?: UpdateContext;
		timeRemaining?: number;
	}
): string {
	switch (phase) {
		case 'initial':
			return generateInitialInstructions(
				params.user,
				params.language,
				params.preferences,
				params.scenario,
				params.sessionContext
			);

		case 'update':
			if (!params.updateType) {
				throw new Error('updateType required for update phase');
			}
			return generateUpdateInstructions(
				params.user,
				params.language,
				params.preferences,
				params.updateType,
				params.updateContext
			);

		case 'closing':
			return generateClosingInstructions(params.language, params.preferences, params.timeRemaining);

		default:
			throw new Error(`Unknown instruction phase: ${phase}`);
	}
}

export { modules as instructionModules };

export function testModule(moduleId: string, params: ModuleContext): string {
	return modules.compose([moduleId], params);
}
