// 🎮 Gamification System
// Handles user levels, CEFR ratings, and progression

/**
 * Get CEFR label based on user level (0-699)
 * @param level - User's numeric level
 * @returns CEFR rating (A0, A1, A2, B1, B2, C1, C2)
 */
export function getCEFRLabel(level: number): string {
	if (level < 100) return 'A0';
	if (level < 200) return 'A1';
	if (level < 300) return 'A2';
	if (level < 400) return 'B1';
	if (level < 500) return 'B2';
	if (level < 600) return 'C1';
	return 'C2';
}

/**
 * Get level range for a CEFR rating
 * @param cefr - CEFR rating
 * @returns [minLevel, maxLevel]
 */
export function getCEFRLevelRange(cefr: string): [number, number] {
	switch (cefr) {
		case 'A0':
			return [0, 99];
		case 'A1':
			return [100, 199];
		case 'A2':
			return [200, 299];
		case 'B1':
			return [300, 399];
		case 'B2':
			return [400, 499];
		case 'C1':
			return [500, 599];
		case 'C2':
			return [600, 699];
		default:
			return [0, 99];
	}
}

/**
 * Calculate progress within current CEFR level
 * @param level - User's current level
 * @returns Progress percentage (0-100)
 */
export function getCEFRProgress(level: number): number {
	const cefr = getCEFRLabel(level);
	const [min, max] = getCEFRLevelRange(cefr);
	return Math.round(((level - min) / (max - min)) * 100);
}
