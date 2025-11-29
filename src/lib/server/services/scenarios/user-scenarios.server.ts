import type {
	AuthorScenarioRequest,
	AuthorScenarioResponse,
	ScenarioVisibility,
	ScenarioMode
} from '$lib/services/scenarios/user-scenarios.service';
import { randomUUID } from 'crypto';
import {
	type NewScenario,
	type Scenario,
	type ScenarioVisibility as ScenarioVisibilityEnum,
	type UserTier
} from '$lib/server/db/types';
import { scenarioRepository } from '$lib/server/repositories';
import { getUserCurrentTier } from '$lib/server/services/payment.service';
import { serverTierConfigs } from '$lib/server/tiers';
import { generateScenarioWithGPT } from '$lib/server/services/openai.service';
import { logger } from '$lib/logger';

export interface UserScenarioSummary {
	id: string;
	title: string;
	role: Scenario['role'];
	visibility: ScenarioVisibility;
	createdAt: string;
	updatedAt: string;
	usageCount: number;
}

export interface ListUserScenariosResult {
	scenarios: UserScenarioSummary[];
	total: number;
	privateCount: number;
	limit: {
		total: number;
		private: number;
	};
}

export class ScenarioLimitError extends Error {
	constructor(
		message: string,
		public readonly limit: number,
		public readonly used: number
	) {
		super(message);
		this.name = 'ScenarioLimitError';
	}
}

export class ScenarioNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ScenarioNotFoundError';
	}
}

const DEFAULT_TOTAL_LIMIT = 3;
const DEFAULT_PRIVATE_LIMIT = 0;
const UNLIMITED = -1;

function normalizeLimit(value: number | null | undefined, fallback: number): number {
	if (value === null || value === undefined) return fallback;
	if (value < 0) return UNLIMITED;
	return value;
}

