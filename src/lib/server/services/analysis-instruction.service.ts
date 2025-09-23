// src/lib/server/services/analysisInstruction.service.ts
// Pure utilities for generating analysis prompt instructions.
// These helpers are intentionally side-effect free so callers can unit test easily
// and understand exactly which text will be sent to OpenAI.

export type AnalysisFocus = 'preferences' | 'memories' | 'grammar' | 'revision';

export interface OnboardingAnalysisConfig {
	targetLanguage: string;
	scenarioCategory?: string | null;
	analysisFocus?: AnalysisFocus[];
}

export interface OnboardingInstructionPayload {
	systemPrompt: string;
	userPrompt: string;
	scenarioCategory: string;
	focusAreas: AnalysisFocus[];
}

const DEFAULT_ANALYSIS_FOCUS: AnalysisFocus[] = ['preferences', 'memories'];

const scenarioGuidelines: Record<string, string> = {
	general: `BASE GUIDELINES:
- Identify the learner's motivation, confidence, and specific goals.
- Capture any explicit personal facts or commitments as short "memories".
- Keep answers concise and evidence-based.`,
	onboarding: `ONBOARDING FOCUS:
- Prioritise extracting preferences that help craft a personalised learning plan.
- Collect any personal facts relevant to future conversations (family, work, travel plans).`,
	roleplay: `ROLEPLAY FOCUS:
- Pay attention to relationships, shared plans, and emotional tone.
- Extract concrete memories such as names, locations, commitments, or interests mentioned in the roleplay.`,
	comfort: `COMFORT SCENARIO FOCUS:
- Emphasise everyday interests, routines, and comfort levels with the language.
- Store memories that could improve small-talk or follow-up sessions.`,
	relationships: `RELATIONSHIP SCENARIO FOCUS:
- Capture interpersonal details (who they are speaking with, goals, anniversaries, shared preferences).
- Note communication challenges or emotional needs relevant to future coaching.`,
	basic: `BASIC SCENARIO FOCUS:
- Focus on foundational preferences and any blockers.
- Save memories about essential needs (work schedule, study constraints, key motivations).`
};

const focusDescriptions: Record<AnalysisFocus, string> = {
	preferences:
		'- Extract learning preferences, motivation, confidence, and tangible goals for personalisation.',
	memories:
		'- Collect short first-person memory strings that describe personal facts, relationships, or interests (e.g., "enjoys hiking", "planning a trip to Osaka").',
	grammar:
		'- Evaluate grammar strengths and issues. Summarise specific patterns that need revision.',
	revision:
		'- Identify points that should be reviewed in the next session (pronunciation, vocabulary gaps, misunderstandings).'
};

const OUTPUT_SCHEMA = `{
  "learningGoal": "Connection" | "Career" | "Travel" | "Academic" | "Culture" | "Growth",
  "speakingLevel": number (1-100),
  "listeningLevel": number (1-100),
  "speakingConfidence": number (1-100),
  "specificGoals": string[],
  "challengePreference": "comfortable" | "moderate" | "challenging",
  "correctionStyle": "immediate" | "gentle" | "end_of_session",
  "dailyGoalSeconds": 60 | 120 | 180 | 300,
  "memories": string[] (short personal facts or preferences for future conversations; return [] if none),
  "assessmentNotes": string (2-3 sentences summarising level, needs, and follow-up focus)
}`;

const OUTPUT_RULES = `RULES:
- Keep "memories" in English even if conversation is in another language.
- Use concise phrases for memories (under 80 characters each).
- Do not invent details without contextual clues; return an empty array when unsure.
- Do not include any explanation outside the JSON.`;

function resolveScenarioCategory(category?: string | null): string {
	if (!category) return 'general';
	const normalised = category.toLowerCase();
	return scenarioGuidelines[normalised] ? normalised : 'general';
}

function resolveFocusAreas(focus?: AnalysisFocus[]): AnalysisFocus[] {
	return Array.from(new Set([...DEFAULT_ANALYSIS_FOCUS, ...(focus ?? [])]));
}

function buildFocusSummary(focusAreas: AnalysisFocus[]): string {
	return focusAreas
		.map((focus) => focusDescriptions[focus])
		.filter(Boolean)
		.join('\n');
}

export function buildOnboardingInstructions(
	conversation: string,
	config: OnboardingAnalysisConfig
): OnboardingInstructionPayload {
	const scenarioCategory = resolveScenarioCategory(config.scenarioCategory);
	const focusAreas = resolveFocusAreas(config.analysisFocus);

	const scenarioGuideline = scenarioGuidelines[scenarioCategory] ?? scenarioGuidelines.general;
	const focusSummary = buildFocusSummary(focusAreas);

	const systemPrompt = `You are an expert language learning analyst. Analyse the conversation between a language tutor and student to extract structured insights. Work in the context of the ${scenarioCategory} scenario while remembering the student is learning ${config.targetLanguage}.

${scenarioGuideline}

FOCUS AREAS:
${focusSummary}

Respond ONLY with a valid JSON object matching the schema:
${OUTPUT_SCHEMA}

${OUTPUT_RULES}`;

	const userPrompt = `Analyze this conversation:\n\n${conversation}`;

	return {
		systemPrompt,
		userPrompt,
		scenarioCategory,
		focusAreas
	};
}

export default {
	buildOnboardingInstructions
};
