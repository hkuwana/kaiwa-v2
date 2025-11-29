// 🌍 Enhanced Language Data
// Matches the structure from kaiwa-old with additional metadata
export type { Language } from '$lib/server/db/types';
import type { Language } from '$lib/server/db/types';

// Extended language type with country code for flag icons
export interface LanguageWithCountry extends Language {
	countryCode: string;
}

export const languages: LanguageWithCountry[] = [
	{
		id: 'ja',
		code: 'ja',
		name: 'Japanese',
		nativeName: '日本語',
		flag: '🇯🇵',
		countryCode: 'jp',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'japanese',
		supportedScripts: ['hiragana', 'katakana', 'kanji'],
		isSupported: true
	},
	{
		id: 'en',
		code: 'en',
		name: 'English',
		nativeName: 'English',
		flag: '🇺🇸',
		countryCode: 'us',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'es',
		code: 'es',
		name: 'Spanish',
		nativeName: 'Español',
		flag: '🇪🇸',
		countryCode: 'es',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'fr',
		code: 'fr',
		name: 'French',
		nativeName: 'Français',
		flag: '🇫🇷',
		countryCode: 'fr',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'de',
		code: 'de',
		name: 'German',
		nativeName: 'Deutsch',
		flag: '🇩🇪',
		countryCode: 'de',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'it',
		code: 'it',
		name: 'Italian',
		nativeName: 'Italiano',
		flag: '🇮🇹',
		countryCode: 'it',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'pt',
		code: 'pt',
		name: 'Portuguese',
		nativeName: 'Português',
		flag: '🇵🇹',
		countryCode: 'pt',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'ko',
		code: 'ko',
		name: 'Korean',
		nativeName: '한국어',
		flag: '🇰🇷',
		countryCode: 'kr',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'korean',
		supportedScripts: ['hangul', 'hanja'],
		isSupported: true
	},
	{
		id: 'zh',
		code: 'zh',
		name: 'Chinese (Simplified)',
		nativeName: '简体中文',
		flag: '🇨🇳',
		countryCode: 'cn',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'chinese',
		supportedScripts: ['simplified'],
		isSupported: true
	},
	{
		id: 'hi',
		code: 'hi',
		name: 'Hindi',
		nativeName: 'हिन्दी',
		flag: '🇮🇳',
		countryCode: 'in',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'devanagari',
		supportedScripts: ['devanagari'],
		isSupported: true
	},
	{
		id: 'ru',
		code: 'ru',
		name: 'Russian',
		nativeName: 'Русский',
		flag: '🇷🇺',
		countryCode: 'ru',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'cyrillic',
		supportedScripts: ['cyrillic'],
		isSupported: true
	},
	{
		id: 'vi',
		code: 'vi',
		name: 'Vietnamese',
		nativeName: 'Tiếng Việt',
		flag: '🇻🇳',
		countryCode: 'vn',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'nl',
		code: 'nl',
		name: 'Dutch',
		nativeName: 'Nederlands',
		flag: '🇳🇱',
		countryCode: 'nl',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'fil',
		code: 'fil',
		name: 'Filipino',
		nativeName: 'Filipino',
		flag: '🇵🇭',
		countryCode: 'ph',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'id',
		code: 'id',
		name: 'Indonesian',
		nativeName: 'Bahasa Indonesia',
		flag: '🇮🇩',
		countryCode: 'id',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'tr',
		code: 'tr',
		name: 'Turkish',
		nativeName: 'Türkçe',
		flag: '🇹🇷',
		countryCode: 'tr',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	}
];

// Helper function to get language by code
export function getLanguageByCode(code: string): Language | undefined {
	return languages.find((lang) => lang.code === code);
}

// Helper function to get language by id
export function getLanguageById(id: string): Language | undefined {
	return languages.find((lang) => lang.id === id);
}

// Helper function to get language emoji by code
export function getLanguageEmoji(code: string): string {
	const language = getLanguageByCode(code);
	return language?.flag || '🌐';
}

// Helper function to get language name by code
export function getLanguageName(code: string): string {
	const language = getLanguageByCode(code);
	return language?.name || code.toUpperCase();
}

// Helper function to get country code from a language
export function getLanguageCountryCode(code: string): string {
	const language = languages.find((lang) => lang.code === code);
	return language?.countryCode || 'xx';
}

// Helper function to extract country code from BCP47 code (e.g., 'en-GB' -> 'gb')
export function getCountryCodeFromBcp47(bcp47Code: string | null | undefined): string | null {
	if (!bcp47Code) return null;
	const parts = bcp47Code.split('-');
	if (parts.length >= 2) {
		return parts[1].toLowerCase();
	}
	return null;
}
