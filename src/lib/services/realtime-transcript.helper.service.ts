/**
 * Normalize a transcript fragment by trimming and converting to NFC.
 * Returns null if the input is empty after normalization.
 */
export function normalizeTranscript(text: string | null | undefined): string | null {
	const raw = (text ?? '').trim();
	if (!raw) return null;
	return raw.normalize('NFC');
}

/**
 * Estimate the duration (in milliseconds) for a word token based on its character length.
 * The defaults mirror the heuristics previously embedded in the realtime store.
 */
export function estimateWordDuration(
	charLength: number,
	minimumMs = 220,
	maximumMs = 850,
	scaleFactor = 45
): number {
	const scaled = charLength * scaleFactor;
	return Math.max(minimumMs, Math.min(scaled, maximumMs));
}
