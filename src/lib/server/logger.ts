import { dev } from '$app/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
	[key: string]: unknown;
}

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: LogContext;
	environment: string;
}

class Logger {
	private isDevelopment: boolean;
	private minLevel: LogLevel;

	constructor() {
		this.isDevelopment = dev;
		// In production, default to 'info' level, in dev allow 'debug'
		this.minLevel = this.isDevelopment ? 'debug' : 'info';
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

		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			context,
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

			const color = {
				debug: '\x1b[36m', // Cyan
				info: '\x1b[34m', // Blue
				warn: '\x1b[33m', // Yellow
				error: '\x1b[31m' // Red
			}[level];

			const reset = '\x1b[0m';
			const timestamp = new Date().toLocaleTimeString();

			console.log(`${color}${emoji} [${timestamp}] ${level.toUpperCase()}${reset}: ${message}`);
			if (context && Object.keys(context).length > 0) {
				console.log(`${color}   Context:${reset}`, context);
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
		const errorContext: LogContext = {
			...context,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined
		};
		this.error(errorMessage, errorContext);
	}
}

// Export a singleton instance
export const logger = new Logger();
