// 🔒 Security Utilities
// Sanitize GPT data in real-time to prevent XSS and injection attacks

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

	// Sanitize conversation message
	static sanitizeMessage(message: any): any {
		if (!message || typeof message !== 'object') return message;

		const sanitized = { ...message };

		if (sanitized.content) {
			sanitized.content = this.sanitizeOutput(sanitized.content);
		}

		if (sanitized.text) {
			sanitized.text = this.sanitizeOutput(sanitized.text);
		}

		return sanitized;
	}

	// Validate GPT response structure
	static validateGPTResponse(response: any): boolean {
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

	// Sanitize and validate GPT event
	static sanitizeGPTEvent(event: any): any {
		if (!this.validateGPTResponse(event)) {
			console.warn('🔒 Rejected potentially malicious GPT event:', event);
			return null;
		}

		// Sanitize based on event type
		switch (event.type) {
			case 'conversation.item.completed':
				if (event.item?.content) {
					event.item.content = event.item.content.map((c: any) =>
						c.type === 'output_text' ? this.sanitizeMessage(c) : c
					);
				}
				break;

			case 'response.audio_transcript.delta':
			case 'response.output_audio_transcript.delta':
				if (event.delta) {
					event.delta = this.sanitizeOutput(event.delta);
				}
				break;

			case 'response.audio_transcript.done':
			case 'response.output_audio_transcript.done':
				if (event.transcript) {
					event.transcript = this.sanitizeOutput(event.transcript);
				}
				break;
		}

		return event;
	}

	// Check if text contains potentially dangerous content
	static isDangerous(text: string): boolean {
		if (typeof text !== 'string') return true;

		const dangerousPatterns = [
			/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
			/javascript:/gi,
			/data:/gi,
			/vbscript:/gi,
			/on\w+\s*=/gi,
			/<iframe/gi,
			/<object/gi,
			/<embed/gi
		];

		return dangerousPatterns.some((pattern) => pattern.test(text));
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
