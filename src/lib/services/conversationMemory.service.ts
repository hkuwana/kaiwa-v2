// src/lib/services/conversationMemory.service.ts
// Utility helpers for normalizing and limiting conversation memories before persisting.

import type { UserTier } from '$lib/data/tiers';

export type MemoryList = string[];

export interface MemoryMergeOptions {
	existing?: MemoryList;
	incoming?: MemoryList;
	tier?: UserTier;
	maxCharactersOverride?: number;
}

const DEFAULT_CHAR_LIMITS: Record<UserTier, number> = {
	free: 600,
	plus: 1800,
	premium: 3200
};

/**
 * Ensure we always have tidy, unique memory strings.
 */
export function sanitizeMemories(memories: MemoryList | undefined | null): MemoryList {
	if (!memories || memories.length === 0) return [];

	const seen = new Set<string>();
	const cleaned: string[] = [];

	for (const raw of memories) {
		if (typeof raw !== 'string') continue;
		const normalized = raw.trim();
		if (!normalized) continue;
		const lower = normalized.toLowerCase();
		if (seen.has(lower)) continue;
		seen.add(lower);
		cleaned.push(normalized);
	}

	return cleaned;
}

/**
 * Simple helper to count total characters across memories.
 */
export function getCharacterCount(memories: MemoryList): number {
	return memories.reduce((total, memory) => total + memory.length, 0);
}

/**
 * Resolve the character limit for a tier.
 */
export function getMemoryCharacterLimit(
	tier: UserTier = 'free',
	override?: number
): number {
	if (override && override > 0) {
		return override;
	}
	return DEFAULT_CHAR_LIMITS[tier] ?? DEFAULT_CHAR_LIMITS.free;
}

/**
 * Clip memories from the end until the character limit is respected.
 * Assumes the first items are the newest so we remove from the tail.
 */
export function enforceCharacterLimit(
	memories: MemoryList,
	limit: number
): MemoryList {
	const safeLimit = Math.max(limit, 0);
	const result = [...memories];

	while (result.length > 0 && getCharacterCount(result) > safeLimit) {
		result.pop();
	}

	return result;
}

/**
 * Merge incoming memories, prioritising new ones while keeping existing context.
 */
export function mergeMemories({
	existing = [],
	incoming = [],
	tier = 'free',
	maxCharactersOverride
}: MemoryMergeOptions): MemoryList {
	const sanitizedExisting = sanitizeMemories(existing);
	const sanitizedIncoming = sanitizeMemories(incoming);

	if (sanitizedIncoming.length === 0) {
		return enforceCharacterLimit(
			sanitizedExisting,
			getMemoryCharacterLimit(tier, maxCharactersOverride)
		);
	}

	const combined: string[] = [];
	const seen = new Set<string>();

	// Prioritise new memories so they survive trimming
	for (const memory of [...sanitizedIncoming, ...sanitizedExisting]) {
		const key = memory.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		combined.push(memory);
	}

	return enforceCharacterLimit(
		combined,
		getMemoryCharacterLimit(tier, maxCharactersOverride)
	);
}

/**
 * Extract ready-to-store memories from an arbitrary analysis payload.
 * We expect the upstream analysis service to provide an array of strings or
 * a property named `memories` in the data object.
 */
export function extractMemoriesFromAnalysis(
	analysisData: unknown
): MemoryList {
	if (!analysisData || typeof analysisData !== 'object') return [];

	const maybeMemories = (analysisData as { memories?: unknown }).memories;
	if (!Array.isArray(maybeMemories)) return [];

	return sanitizeMemories(maybeMemories as MemoryList);
}

/**
 * Determine whether persisting the merged memories would stay within tier limits.
 */
export function canStoreMemories(options: MemoryMergeOptions): boolean {
	const merged = mergeMemories(options);
	const limit = getMemoryCharacterLimit(options.tier ?? 'free', options.maxCharactersOverride);
	return getCharacterCount(merged) <= limit;
}

export default {
	sanitizeMemories,
	getCharacterCount,
	getMemoryCharacterLimit,
	enforceCharacterLimit,
	mergeMemories,
	extractMemoriesFromAnalysis,
	canStoreMemories
};
