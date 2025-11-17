// src/lib/utils/memory-format.ts
// Helper utilities for turning mixed memory data into learner-friendly strings

export interface StructuredMemory {
	id?: string;
	topic?: string;
	languageId?: string;
	difficulties?: string[];
	keyPhrases?: string[];
	successfulPatterns?: string[];
	engagement?: 'low' | 'medium' | 'high';
	duration?: number;
	createdAt?: string | Date;
}

function formatList(items: string[] | undefined, label: string): string | null {
	if (!Array.isArray(items) || items.length === 0) return null;
	const trimmed = items
		.map((item) => (typeof item === 'string' ? item.trim() : ''))
		.filter(Boolean);
	if (trimmed.length === 0) return null;
	const sample = trimmed.slice(0, 2).join(', ');
	return `${label}: ${sample}${trimmed.length > 2 ? '…' : ''}`;
}

/**
 * Convert a single memory entry (string or object) into a sentence.
 */
export function formatMemoryEntry(memory: unknown): string | null {
	if (typeof memory === 'string') {
		const trimmed = memory.trim();
		return trimmed.length > 0 ? trimmed : null;
	}

	if (memory && typeof memory === 'object') {
		const data = memory as StructuredMemory;
		const pieces: string[] = [];

		if (typeof data.topic === 'string' && data.topic.trim().length > 0) {
			const lang = data.languageId ? ` (${data.languageId.toUpperCase()})` : '';
			pieces.push(`Learner practiced ${data.topic.trim()}${lang}`);
		}

		const keyPhrasePart = formatList(data.keyPhrases, 'Key phrases');
		if (keyPhrasePart) pieces.push(keyPhrasePart);

		const difficultyPart = formatList(data.difficulties, 'Struggled with');
		if (difficultyPart) pieces.push(difficultyPart);

		const successPart = formatList(data.successfulPatterns, 'Wins');
		if (successPart) pieces.push(successPart);

		if (typeof data.engagement === 'string') {
			pieces.push(`Engagement: ${data.engagement}`);
		}

		if (pieces.length > 0) {
			return pieces.join(' • ');
		}

		try {
			return JSON.stringify(memory);
		} catch {
			return String(memory);
		}
	}

	return null;
}

/**
 * Normalize any memory array into a clean string list.
 */
export function normalizeMemoriesList(memories: unknown): string[] {
	if (!Array.isArray(memories)) return [];
	const normalized: string[] = [];

	for (const entry of memories) {
		const formatted = formatMemoryEntry(entry);
		if (!formatted) continue;
		const trimmed = formatted.trim();
		if (!trimmed) continue;
		if (normalized.includes(trimmed)) continue;
		normalized.push(trimmed);
	}

	return normalized;
}
