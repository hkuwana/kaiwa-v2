import { logger } from '../logger';
// 🌐 Translation Service
// Simplified translation service using Google Translate for translation and Kuroshiro for Japanese text processing

import type { Message } from '$lib/server/db/types';
import { env } from '$env/dynamic/private';
// Note: Using dynamic imports due to mixed module systems (ES6/CommonJS)

// Translation parameters interface
interface TranslateParams {
	text: string;
	messageId: string;
	sourceLanguage: string;
	targetLanguage: string;
	model?: string;
}

// Translation result interface
interface TranslationResult {
	messageId: string;
	translatedContent: string;
	romanization?: string;
	hiragana?: string;
	otherScripts?: Record<string, string>;
	sourceLanguage: string;
	targetLanguage: string;
	confidence?: 'low' | 'medium' | 'high';
	provider: string;
}

// Google Translate response interface
interface GoogleTranslateResponse {
	translations?: Array<{
		translatedText?: string;
	}>;
}

// Google Cloud Translation client (will be initialized when needed)
let translationClient: unknown = null;

/**
 * Initialize Google Cloud Translation client
 * Note: This function only works on the server side
 */
async function initializeTranslationClient() {
	// Check if we're in a browser environment
	if (typeof window !== 'undefined') {
		logger.warn('Google Translation client is not available in browser environment');
		return null;
	}

	if (translationClient) return translationClient;

	try {
		const { TranslationServiceClient } = await import('@google-cloud/translate');
		const credentials = JSON.parse(env.GOOGLE_CREDENTIALS_JSON || '{}');

		translationClient = new TranslationServiceClient({
			credentials: {
				client_email: credentials.client_email,
				private_key: credentials.private_key
			},
			projectId: env.GOOGLE_CLOUD_PROJECT_ID
		});

		return translationClient;
	} catch (error) {
		logger.error('Failed to initialize Google Translation client:', error);
		return null;
	}
}

/**
 * Translate text using Google Cloud Translation API
 */
async function translateText(params: TranslateParams): Promise<GoogleTranslateResponse> {
	const client = await initializeTranslationClient();
	if (!client) {
		throw new Error('Translation client not available');
	}

	const request: Record<string, unknown> = {
		parent: `projects/${env.GOOGLE_CLOUD_PROJECT_ID}/locations/global`,
		contents: [params.text],
		mimeType: 'text/plain',
		sourceLanguageCode: params.sourceLanguage,
		targetLanguageCode: params.targetLanguage
	};

	if (params.model) {
		request.model = `projects/${env.GOOGLE_CLOUD_PROJECT_ID}/locations/global/models/${params.model}`;
	}

	try {
		logger.info('Calling translateText with request:', request);
		const response = await (
			client as { translateText: (request: unknown) => Promise<GoogleTranslateResponse> }
		).translateText(request);
		logger.info('Translation response:', response);
		return response;
	} catch (error) {
		logger.error('Translation API error:', error);
		throw error;
	}
}

/**
 * Main translation function that processes text and returns organized translation data
 */
export async function translateMessage(
	message: Message,
	targetLanguage: string,
	sourceLanguage: string = 'en'
): Promise<TranslationResult> {
	try {
		logger.info(`Translating message ${message.id} to ${targetLanguage} from ${sourceLanguage}`);

		// Check if we have Google credentials
		if (!env.GOOGLE_CREDENTIALS_JSON || !env.GOOGLE_CLOUD_PROJECT_ID) {
			logger.warn('Google Translate credentials not configured, using fallback translation');
			return createFallbackTranslation(message, targetLanguage, sourceLanguage);
		}

		logger.info('Google credentials found, proceeding with translation');

		// Translate the text
		const translationResponse = await translateText({
			text: message.content,
			messageId: message.id,
			sourceLanguage,
			targetLanguage
		});

		// Get the translated content
		logger.info('Raw translation response:', JSON.stringify(translationResponse, null, 2));

		// The response is an array, get the first element
		const responseData = Array.isArray(translationResponse)
			? translationResponse[0]
			: translationResponse;
		logger.info('Response data:', responseData);

		// Check if the response has the expected structure
		if (!responseData?.translations || responseData.translations.length === 0) {
			logger.warn('No translations found in response, using original content');
			return createFallbackTranslation(message, targetLanguage, sourceLanguage);
		}

		const translatedContent = responseData?.translations?.[0]?.translatedText || message.content;
		logger.info('Extracted translated content:', translatedContent);

		// If the translated content is the same as the original, something went wrong
		if (translatedContent === message.content) {
			logger.warn('Translation returned original content, this might indicate an API issue');
		}

		// Don't automatically generate scripts in translation - let message service handle that
		// const scriptData = await generateScriptsServer(message.content, sourceLanguage);

		// Determine confidence based on translation quality
		const confidence = determineTranslationConfidence(translatedContent, message.content);

		const result: TranslationResult = {
			messageId: message.id,
			translatedContent,
			sourceLanguage,
			targetLanguage,
			confidence,
			provider: 'google-translate'
			// ...scriptData // Remove automatic script generation from translation
		};

		logger.info('Translation completed:', result);
		return result;
	} catch (error) {
		logger.error('Translation failed:', error);
		// Return fallback translation instead of throwing
		return createFallbackTranslation(message, targetLanguage, sourceLanguage);
	}
}

