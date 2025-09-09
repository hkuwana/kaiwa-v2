// 🇰🇷 Lightweight Client-Side Korean Romanization
// Based on Revised Romanization of Korean (국어의 로마자 표기법)

// Hangul Unicode ranges
const HANGUL_SYLLABLES_START = 0xAC00;
const HANGUL_SYLLABLES_END = 0xD7A3;
const HANGUL_JAMO_START = 0x1100;
const HANGUL_JAMO_END = 0x11FF;

// Basic Hangul components
const INITIAL_CONSONANTS = [
	'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '',
	'j', 'jj', 'ch', 'k', 't', 'p', 'h'
];

const VOWELS = [
	'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe',
	'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'
];

const FINAL_CONSONANTS = [
	'', 'g', 'kk', 'gs', 'n', 'nj', 'nh', 'd', 'l', 'lg', 'lm', 'lb', 'ls',
	'lt', 'lp', 'lh', 'm', 'b', 'bs', 's', 'ss', 'ng', 'j', 'ch', 'k', 't', 'p', 'h'
];

// Extended Jamo mappings for compatibility
const JAMO_INITIAL: Record<string, string> = {
	'ㄱ': 'g', 'ㄲ': 'kk', 'ㄴ': 'n', 'ㄷ': 'd', 'ㄸ': 'tt', 'ㄹ': 'r', 'ㅁ': 'm',
	'ㅂ': 'b', 'ㅃ': 'pp', 'ㅅ': 's', 'ㅆ': 'ss', 'ㅇ': '', 'ㅈ': 'j', 'ㅉ': 'jj',
	'ㅊ': 'ch', 'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'h'
};

const JAMO_VOWEL: Record<string, string> = {
	'ㅏ': 'a', 'ㅐ': 'ae', 'ㅑ': 'ya', 'ㅒ': 'yae', 'ㅓ': 'eo', 'ㅔ': 'e', 'ㅕ': 'yeo',
	'ㅖ': 'ye', 'ㅗ': 'o', 'ㅘ': 'wa', 'ㅙ': 'wae', 'ㅚ': 'oe', 'ㅛ': 'yo', 'ㅜ': 'u',
	'ㅝ': 'wo', 'ㅞ': 'we', 'ㅟ': 'wi', 'ㅠ': 'yu', 'ㅡ': 'eu', 'ㅢ': 'ui', 'ㅣ': 'i'
};

const JAMO_FINAL: Record<string, string> = {
	'ㄱ': 'k', 'ㄲ': 'k', 'ㄳ': 'k', 'ㄴ': 'n', 'ㄵ': 'n', 'ㄶ': 'n', 'ㄷ': 't',
	'ㄹ': 'l', 'ㄺ': 'k', 'ㄻ': 'm', 'ㄼ': 'l', 'ㄽ': 'l', 'ㄾ': 'l', 'ㄿ': 'p',
	'ㅀ': 'l', 'ㅁ': 'm', 'ㅂ': 'p', 'ㅄ': 'p', 'ㅅ': 't', 'ㅆ': 't', 'ㅇ': 'ng',
	'ㅈ': 't', 'ㅊ': 't', 'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 't'
};

/**
 * Check if a character is a Hangul syllable
 */
function isHangulSyllable(char: string): boolean {
	const code = char.charCodeAt(0);
	return code >= HANGUL_SYLLABLES_START && code <= HANGUL_SYLLABLES_END;
}

/**
 * Check if a character is a Hangul Jamo
 */
function isHangulJamo(char: string): boolean {
	const code = char.charCodeAt(0);
	return code >= HANGUL_JAMO_START && code <= HANGUL_JAMO_END;
}

/**
 * Decompose a Hangul syllable into its components
 */
function decomposeSyllable(char: string): { initial: string; vowel: string; final: string } {
	const code = char.charCodeAt(0) - HANGUL_SYLLABLES_START;
	
	const initialIndex = Math.floor(code / 588);
	const vowelIndex = Math.floor((code % 588) / 28);
	const finalIndex = code % 28;
	
	return {
		initial: INITIAL_CONSONANTS[initialIndex],
		vowel: VOWELS[vowelIndex],
		final: FINAL_CONSONANTS[finalIndex]
	};
}

/**
 * Romanize a single Hangul syllable
 */
function romanizeSyllable(char: string): string {
	if (!isHangulSyllable(char)) {
		// Handle individual Jamo characters
		if (isHangulJamo(char)) {
			return JAMO_INITIAL[char] || JAMO_VOWEL[char] || JAMO_FINAL[char] || char;
		}
		return char;
	}
	
	const { initial, vowel, final } = decomposeSyllable(char);
	return initial + vowel + final;
}

/**
 * Apply phonetic rules for better romanization
 */
function applyPhoneticRules(romanized: string): string {
	// Remove extra spaces and normalize
	romanized = romanized.replace(/\s+/g, ' ').trim();
	
	// Basic phonetic adjustments
	romanized = romanized
		// Handle double consonants at syllable boundaries
		.replace(/([gkd])g/g, '$1k')
		.replace(/([ptk])b/g, '$1p')
		.replace(/([ptk])j/g, '$1ch')
		// Handle 'n' before certain consonants
		.replace(/n([gkh])/g, 'ng$1')
		// Handle 'l' before certain consonants  
		.replace(/l([jch])/g, 'r$1')
		// Clean up any double letters that shouldn't be there
		.replace(/([bcdfghjklmnpqrstvwxyz])\1+/g, '$1');
	
	return romanized;
}

/**
 * Main romanization function - converts Korean text to romanized form
 */
export function romanizeKorean(text: string): string {
	if (!text || typeof text !== 'string') {
		return '';
	}
	
	let result = '';
	
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		
		if (isHangulSyllable(char) || isHangulJamo(char)) {
			result += romanizeSyllable(char);
		} else if (char === ' ') {
			result += ' ';
		} else if (/[.,!?;:]/.test(char)) {
			result += char;
		} else {
			// Keep other characters as-is (numbers, punctuation, etc.)
			result += char;
		}
	}
	
	// Apply phonetic rules and clean up
	result = applyPhoneticRules(result);
	
	// Capitalize first letter
	return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Check if text contains Korean characters
 */
export function isKorean(text: string): boolean {
	if (!text) return false;
	
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (isHangulSyllable(char) || isHangulJamo(char)) {
			return true;
		}
	}
	
	return false;
}

/**
 * Get basic statistics about Korean text
 */
export function getKoreanStats(text: string): {
	totalChars: number;
	hangulChars: number;
	syllables: number;
	jamoChars: number;
} {
	let hangulChars = 0;
	let syllables = 0;
	let jamoChars = 0;
	
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (isHangulSyllable(char)) {
			hangulChars++;
			syllables++;
		} else if (isHangulJamo(char)) {
			hangulChars++;
			jamoChars++;
		}
	}
	
	return {
		totalChars: text.length,
		hangulChars,
		syllables,
		jamoChars
	};
}