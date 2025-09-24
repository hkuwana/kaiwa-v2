// 🔒 Security Utilities
// Sanitize GPT data in real-time to prevent XSS and injection attacks

import DOMPurify from 'dompurify';
import type { Message } from '$lib/server/db/types';
import type {
	ConversationItemCreatedEvent,
	ResponseAudioTranscriptDeltaEvent,
	ResponseAudioTranscriptDoneEvent
} from '$lib/types/openai.realtime.types';

export class SecuritySanitizer {
	// Sanitize text input from user
	static sanitizeInput(text: string): string {
		if (typeof text !== 'string') return '';

		return text
			.trim()
			.slice(0, 10000) // Limit length
			.replace(/[<>]/g, '') // Remove < and >
			.replace(/javascript:/gi, '') // Remove javascript: protocol
			.replace(/on\w+=/gi, '') // Remove event handlers
			.replace(/data:/gi, '') // Remove data: protocol
			.replace(/vbscript:/gi, ''); // Remove vbscript: protocol
	}

	// Sanitize text output from GPT
	static sanitizeOutput(text: string): string {
		if (typeof text !== 'string') return '';

		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#x27;')
			.replace(/\//g, '&#x2F;')
			.slice(0, 50000); // Limit length
	}

	// Sanitize conversation message using proper Message type
	static sanitizeMessage(message: Partial<Message>): Partial<Message> {
		if (!message || typeof message !== 'object') return message;

		const sanitized = { ...message };

		if (sanitized.content && typeof sanitized.content === 'string') {
			sanitized.content = this.sanitizeOutput(sanitized.content);
		}

		if (sanitized.translatedContent && typeof sanitized.translatedContent === 'string') {
			sanitized.translatedContent = this.sanitizeOutput(sanitized.translatedContent);
		}

		// Sanitize script content fields
		if (sanitized.hiragana && typeof sanitized.hiragana === 'string') {
			sanitized.hiragana = this.sanitizeFuriganaHTML(sanitized.hiragana);
		}

		if (sanitized.romanization && typeof sanitized.romanization === 'string') {
			sanitized.romanization = this.sanitizeScriptContent(sanitized.romanization);
		}

		return sanitized;
	}

	// Validate GPT response structure
	static validateGPTResponse(response: Record<string, unknown>): boolean {
		if (!response || typeof response !== 'object') return false;

		// Check for required fields
		if (!response.type || typeof response.type !== 'string') return false;

		// Check for malicious patterns
		const responseStr = JSON.stringify(response).toLowerCase();
		const dangerousPatterns = [
			'javascript:',
			'data:',
			'vbscript:',
			'onload=',
			'onerror=',
			'onclick=',
			'<script',
			'</script>'
		];

		return !dangerousPatterns.some((pattern) => responseStr.includes(pattern));
	}

	// Sanitize and validate GPT event using proper types
	static sanitizeGPTEvent<
		T extends
			| ConversationItemCreatedEvent
			| ResponseAudioTranscriptDeltaEvent
			| ResponseAudioTranscriptDoneEvent
			| Record<string, unknown>
	>(event: T): T | null {
		if (!this.validateGPTResponse(event as Record<string, unknown>)) {
			console.warn('🔒 Rejected potentially malicious GPT event:', event);
			return null;
		}

		// Create a copy to avoid mutating the original event
		const sanitizedEvent = { ...event } as T;

		// Sanitize based on event type
		switch (event.type) {
			case 'conversation.item.created': {
				const createdEvent = sanitizedEvent as ConversationItemCreatedEvent;
				if (createdEvent.item?.type === 'message' && createdEvent.item.content) {
					createdEvent.item.content = createdEvent.item.content.map((content) => {
						if (content.type === 'text' && 'text' in content) {
							return {
								...content,
								text: this.sanitizeOutput(content.text)
							};
						}
						return content;
					});
				}
				break;
			}

			case 'response.audio_transcript.delta': {
				const deltaEvent = sanitizedEvent as ResponseAudioTranscriptDeltaEvent;
				if (deltaEvent.delta) {
					deltaEvent.delta = this.sanitizeOutput(deltaEvent.delta);
				}
				break;
			}

			case 'response.audio_transcript.done': {
				const doneEvent = sanitizedEvent as ResponseAudioTranscriptDoneEvent;
				if (doneEvent.transcript) {
					doneEvent.transcript = this.sanitizeOutput(doneEvent.transcript);
				}
				break;
			}
		}

		return sanitizedEvent;
	}

	// Check if text contains potentially dangerous content
	static isDangerous(text: string): boolean {
		if (typeof text !== 'string') return true;

		const dangerousPatterns = [
			/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
			/javascript:/gi,
			/data:(?!image\/)/gi, // Allow data: for images, block for scripts
			/vbscript:/gi,
			/on\w+\s*=/gi,
			/<iframe/gi,
			/<object/gi,
			/<embed/gi
		];

		return dangerousPatterns.some((pattern) => pattern.test(text));
	}

	// Sanitize HTML content for furigana/pinyin display
	// Allows only safe HTML tags used by Japanese/Chinese script libraries
	static sanitizeFuriganaHTML(html: string): string {
		if (typeof html !== 'string') return '';

		// Configure DOMPurify to allow only safe tags used by furigana/ruby markup
		const cleanHTML = DOMPurify.sanitize(html, {
			ALLOWED_TAGS: ['ruby', 'rt', 'rp', 'span', 'div'], // Japanese ruby markup tags
			ALLOWED_ATTR: ['class', 'lang', 'data-*'], // Allow basic styling/language attributes
			ALLOW_DATA_ATTR: true, // Allow data attributes for styling
			KEEP_CONTENT: true, // Keep text content even if tags are stripped
			SANITIZE_DOM: true, // Deep DOM sanitization
			RETURN_DOM: false, // Return string, not DOM object
			RETURN_DOM_FRAGMENT: false
		});

		return cleanHTML;
	}

	// Sanitize script generation content (hiragana, katakana, romanization, etc.)
	static sanitizeScriptContent(content: string): string {
		if (typeof content !== 'string') return '';

		// For non-HTML script content, escape HTML entities
		return content
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#x27;')
			.slice(0, 10000); // Reasonable length limit
	}

	// Enhanced validation specifically for script generation content
	static validateScriptContent(content: Record<string, unknown>): boolean {
		if (!content || typeof content !== 'object') return false;

		// Check each field for dangerous content
		const dangerousPatterns = [
			/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
			/javascript:/gi,
			/data:(?!image\/)/gi, // Allow data: for images, block for scripts
			/vbscript:/gi,
			/on\w+\s*=/gi, // Event handlers
			/<iframe/gi,
			/<object/gi,
			/<embed/gi,
			/<link/gi,
			/<meta/gi
		];

		const contentString = JSON.stringify(content).toLowerCase();
		return !dangerousPatterns.some((pattern) => pattern.test(contentString));
	}

	// Rate limiting for security
	private static requestCounts = new Map<string, number>();
	private static readonly MAX_REQUESTS_PER_MINUTE = 60;

	static checkRateLimit(identifier: string): boolean {
		if (!this.requestCounts.has(identifier)) {
			this.requestCounts.set(identifier, 1);
			return true;
		}

		const count = this.requestCounts.get(identifier) ?? 0;
		if (count >= this.MAX_REQUESTS_PER_MINUTE) {
			return false;
		}

		this.requestCounts.set(identifier, count + 1);

		// Clean up old entries
		setTimeout(() => {
			const currentCount = this.requestCounts.get(identifier);
			if (currentCount && currentCount > 1) {
				this.requestCounts.set(identifier, currentCount - 1);
			} else {
				this.requestCounts.delete(identifier);
			}
		}, 60000);

		return true;
	}
}

// Export singleton instance
export const securitySanitizer = new SecuritySanitizer();
