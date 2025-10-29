// src/lib/stores/custom-scenarios.store.svelte.ts
// Reactive store coordinating user-authored scenario workflow

import { browser } from '$app/environment';
import type { ScenarioWithHints } from '$lib/data/scenarios';
import {
	authorScenario,
	createScenario,
	deleteScenario,
	listUserScenarios,
	type AuthorScenarioRequest,
	type AuthorScenarioResponse,
	type CreateScenarioRequest,
	type ListUserScenariosResponse,
	type ScenarioMode,
	type ScenarioVisibility,
	type UserScenarioSummary
} from '$lib/services/scenarios/user-scenarios.service';
import { SvelteDate } from 'svelte/reactivity';

interface DraftState {
	status: 'idle' | 'authoring' | 'ready' | 'error';
	input: AuthorScenarioRequest;
	result: ScenarioWithHints | null;
	error: string | null;
}

interface LimitState {
	total: number;
	private: number;
	totalUsed: number;
	privateUsed: number;
}

const DEFAULT_LIMITS: LimitState = {
	total: 3,
	private: 0,
	totalUsed: 0,
	privateUsed: 0
};

export interface SaveScenarioResult {
	summary: UserScenarioSummary;
	scenario: ScenarioWithHints;
}

const generateId = (prefix = 'scenario'): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return `${prefix}-${crypto.randomUUID()}`;
	}
	return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
};

export class CustomScenarioStore {
	scenarios = $state<UserScenarioSummary[]>([]);
	customScenarios = $state<ScenarioWithHints[]>([]);
	limits = $state<LimitState>(DEFAULT_LIMITS);
	draft = $state<DraftState>({
		status: 'idle',
		input: { description: '', mode: 'character' },
		result: null,
		error: null
	});
	isLoading = $state(false);

	getScenarios = (): UserScenarioSummary[] => [...this.scenarios];
	getLimits = (): LimitState => ({ ...this.limits });
	getDraft = (): DraftState => ({ ...this.draft });
	get isBusy(): boolean {
		return this.isLoading || this.draft.status === 'authoring';
	}

	loadScenarios = async (visibility?: ScenarioVisibility) => {
		if (!browser) return;

		this.isLoading = true;

		try {
			const response = await listUserScenarios(visibility);
			this.applyListResponse(response);
		} catch (error) {
			console.error('Failed to load user scenarios', error);
		} finally {
			this.isLoading = false;
		}
	};

	getCustomScenarios = (): ScenarioWithHints[] => [...this.customScenarios];

	authorDraft = async (input: AuthorScenarioRequest): Promise<AuthorScenarioResponse | null> => {
		this.draft = {
			status: 'authoring',
			input,
			result: null,
			error: null
		};

		try {
			const response = await authorScenario(input);
			this.draft = {
				status: 'ready',
				input,
				result: response.draft,
				error: null
			};
			return response;
		} catch (error) {
			console.warn('Author draft failed, falling back to local generator', error);
			const draft = this.createLocalDraft(input);
			this.draft = {
				status: 'ready',
				input,
				result: draft,
				error: null
			};
			return {
				draft,
				sourceModel: 'local-fallback',
				tokensUsed: 0
			};
		}
	};

	resetDraft = () => {
		this.draft = {
			status: 'idle',
			input: { description: '', mode: 'character' },
			result: null,
			error: null
		};
	};

	updateDraftResult = (result: ScenarioWithHints) => {
		this.draft = {
			...this.draft,
			result,
			status: 'ready',
			error: null
		};
	};

	saveScenario = async (payload: CreateScenarioRequest): Promise<SaveScenarioResult | null> => {
		let summary: UserScenarioSummary;

		try {
			summary = await createScenario(payload);
		} catch (error) {
			console.warn('Failed to save custom scenario remotely, storing locally instead', error);
			summary = this.createLocalSummary(payload);
		}

		const scenario = this.buildScenarioRecord(summary, payload.scenario);
		this.scenarios = [summary, ...this.scenarios];
		this.customScenarios = [scenario, ...this.customScenarios];
		const visibility = summary.visibility ?? payload.visibility ?? 'public';
		this.incrementUsage(visibility);

		return {
			summary,
			scenario
		};
	};

	removeScenario = async (id: string) => {
		try {
			await deleteScenario(id);
			const scenario = this.scenarios.find((item) => item.id === id);
			this.scenarios = this.scenarios.filter((item) => item.id !== id);
			this.customScenarios = this.customScenarios.filter((item) => item.id !== id);
			if (scenario) {
				this.decrementUsage(scenario.visibility);
			}
		} catch (error) {
			console.error('Failed to delete custom scenario', error);
			throw error;
		}
	};

	private applyListResponse = (response: ListUserScenariosResponse) => {
		this.scenarios = response.scenarios;
		this.limits = {
			total: response.limit.total,
			private: response.limit.private,
			totalUsed: response.total,
			privateUsed: response.privateCount
		};
	};

	private incrementUsage = (visibility: ScenarioVisibility) => {
		this.limits = {
			...this.limits,
			totalUsed: this.limits.totalUsed + 1,
			privateUsed: visibility === 'private' ? this.limits.privateUsed + 1 : this.limits.privateUsed
		};
	};

	private decrementUsage = (visibility: ScenarioVisibility = 'public') => {
		this.limits = {
			...this.limits,
			totalUsed: Math.max(0, this.limits.totalUsed - 1),
			privateUsed:
				visibility === 'private'
					? Math.max(0, this.limits.privateUsed - 1)
					: this.limits.privateUsed
		};
	};

	private createLocalDraft = (input: AuthorScenarioRequest): ScenarioWithHints => {
		const id = generateId('draft');
		const createdAt = new SvelteDate();
		const role: ScenarioMode = input.mode ?? 'character';
		const title = input.description.slice(0, 40) || 'Custom Scenario';
		const description = input.description;
		const context = input.description;

		return {
			id,
			title,
			description,
			role,
			difficulty: 'intermediate',
			difficultyRating: 4,
			cefrLevel: 'B1',
			instructions: `You are practicing a custom scenario: ${description}. Respond naturally and help the learner reach their goal.`,
			context,
			persona: null,
			expectedOutcome: 'Complete the conversation with confidence.',
			learningObjectives: ['custom objective'],
			comfortIndicators: {
				confidence: 3,
				engagement: 4,
				understanding: 3
			},
			isActive: true,
			createdAt,
			updatedAt: createdAt
		};
	};

	private createLocalSummary = (payload: CreateScenarioRequest): UserScenarioSummary => {
		const scenario = payload.scenario;
		const id = generateId('scenario');
		const now = new SvelteDate().toISOString();
		const role = (scenario.role as ScenarioMode) || 'character';
		const visibility = payload.visibility ?? 'public';

		return {
			id,
			title: scenario.title || 'Custom Scenario',
			role,
			visibility,
			createdAt: now,
			updatedAt: now,
			usageCount: 0,
			createdBy: 'local-user'
		};
	};

	private buildScenarioRecord = (
		summary: UserScenarioSummary,
		scenario: ScenarioWithHints
	): ScenarioWithHints => {
		const now = new SvelteDate();
		return {
			...scenario,
			id: summary.id,
			createdAt: scenario.createdAt ?? now,
			updatedAt: now
		};
	};
}

export const customScenarioStore = new CustomScenarioStore();
