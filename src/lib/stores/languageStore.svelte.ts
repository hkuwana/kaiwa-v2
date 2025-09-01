// 🌍 Language Store
// Manages language information and provides language lookup functionality

import { writable } from 'svelte/store';

// Language information
const LANGUAGES = [
	{
		id: 'ja',
		code: 'ja',
		name: 'Japanese',
		nativeName: '日本語',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['hiragana', 'katakana', 'kanji']
	},
	{
		id: 'en',
		code: 'en',
		name: 'English',
		nativeName: 'English',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin']
	},
	{
		id: 'es',
		code: 'es',
		name: 'Spanish',
		nativeName: 'Español',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin']
	},
	{
		id: 'fr',
		code: 'fr',
		name: 'French',
		nativeName: 'Français',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin']
	},
	{
		id: 'zh',
		code: 'zh',
		name: 'Chinese',
		nativeName: '中文',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'chinese',
		supportedScripts: ['chinese']
	}
];

// Create store
export const languageStore = writable(LANGUAGES);
