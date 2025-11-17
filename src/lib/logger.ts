import { dev } from '$app/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Accept both objects and primitive values for flexible logging
export type LogContext =
	| Record<string, unknown>
	| string
	| number
	| boolean
	| null
	| undefined
	| unknown
	| Error;

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: Record<string, unknown>;
	environment: string;
}

class Logger {
	private isDevelopment: boolean;
	private isServer: boolean;
	private minLevel: LogLevel;

	constructor() {
		this.isDevelopment = dev;
		this.isServer = typeof window === 'undefined';
		// Server: show info+ in prod, Client: show warn+ in prod
		this.minLevel = this.isDevelopment ? 'debug' : this.isServer ? 'info' : 'warn';
	}

	private shouldLog(level: LogLevel): boolean {
		const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
		const currentLevelIndex = levels.indexOf(level);
		const minLevelIndex = levels.indexOf(this.minLevel);
		return currentLevelIndex >= minLevelIndex;
	}

	private formatMessage(level: LogLevel, message: string, context?: LogContext): void {
		if (!this.shouldLog(level)) {
			return;
		}

		// Normalize context to always be an object for LogEntry
		const normalizedContext: Record<string, unknown> | undefined =
			context !== undefined && context !== null
				? typeof context === 'object' && !Array.isArray(context) && !(context instanceof Error)
					? (context as Record<string, unknown>)
					: { value: context }
				: undefined;

		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			context: normalizedContext,
			environment: this.isDevelopment ? 'development' : 'production'
		};

		if (this.isDevelopment) {
			// Pretty printing for development
			const emoji = {
				debug: '🔍',
				info: 'ℹ️',
				warn: '⚠️',
				error: '❌'
			}[level];

			const timestamp = new Date().toLocaleTimeString();

			if (this.isServer) {
				// ANSI color codes for server/terminal
				const color = {
					debug: '\x1b[36m', // Cyan
					info: '\x1b[34m', // Blue
					warn: '\x1b[33m', // Yellow
					error: '\x1b[31m' // Red
				}[level];
				const reset = '\x1b[0m';

				console.log(`${color}${emoji} [${timestamp}] ${level.toUpperCase()}${reset}: ${message}`);
				if (context !== undefined && context !== null) {
					console.log(`${color}   Context:${reset}`, context);
				}
			} else {
				// CSS colors for browser console
				const color = {
					debug: 'color: #00CED1', // Cyan
					info: 'color: #1E90FF', // Blue
					warn: 'color: #FFA500', // Orange
					error: 'color: #DC143C' // Crimson
				}[level];

				console.log(`%c${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`, color);
				if (context !== undefined && context !== null) {
					console.log('   Context:', context);
				}
			}
		} else {
			// Structured JSON logging for production
			console.log(JSON.stringify(entry));
		}
	}

	debug(message: string, context?: LogContext): void {
		this.formatMessage('debug', message, context);
	}

	info(message: string, context?: LogContext): void {
		this.formatMessage('info', message, context);
	}

	warn(message: string, context?: LogContext): void {
		this.formatMessage('warn', message, context);
	}

	error(message: string, context?: LogContext): void {
		this.formatMessage('error', message, context);
	}

	// Convenience method for logging errors with stack traces
	logError(error: Error | unknown, message?: string, context?: LogContext): void {
		const errorMessage = message || 'An error occurred';
		// Normalize context to object before spreading
		const contextObj =
			context &&
			typeof context === 'object' &&
			!Array.isArray(context) &&
			!(context instanceof Error)
				? context
				: context !== undefined && context !== null
					? { originalContext: context }
					: {};
		const errorContext: Record<string, unknown> = {
			...contextObj,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined
		};
		this.error(errorMessage, errorContext);
	}
}

// Export a singleton instance
export const logger = new Logger();
