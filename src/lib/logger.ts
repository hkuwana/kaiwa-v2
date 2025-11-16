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

class ClientLogger {
	private isDevelopment: boolean;
	private minLevel: LogLevel;

	constructor() {
		this.isDevelopment = dev;
		// In production, only log warnings and errors from client
		this.minLevel = this.isDevelopment ? 'debug' : 'warn';
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
				debug: 'color: #00CED1', // Cyan
				info: 'color: #1E90FF', // Blue
				warn: 'color: #FFA500', // Orange
				error: 'color: #DC143C' // Crimson
			}[level];

			const timestamp = new Date().toLocaleTimeString();

			console.log(
				`%c${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`,
				color
			);
			if (context && Object.keys(context).length > 0) {
				console.log('   Context:', context);
			}
		} else {
			// Structured logging for production (could be sent to a logging service)
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
export const logger = new ClientLogger();
