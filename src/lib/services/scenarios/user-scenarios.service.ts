// src/lib/services/scenarios/user-scenarios.service.ts
// Client-side helper for custom user-authored conversation scenarios

import type { ScenarioWithHints } from '$lib/data/scenarios';

export type ScenarioVisibility = 'public' | 'private';
export type ScenarioMode = 'tutor' | 'character';

export interface AuthorScenarioRequest {
	description: string;
	mode: ScenarioMode;
	languageId?: string;
}

export interface AuthorScenarioResponse {
	draft: ScenarioWithHints;
	tokensUsed?: number;
	sourceModel?: string;
}

export interface CreateScenarioRequest {
	scenario: ScenarioWithHints;
	visibility?: ScenarioVisibility;
}

export interface UserScenarioSummary {
	id: string;
	title: string;
	role: ScenarioMode;
	visibility: ScenarioVisibility;
	createdAt: string;
	updatedAt: string;
	usageCount: number;
	createdBy?: string;
}

export interface ListUserScenariosResponse {
	scenarios: UserScenarioSummary[];
	total: number;
	privateCount: number;
	limit: {
		total: number;
		private: number;
	};
}

const BASE_PATH = '/api/user-scenarios';

const toJSON = async <T>(response: Response): Promise<T> => {
	if (!response.ok) {
		const text = await response.text();
		throw new Error(text || `Request failed (${response.status})`);
	}
	return (await response.json()) as T;
};

export const authorScenario = async (
	payload: AuthorScenarioRequest,
	signal?: AbortSignal
): Promise<AuthorScenarioResponse> => {
	const response = await fetch(`${BASE_PATH}/author`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload),
		signal
	});

	return toJSON<AuthorScenarioResponse>(response);
};

export const createScenario = async (
	payload: CreateScenarioRequest,
	signal?: AbortSignal
): Promise<UserScenarioSummary> => {
	const response = await fetch(BASE_PATH, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload),
		signal
	});

	return toJSON<UserScenarioSummary>(response);
};

export const updateScenario = async (
	id: string,
	updates: Partial<CreateScenarioRequest>,
	signal?: AbortSignal
): Promise<UserScenarioSummary> => {
	const response = await fetch(`${BASE_PATH}/${id}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(updates),
		signal
	});

	return toJSON<UserScenarioSummary>(response);
};

export const deleteScenario = async (id: string, signal?: AbortSignal): Promise<void> => {
	const response = await fetch(`${BASE_PATH}/${id}`, {
		method: 'DELETE',
		signal
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(text || `Failed to delete scenario (${response.status})`);
	}
};

export const listUserScenarios = async (
	visibility?: ScenarioVisibility,
	signal?: AbortSignal
): Promise<ListUserScenariosResponse> => {
	const search = visibility ? `?visibility=${encodeURIComponent(visibility)}` : '';
	const response = await fetch(`${BASE_PATH}${search}`, {
		method: 'GET',
		signal
	});

	return toJSON<ListUserScenariosResponse>(response);
};
