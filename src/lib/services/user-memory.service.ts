// src/lib/services/userMemory.service.ts
// Client-side wrapper for user memories and recent conversations

import type { Language, UserPreferences } from '$lib/server/db/types';

export interface MemorySummary {
	memories: string[];
	count: number;
	maxCount: number;
	withinLimit: boolean;
}

export interface RecentConversationSummary {
	id: string;
	title: string | null;
	targetLanguageId: string;
	scenarioId?: string | null;
	isOnboarding?: string | null;
	startedAt: string;
	endedAt?: string | null;
	durationSeconds?: number | null;
	messageCount?: number | null;
}

// Fetch current memories for the authenticated user
export async function getMemories(userId: string): Promise<MemorySummary> {
	const res = await fetch(`/api/users/${userId}/preferences`, { method: 'GET' });
	if (!res.ok) throw new Error('Failed to fetch memories');
	const data = await res.json();
	// Expected shape from createSuccessResponse({ ... })
	return data.data.memories as MemorySummary;
}

// Replace memories (validates against tier limits server-side)
export async function updateMemories(userId: string, memories: string[]): Promise<MemorySummary> {
	const res = await fetch(`/api/users/${userId}/preferences`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ memories })
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err?.error || 'Failed to update memories');
	}
	const data = await res.json();
	return data.data as MemorySummary;
}

// Get recent conversations for the authenticated user
export async function getRecentConversations(
	limit = 10,
	languageId?: string
): Promise<RecentConversationSummary[]> {
	const params = new URLSearchParams({ limit: String(limit) });
	if (languageId) params.set('languageId', languageId);

	const res = await fetch(`/api/conversations?${params.toString()}`, { method: 'GET' });
	if (!res.ok) throw new Error('Failed to fetch conversations');
	const data = await res.json();
	return (data.data?.conversations || []) as RecentConversationSummary[];
}

// Build a short instruction snippet from memories + recent topics
export function buildMemoryInstruction(
	preferences: Partial<UserPreferences>,
	language: Language,
	opts?: { maxMemories?: number; maxTopics?: number }
): string {
	const memories = preferences.memories as string[] | undefined;
	const recentTopics = preferences.conversationContext?.recentTopics as string[] | undefined;

	const topMemories = (memories || []).slice(0, opts?.maxMemories ?? 5);
	const topTopics = (recentTopics || []).slice(0, opts?.maxTopics ?? 3);

	if (topMemories.length === 0 && topTopics.length === 0) return '';

	const parts: string[] = [
		`## MEMORY CONTEXT (for personalization, do not recite)`,
		`- Weave these facts naturally into ${language.name} conversation only`,
		`- Use as hints to choose topics, not as a script`
	];

	if (topMemories.length) {
		parts.push('\n### Learner Facts');
		parts.push('- ' + topMemories.join('\n- '));
	}

	if (topTopics.length) {
		parts.push('\n### Recent Topics');
		parts.push('- ' + topTopics.join('\n- '));
	}

	return parts.join('\n');
}

export default {
	getMemories,
	updateMemories,
	getRecentConversations,
	buildMemoryInstruction
};