function sanitizeText(input: string | null | undefined, fallback = ''): string {
	if (!input) return fallback;
	return input
		.replace(/<[^>]*>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function ensureScenarioId(scenario: Scenario): Scenario {
	if (scenario.id) return scenario;
	return {
		...scenario,
		id: randomUUID()
	};
}

function summarizeScenario(record: Scenario): UserScenarioSummary {
	return {
		id: record.id,
		title: record.title,
		role: record.role,
		visibility: record.visibility,
		createdAt: record.createdAt.toISOString(),
		updatedAt: record.updatedAt.toISOString(),
		usageCount: record.usageCount
	};
}

const DEFAULT_DIFFICULTY: Scenario['difficulty'] = 'intermediate';
const DEFAULT_CEFR = 'B1';

function normalizeCefrValue(value?: string | null): string | null {
	if (!value) return null;
	const upper = value.toUpperCase();
	const match = upper.match(/^[ABC][1-2]?/);
	return match ? match[0] : null;
}

function difficultyFromCefr(cefr: string | null): Scenario['difficulty'] {
	if (!cefr) return DEFAULT_DIFFICULTY;
	const prefix = cefr.charAt(0);
	if (prefix === 'A') return 'beginner';
	if (prefix === 'C') return 'advanced';
	return 'intermediate';
}

function cefrFromDifficulty(difficulty?: Scenario['difficulty']): string {
	switch (difficulty) {
		case 'beginner':
			return 'A2';
		case 'advanced':
			return 'C1';
		default:
			return DEFAULT_CEFR;
	}
}

function resolveDifficultyAndCefr(options: {
	difficulty?: Scenario['difficulty'];
	existingDifficulty?: Scenario['difficulty'];
	cefr?: string | null;
}): { difficulty: Scenario['difficulty']; cefr: string } {
	const normalizedCefr = normalizeCefrValue(options.cefr);
	if (normalizedCefr) {
		return {
			difficulty: difficultyFromCefr(normalizedCefr),
			cefr: normalizedCefr
		};
	}

	const difficulty =
		(options.difficulty as Scenario['difficulty']) ??
		options.existingDifficulty ??
		DEFAULT_DIFFICULTY;

	return {
		difficulty,
		cefr: cefrFromDifficulty(difficulty)
	};
}

async function getScenarioLimits(userTier: UserTier) {
	const tierConfig = serverTierConfigs[userTier];
	const totalLimit = normalizeLimit(tierConfig?.maxCustomScenarios, DEFAULT_TOTAL_LIMIT);
	const privateLimit = normalizeLimit(tierConfig?.maxPrivateCustomScenarios, DEFAULT_PRIVATE_LIMIT);

	return {
		totalLimit,
		privateLimit
	};
}

function validateScenarioLimit(limit: number, used: number, message: string) {
	if (limit === UNLIMITED) return;
	if (used >= limit) {
		throw new ScenarioLimitError(message, limit, used);
	}
}

function buildInsertPayload(input: {
	userId: string;
	scenario: Scenario;
	visibility: ScenarioVisibilityEnum;
}): NewScenario {
	const scenarioWithId = ensureScenarioId(input.scenario);
	const title = sanitizeText(scenarioWithId.title, 'Custom Scenario');
	const description = sanitizeText(scenarioWithId.description ?? scenarioWithId.context ?? '');
	const context = sanitizeText(scenarioWithId.context ?? description);
	const instructions = sanitizeText(
		scenarioWithId.instructions ?? `Help the learner practice: ${description}.`
	);
	const expectedOutcome = sanitizeText(
		scenarioWithId.expectedOutcome ?? 'Help the learner complete their goal confidently.'
	);

	const { difficulty, cefr } = resolveDifficultyAndCefr({
		difficulty: scenarioWithId.difficulty,
		cefr: scenarioWithId.cefrRecommendation ?? scenarioWithId.cefrLevel ?? null
	});

	return {
		id: scenarioWithId.id,
		title,
		description,
		role: scenarioWithId.role,
		difficulty,
		difficultyRating: scenarioWithId.difficultyRating ?? null,
		cefrLevel: cefr,
		learningGoal: scenarioWithId.learningGoal ?? null,
		cefrRecommendation: cefr,
		visibility: input.visibility,
		createdByUserId: input.userId,
		usageCount: 0,
		context,
		instructions,
		expectedOutcome,
		learningObjectives: scenarioWithId.learningObjectives ?? [],
		comfortIndicators: scenarioWithId.comfortIndicators ?? null,
		persona: scenarioWithId.persona ?? null,
		isActive: true,
		// Phase 1: Discovery & Sharing fields
		categories: scenarioWithId.categories ?? null,
		tags: scenarioWithId.tags ?? null,
		primarySkill: scenarioWithId.primarySkill ?? 'conversation',
		searchKeywords: scenarioWithId.searchKeywords ?? null,
		thumbnailUrl: scenarioWithId.thumbnailUrl ?? null,
		estimatedDurationSeconds: scenarioWithId.estimatedDurationSeconds ?? null,
		authorDisplayName: scenarioWithId.authorDisplayName ?? null,
		shareSlug: scenarioWithId.shareSlug ?? null,
		shareUrl: scenarioWithId.shareUrl ?? null
	};
}

export async function listUserScenariosForUser(options: {
	userId: string;
	visibility?: ScenarioVisibility;
}): Promise<ListUserScenariosResult> {
	const [tier, totalCount, privateCount, records] = await Promise.all([
		getUserCurrentTier(options.userId),
		scenarioRepository.countUserScenarios(options.userId),
		scenarioRepository.countPrivateUserScenarios(options.userId),
		scenarioRepository.listUserScenarios({
			userId: options.userId,
			visibility: options.visibility as ScenarioVisibilityEnum | undefined
		})
	]);

	const { totalLimit, privateLimit } = await getScenarioLimits(tier);

	return {
		scenarios: records.map(summarizeScenario),
		total: totalCount,
		privateCount,
		limit: {
			total: totalLimit,
			private: privateLimit
		}
	};
}

export async function createUserScenario(options: {
	userId: string;
	scenario: Scenario;
	visibility?: ScenarioVisibility;
}): Promise<UserScenarioSummary> {
	const visibility = (options.visibility ?? 'public') as ScenarioVisibilityEnum;
	const [tier, totalCount, privateCount] = await Promise.all([
		getUserCurrentTier(options.userId),
		scenarioRepository.countUserScenarios(options.userId),
		scenarioRepository.countPrivateUserScenarios(options.userId)
	]);
	const { totalLimit, privateLimit } = await getScenarioLimits(tier);

	validateScenarioLimit(
		totalLimit,
		totalCount,
		'Custom scenario limit reached for your current plan.'
	);

	if (visibility === 'private') {
		validateScenarioLimit(
			privateLimit,
			privateCount,
			'Private scenario limit reached for your current plan.'
		);
	}

	const payload = buildInsertPayload({
		userId: options.userId,
		scenario: options.scenario,
		visibility
	});

	const record = await scenarioRepository.createScenario(payload);
	return summarizeScenario(record);
}

export async function updateUserScenario(options: {
	userId: string;
	scenarioId: string;
	scenario?: Scenario;
	visibility?: ScenarioVisibility;
}): Promise<UserScenarioSummary> {
	const record = await scenarioRepository.findOwnedScenario(options.userId, options.scenarioId);

	if (!record) {
		throw new ScenarioNotFoundError('Scenario not found or no longer active.');
	}

	const existingScenario = record;
	const mergedScenario = options.scenario
		? ensureScenarioId({
				...existingScenario,
				...options.scenario,
				id: record.id
			})
		: existingScenario;

	const nextVisibility = (options.visibility ?? record.visibility) as ScenarioVisibilityEnum;

	const { difficulty, cefr } = resolveDifficultyAndCefr({
		difficulty: mergedScenario.difficulty ?? record.difficulty,
		existingDifficulty: record.difficulty,
		cefr:
			mergedScenario.cefrRecommendation ??
			mergedScenario.cefrLevel ??
			record.cefrRecommendation ??
			record.cefrLevel ??
			null
	});

	const updatedScenario: Partial<NewScenario> = {
		title: sanitizeText(mergedScenario.title, record.title),
		description: sanitizeText(
			mergedScenario.description ?? mergedScenario.context ?? record.description
		),
		role: mergedScenario.role,
		difficulty,
		difficultyRating: mergedScenario.difficultyRating ?? record.difficultyRating ?? null,
		cefrLevel: cefr,
		learningGoal: mergedScenario.learningGoal ?? record.learningGoal ?? null,
		cefrRecommendation: cefr,
		visibility: nextVisibility,
		context: sanitizeText(
			mergedScenario.context ?? record.context ?? mergedScenario.description ?? ''
		),
		instructions: sanitizeText(
			mergedScenario.instructions ??
				record.instructions ??
				`Help the learner practice: ${record.description}`
		),
		expectedOutcome: sanitizeText(
			mergedScenario.expectedOutcome ??
				record.expectedOutcome ??
				'Help the learner complete their goal confidently.'
		),
		learningObjectives: mergedScenario.learningObjectives ?? record.learningObjectives ?? [],
		comfortIndicators: mergedScenario.comfortIndicators ?? record.comfortIndicators ?? null,
		persona: mergedScenario.persona ?? record.persona ?? null
	};

	if (nextVisibility === 'private' && record.visibility !== 'private') {
		const tier = await getUserCurrentTier(options.userId);
		const { privateLimit } = await getScenarioLimits(tier);
		const privateCount = await scenarioRepository.countPrivateUserScenarios(options.userId);
		validateScenarioLimit(
			privateLimit,
			privateCount,
			'Private scenario limit reached for your current plan.'
		);
	}

	const updatedRecord = await scenarioRepository.updateScenarioForUser(
		options.scenarioId,
		options.userId,
		updatedScenario
	);

	if (!updatedRecord) {
		throw new ScenarioNotFoundError('Scenario update failed.');
	}

	return summarizeScenario(updatedRecord);
}

export async function deleteUserScenario(options: {
	userId: string;
	scenarioId: string;
}): Promise<void> {
	const deleted = await scenarioRepository.softDeleteScenarioForUser(
		options.scenarioId,
		options.userId
	);

	if (!deleted) {
		throw new ScenarioNotFoundError('Scenario not found or already deleted.');
	}
}

export async function getUserScenarioDetail(options: {
	userId: string;
	scenarioId: string;
}): Promise<Scenario> {
	const record = await scenarioRepository.findOwnedScenario(options.userId, options.scenarioId);

	if (!record) {
		throw new ScenarioNotFoundError('Scenario not found or inactive.');
	}

	return record;
}

// Shared scenario defaults
const SCENARIO_DEFAULTS = {
	comfortIndicators: { confidence: 3, engagement: 4, understanding: 3 },
	visibility: 'public' as const,
	createdByUserId: null,
	usageCount: 0,
	isActive: true,
	categories: null,
	tags: null,
	primarySkill: 'conversation' as const,
	searchKeywords: null,
	thumbnailUrl: null,
	estimatedDurationSeconds: null,
	authorDisplayName: null,
	shareSlug: null,
	shareUrl: null
};

function getDifficultyRating(difficulty: string): number {
	return difficulty === 'beginner' ? 2 : difficulty === 'advanced' ? 5 : 4;
}

function buildScenario(
	id: string,
	mode: ScenarioMode,
	content: {
		title: string;
		description: string;
		instructions: string;
		context: string;
		expectedOutcome: string;
		learningGoal: string;
		learningObjectives: string[];
		difficulty?: string;
		cefrLevel?: string;
		persona?: { title: string; introPrompt: string } | null;
	},
	now: Date
): Scenario {
	const difficulty = (content.difficulty || 'intermediate') as Scenario['difficulty'];
	const cefrLevel = content.cefrLevel || 'B1';
	return {
		id,
		title: content.title,
		description: content.description,
		role: mode === 'tutor' ? 'tutor' : 'character',
		difficulty,
		difficultyRating: getDifficultyRating(difficulty),
		cefrLevel,
		cefrRecommendation: cefrLevel,
		instructions: content.instructions,
		context: content.context,
		expectedOutcome: content.expectedOutcome,
		learningObjectives: content.learningObjectives,
		persona: content.persona ?? null,
		learningGoal: content.learningGoal,
		createdAt: now,
		updatedAt: now,
		...SCENARIO_DEFAULTS
	};
}

export async function generateScenarioDraft(
	request: AuthorScenarioRequest
): Promise<AuthorScenarioResponse> {
	const desc = sanitizeText(request.description, 'Custom conversation practice');
	const mode = (request.mode ?? 'character') as ScenarioMode;
	const now = new Date();
	const id = randomUUID();

	try {
		logger.info('🎭 [Scenario] Calling GPT', { desc: desc.slice(0, 100), mode });
		const { content, tokensUsed } = await generateScenarioWithGPT({
			description: desc,
			mode,
			languageId: request.languageId
		});
		return {
			draft: buildScenario(
				id,
				mode,
				{ ...content, title: content.title || desc.slice(0, 60) },
				now
			),
			sourceModel: 'gpt-4o-mini',
			tokensUsed
		};
	} catch (error) {
		logger.warn('🎭 [Scenario] GPT failed, using local', { error: (error as Error).message });
		return buildLocalScenario(id, desc, mode, now);
	}
}

export interface GenerateFromMemoriesRequest {
	memories: string[];
	mode?: ScenarioMode;
	languageId?: string;
}

export async function generateScenarioFromMemories(
	request: GenerateFromMemoriesRequest
): Promise<AuthorScenarioResponse> {
	const { memories = [], mode = 'character', languageId } = request;
	const now = new Date();
	const id = randomUUID();

	try {
		logger.info('🎭 [Scenario] Calling GPT for memories', { count: memories.length, mode });
		const { content, tokensUsed } = await generateScenarioWithGPT({ memories, mode, languageId });
		return { draft: buildScenario(id, mode, content, now), sourceModel: 'gpt-4o-mini', tokensUsed };
	} catch (error) {
		logger.warn('🎭 [Scenario] GPT failed for memories', { error: (error as Error).message });
		const memText = memories.slice(0, 5).join(' ');
		const desc = memText ? `Based on: ${memText}` : 'A personalized scenario from learner memories';
		const title = memories[0]
			? `Custom: ${memories[0].slice(0, 40)}${memories[0].length > 40 ? '...' : ''}`
			: 'Memory-Based Scenario';
		return buildLocalScenario(
			id,
			sanitizeText(desc, 'Custom conversation'),
			mode,
			now,
			title,
			memText
		);
	}
}

function buildLocalScenario(
	id: string,
	desc: string,
	mode: ScenarioMode,
	now: Date,
	customTitle?: string,
	memText?: string
): AuthorScenarioResponse {
	const title =
		customTitle || (desc.length > 60 ? `${desc.slice(0, 57)}...` : desc || 'Custom Scenario');
	const isTutor = mode === 'tutor';
	const ctx = memText ? `Based on interests (${memText}), ` : '';

	return {
		draft: buildScenario(
			id,
			mode,
			{
				title,
				description: desc,
				instructions: isTutor
					? `You are a supportive language tutor. ${ctx}Guide step by step, correct gently: ${desc}`
					: `You are roleplaying: ${desc}. ${ctx}Stay in character, be realistic.`,
				context: desc,
				expectedOutcome: isTutor
					? 'Learner practices key language and feels confident.'
					: 'Learner successfully navigates the situation naturally.',
				learningGoal: isTutor
					? 'Build confidence with scenario-specific language'
					: 'Handle the scenario naturally',
				learningObjectives: ['activate vocabulary', 'practice responses', 'build confidence'],
				persona: mode === 'character' ? { title: 'Conversation Partner', introPrompt: desc } : null
			},
			now
		),
		sourceModel: 'local-fallback',
		tokensUsed: 0
	};
}