/**
 * Create a fallback translation when Google Translate is not available
 */
function createFallbackTranslation(
	message: Message,
	targetLanguage: string,
	sourceLanguage: string
): TranslationResult {
	// Simple fallback translations for common phrases
	const fallbackTranslations: Record<string, Record<string, string>> = {
		'Hello, how are you today?': {
			ja: 'こんにちは、今日はどうですか？',
			zh: '你好，你今天怎么样？',
			ko: '안녕하세요, 오늘 어떠세요?',
			es: 'Hola, ¿cómo estás hoy?',
			fr: "Bonjour, comment allez-vous aujourd'hui?",
			de: 'Hallo, wie geht es dir heute?'
		},
		'Thank you': {
			ja: 'ありがとうございます',
			zh: '谢谢',
			ko: '감사합니다',
			es: 'Gracias',
			fr: 'Merci',
			de: 'Danke'
		},
		'Good morning': {
			ja: 'おはようございます',
			zh: '早上好',
			ko: '좋은 아침',
			es: 'Buenos días',
			fr: 'Bonjour',
			de: 'Guten Morgen'
		}
	};

	const translatedContent =
		fallbackTranslations[message.content]?.[targetLanguage] ||
		`[${targetLanguage.toUpperCase()}] ${message.content}`;

	return {
		messageId: message.id,
		translatedContent,
		sourceLanguage,
		targetLanguage,
		confidence: 'low' as const,
		provider: 'fallback'
	};
}

/**
 * Determine translation confidence based on various factors
 */
function determineTranslationConfidence(
	translatedText: string,
	originalText: string
): 'low' | 'medium' | 'high' {
	// Simple heuristic - in practice, you'd use more sophisticated methods
	const lengthRatio = translatedText.length / originalText.length;

	if (lengthRatio < 0.5 || lengthRatio > 2.0) {
		return 'low';
	} else if (lengthRatio < 0.7 || lengthRatio > 1.5) {
		return 'medium';
	} else {
		return 'high';
	}
}

/**
 * Check if a message has been translated
 */
export function isMessageTranslated(message: Message): boolean {
	return (
		message.isTranslated === true &&
		message.translatedContent !== null &&
		message.translatedContent.trim() !== ''
	);
}

/**
 * Get hiragana for a message if available
 */
export function getMessageHiragana(message: Message): string | null {
	return message.hiragana || null;
}

/**
 * Get katakana for a message if available
 */
export function getMessageKatakana(message: Message): string | null {
	return (message.otherScripts as Record<string, string>)?.katakana || null;
}

/**
 * Get romaji for a message if available
 */
export function getMessageRomaji(message: Message): string | null {
	return message.romanization || null;
}

/**
 * Get all available scripts for a message
 */
export function getMessageScripts(message: Message): Record<string, string> {
	const scripts: Record<string, string> = {};

	if (message.hiragana) scripts.hiragana = message.hiragana;
	if (message.romanization) scripts.romaji = message.romanization;

	// Add other scripts from the otherScripts field
	if (message.otherScripts) {
		Object.assign(scripts, message.otherScripts);
	}

	return scripts;
}

/**
 * Pure function to translate text with language-specific processing
 * This is the main function that should be called from components
 */
export async function translateTextWithScripts(
	text: string,
	messageId: string,
	sourceLanguage: string,
	targetLanguage: string
): Promise<TranslationResult> {
	// Create a temporary message object for the translation function
	const tempMessage: Message = {
		id: messageId,
		content: text,
		role: 'user',
		timestamp: new Date(),
		conversationId: '',
		sequenceId: null,
		// Add other required fields with defaults
		translatedContent: null,
		sourceLanguage: null,
		targetLanguage: null,
		userNativeLanguage: null,
		romanization: null,
		hiragana: null,
		otherScripts: null,
		translationConfidence: null,
		translationProvider: null,
		translationNotes: null,
		isTranslated: false,
		grammarAnalysis: null,
		vocabularyAnalysis: null,
		pronunciationScore: null,
		audioUrl: null,
		audioDuration: null,
		speechTimings: null,
		difficultyLevel: null,
		learningTags: null,
		conversationContext: null,
		messageIntent: null
	};

	return await translateMessage(tempMessage, targetLanguage, sourceLanguage);
}
