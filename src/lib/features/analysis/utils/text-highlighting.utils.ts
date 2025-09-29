/**
 * Utility functions for highlighting text segments in analysis suggestions
 */

export interface TextSegment {
	text: string;
	isHighlighted: boolean;
	start: number;
	end: number;
}

/**
 * Highlights specific text segments based on their offsets
 * @param text - The original text to highlight
 * @param highlightOffsets - Array of {start, end} offsets to highlight
 * @returns Array of text segments with highlighting information
 */
export function createHighlightedSegments(
	text: string,
	highlightOffsets: Array<{ start: number; end: number }> = []
): TextSegment[] {
	if (highlightOffsets.length === 0) {
		return [{ text, isHighlighted: false, start: 0, end: text.length }];
	}

	// Sort offsets by start position
	const sortedOffsets = [...highlightOffsets].sort((a, b) => a.start - b.start);

	const segments: TextSegment[] = [];
	let currentPos = 0;

	for (const offset of sortedOffsets) {
		// Add non-highlighted text before this highlight
		if (currentPos < offset.start) {
			segments.push({
				text: text.slice(currentPos, offset.start),
				isHighlighted: false,
				start: currentPos,
				end: offset.start
			});
		}

		// Add highlighted text
		segments.push({
			text: text.slice(offset.start, offset.end),
			isHighlighted: true,
			start: offset.start,
			end: offset.end
		});

		currentPos = offset.end;
	}

	// Add remaining non-highlighted text
	if (currentPos < text.length) {
		segments.push({
			text: text.slice(currentPos),
			isHighlighted: false,
			start: currentPos,
			end: text.length
		});
	}

	return segments;
}

/**
 * Finds the offsets for a specific text within a larger text
 * @param fullText - The full text to search in
 * @param searchText - The text to find
 * @returns Array of {start, end} offsets where the text was found
 */
export function findTextOffsets(fullText: string, searchText: string): Array<{ start: number; end: number }> {
	const offsets: Array<{ start: number; end: number }> = [];
	let index = 0;

	while (index < fullText.length) {
		const foundIndex = fullText.indexOf(searchText, index);
		if (foundIndex === -1) break;

		offsets.push({
			start: foundIndex,
			end: foundIndex + searchText.length
		});

		index = foundIndex + 1; // Move past the current match to find overlapping matches
	}

	return offsets;
}

/**
 * Creates a highlighted HTML string from text segments
 * @param segments - Array of text segments with highlighting information
 * @param highlightClass - CSS class to apply to highlighted segments
 * @returns HTML string with highlighted segments
 */
export function createHighlightedHtml(
	segments: TextSegment[],
	highlightClass: string = 'bg-warning/30 text-warning-content rounded px-1'
): string {
	return segments
		.map(segment => {
			const escapedText = escapeHtml(segment.text);
			return segment.isHighlighted
				? `<span class="${highlightClass}">${escapedText}</span>`
				: escapedText;
		})
		.join('');
}

/**
 * Escapes HTML characters to prevent XSS
 */
function escapeHtml(text: string): string {
	if (typeof document !== 'undefined') {
		// Browser environment
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	} else {
		// Server environment - manual escaping
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#x27;');
	}
}