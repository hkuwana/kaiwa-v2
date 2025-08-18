// 🚨 Global Error Monitoring Service
// Captures errors in a user-friendly way while preserving technical details for developers

import { browser } from '$app/environment';

export interface ErrorEntry {
	id: string;
	timestamp: number;
	userMessage: string;
	technicalDetails: Record<string, unknown>;
	severity: 'low' | 'medium' | 'high' | 'critical';
	feature: string;
	resolved: boolean;
	context?: {
		url: string;
		userAgent: string;
		userId?: string;
	};
}

export interface ErrorMonitorConfig {
	enableConsoleCapture?: boolean;
	enableGlobalErrorCapture?: boolean;
	enablePromiseRejectionCapture?: boolean;
	maxErrors?: number;
	autoResolveLowSeverity?: boolean;
	autoResolveDelay?: number;
}

export class ErrorMonitor {
	private errors: ErrorEntry[] = [];
	private config: Required<ErrorMonitorConfig>;
	private listeners: Array<(error: ErrorEntry) => void> = [];
	private isInitialized = false;

	constructor(config: ErrorMonitorConfig = {}) {
		this.config = {
			enableConsoleCapture: true,
			enableGlobalErrorCapture: true,
			enablePromiseRejectionCapture: true,
			maxErrors: 100,
			autoResolveLowSeverity: true,
			autoResolveDelay: 5 * 60 * 1000, // 5 minutes
			...config
		};

		// Only initialize in the browser
		if (browser) {
			this.setup();
		}
	}

	private setup() {
		if (this.isInitialized) return;
		this.isInitialized = true;

		if (this.config.enableGlobalErrorCapture) {
			this.setupGlobalErrorCapture();
		}

		if (this.config.enablePromiseRejectionCapture) {
			this.setupPromiseRejectionCapture();
		}

		if (this.config.enableConsoleCapture) {
			this.setupConsoleCapture();
		}
	}

	// Initialize when called from browser context
	initialize() {
		if (browser && !this.isInitialized) {
			this.setup();
		}
	}

	private setupGlobalErrorCapture() {
		if (!browser) return;

		window.addEventListener('error', (event) => {
			this.logError({
				userMessage: this.getUserFriendlyMessage(event.error?.message || event.message),
				technicalDetails: {
					message: event.message,
					filename: event.filename,
					lineno: event.lineno,
					colno: event.colno,
					error: event.error?.stack,
					type: 'global_error'
				},
				severity: this.assessSeverity(event.error?.message || event.message),
				feature: this.detectFeature(event.filename || ''),
				context: this.getContext()
			});
		});
	}

	private setupPromiseRejectionCapture() {
		if (!browser) return;

		window.addEventListener('unhandledrejection', (event) => {
			this.logError({
				userMessage: 'A request failed unexpectedly',
				technicalDetails: {
					reason: event.reason,
					promise: event.promise,
					type: 'unhandled_promise_rejection'
				},
				severity: 'medium',
				feature: 'async',
				context: this.getContext()
			});
		});
	}

	private setupConsoleCapture() {
		if (!browser) return;

		const originalConsoleError = console.error;
		const originalConsoleWarn = console.warn;

		console.error = (...args: unknown[]) => {
			// Call original
			originalConsoleError.apply(console, args);

			// Capture for monitoring
			this.captureConsoleError('error', args);
		};

		console.warn = (...args: unknown[]) => {
			// Call original
			originalConsoleWarn.apply(console, args);

			// Capture for monitoring
			this.captureConsoleError('warn', args);
		};
	}

	private captureConsoleError(level: 'error' | 'warn', args: unknown[]) {
		const message = args
			.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)))
			.join(' ');

		// Only capture specific error patterns that are user-relevant
		if (this.isUserRelevantError(message)) {
			this.logError({
				userMessage: this.getUserFriendlyMessage(message),
				technicalDetails: {
					consoleArgs: args,
					message,
					level,
					timestamp: new Date().toISOString(),
					type: 'console_error'
				},
				severity: this.assessSeverity(message),
				feature: this.detectFeature(message),
				context: this.getContext()
			});
		}
	}

	private isUserRelevantError(message: string): boolean {
		const relevantPatterns = [
			'Invalid session: missing session ID',
			'Failed to start streaming',
			'Failed to create realtime session',
			'WebRTC connection failed',
			'Audio recording failed',
			'Network request failed',
			'Authentication failed',
			'Permission denied'
		];

		return relevantPatterns.some((pattern) => message.includes(pattern));
	}

	private getUserFriendlyMessage(technicalMessage: string): string {
		const messageMap: Record<string, string> = {
			'Invalid session: missing session ID': 'Session connection issue',
			'Failed to start streaming': 'Audio streaming problem',
			'Failed to create realtime session': 'Connection setup issue',
			'WebRTC connection failed': 'Audio connection problem',
			'Audio recording failed': 'Microphone access issue',
			'Network request failed': 'Connection problem',
			'Authentication failed': 'Login issue',
			'Permission denied': 'Access denied'
		};

		for (const [pattern, userMessage] of Object.entries(messageMap)) {
			if (technicalMessage.includes(pattern)) {
				return userMessage;
			}
		}

		return 'Something went wrong';
	}

	private assessSeverity(message: string): 'low' | 'medium' | 'high' | 'critical' {
		if (message.includes('Permission denied') || message.includes('Authentication failed')) {
			return 'critical';
		}
		if (message.includes('Invalid session') || message.includes('Failed to start streaming')) {
			return 'high';
		}
		if (
			message.includes('Network request failed') ||
			message.includes('WebRTC connection failed')
		) {
			return 'medium';
		}
		return 'low';
	}

	private detectFeature(message: string): string {
		if (message.includes('session') || message.includes('realtime')) {
			return 'realtime';
		}
		if (
			message.includes('audio') ||
			message.includes('recording') ||
			message.includes('streaming')
		) {
			return 'audio';
		}
		if (message.includes('authentication') || message.includes('login')) {
			return 'auth';
		}
		if (message.includes('network') || message.includes('request')) {
			return 'network';
		}
		return 'general';
	}

	private getContext() {
		if (!browser) return undefined;

		return {
			url: window.location.href,
			userAgent: navigator.userAgent,
			userId: this.getUserId()
		};
	}

	private getUserId(): string | undefined {
		if (!browser) return undefined;

		// Try to get user ID from various sources
		try {
			// Check localStorage
			const stored = localStorage.getItem('userId');
			if (stored) return stored;

			// Check sessionStorage
			const session = sessionStorage.getItem('userId');
			if (session) return session;

			// Check for user context in the DOM
			const userElement = document.querySelector('[data-user-id]');
			if (userElement) {
				return userElement.getAttribute('data-user-id') || undefined;
			}
		} catch {
			// Ignore errors in context gathering
		}
		return undefined;
	}

	logError(error: Omit<ErrorEntry, 'id' | 'timestamp' | 'resolved'>) {
		const errorEntry: ErrorEntry = {
			id: crypto.randomUUID(),
			timestamp: Date.now(),
			...error,
			resolved: false
		};

		// Add to errors array
		this.errors.unshift(errorEntry);

		// Limit total errors
		if (this.errors.length > this.config.maxErrors) {
			this.errors = this.errors.slice(0, this.config.maxErrors);
		}

		// Auto-resolve low severity errors
		if (this.config.autoResolveLowSeverity && error.severity === 'low') {
			setTimeout(() => {
				this.resolveError(errorEntry.id);
			}, this.config.autoResolveDelay);
		}

		// Notify listeners
		this.listeners.forEach((listener) => listener(errorEntry));

		return errorEntry;
	}

	resolveError(errorId: string) {
		this.errors = this.errors.map((error) =>
			error.id === errorId ? { ...error, resolved: true } : error
		);
	}

	clearResolvedErrors() {
		this.errors = this.errors.filter((error) => !error.resolved);
	}

	getErrors(filter: 'all' | 'unresolved' | 'critical' = 'unresolved') {
		switch (filter) {
			case 'unresolved':
				return this.errors.filter((error) => !error.resolved);
			case 'critical':
				return this.errors.filter((error) => error.severity === 'critical');
			default:
				return this.errors;
		}
	}

	getErrorCount(filter: 'all' | 'unresolved' | 'critical' = 'unresolved') {
		return this.getErrors(filter).length;
	}

	onError(callback: (error: ErrorEntry) => void) {
		this.listeners.push(callback);
		return () => {
			this.listeners = this.listeners.filter((listener) => listener !== callback);
		};
	}

	// Development helpers
	getErrorSummary() {
		const unresolved = this.getErrors('unresolved');
		const critical = this.getErrors('critical');

		return {
			total: this.errors.length,
			unresolved: unresolved.length,
			critical: critical.length,
			byFeature: this.errors.reduce(
				(acc, error) => {
					acc[error.feature] = (acc[error.feature] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			),
			bySeverity: this.errors.reduce(
				(acc, error) => {
					acc[error.severity] = (acc[error.severity] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			)
		};
	}
}

// 🎭 Global instance - only created in browser
export const errorMonitor = browser ? new ErrorMonitor() : createServerSafeErrorMonitor();

// Server-safe error monitor for SSR
function createServerSafeErrorMonitor() {
	return {
		logError: () => ({
			id: 'server',
			timestamp: Date.now(),
			userMessage: '',
			technicalDetails: {},
			severity: 'low' as const,
			feature: 'server',
			resolved: true
		}),
		resolveError: () => {},
		clearResolvedErrors: () => {},
		getErrors: () => [],
		getErrorCount: () => 0,
		onError: () => () => {},
		getErrorSummary: () => ({
			total: 0,
			unresolved: 0,
			critical: 0,
			byFeature: {},
			bySeverity: {}
		}),
		initialize: () => {}
	};
}

// 🚨 Quick error logging for developers
export const logError = (error: Omit<ErrorEntry, 'id' | 'timestamp' | 'resolved'>) => {
	return errorMonitor.logError(error);
};

// 🎯 Feature-specific error logging
export const logRealtimeError = (message: string, details: Record<string, unknown>) => {
	return logError({
		userMessage: 'Real-time connection issue',
		technicalDetails: { message, ...details },
		severity: 'high',
		feature: 'realtime'
	});
};

export const logAudioError = (message: string, details: Record<string, unknown>) => {
	return logError({
		userMessage: 'Audio processing issue',
		technicalDetails: { message, ...details },
		severity: 'medium',
		feature: 'audio'
	});
};

export const logAuthError = (message: string, details: Record<string, unknown>) => {
	return logError({
		userMessage: 'Authentication issue',
		technicalDetails: { message, ...details },
		severity: 'critical',
		feature: 'auth'
	});
};
