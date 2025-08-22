// 🛠️ Utility Functions for Kaiwa MVP

export function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	if (minutes > 0) {
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}
	return `${remainingSeconds}s`;
}

export function formatTimestamp(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength) + '...';
}

export function generateSessionId(): string {
	return crypto.randomUUID();
}

export function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

export function throttle<T extends (...args: unknown[]) => unknown>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean;
	return (...args: Parameters<T>) => {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

// Audio utilities
export function float32ToInt16(buffer: Float32Array): Int16Array {
	const int16Array = new Int16Array(buffer.length);
	for (let i = 0; i < buffer.length; i++) {
		const sample = Math.max(-1, Math.min(1, buffer[i]));
		int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
	}
	return int16Array;
}

export function int16ToFloat32(buffer: Int16Array): Float32Array {
	const float32Array = new Float32Array(buffer.length);
	for (let i = 0; i < buffer.length; i++) {
		float32Array[i] = buffer[i] / (buffer[i] < 0 ? 0x8000 : 0x7fff);
	}
	return float32Array;
}

// Error handling
export class KaiwaError extends Error {
	constructor(
		message: string,
		public code: string,
		public details?: unknown
	) {
		super(message);
		this.name = 'KaiwaError';
	}
}

export function isKaiwaError(error: unknown): error is KaiwaError {
	return error instanceof KaiwaError;
}

// Local storage helpers
export function saveToStorage(key: string, data: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(data));
	} catch (error) {
		console.warn('Failed to save to localStorage:', error);
	}
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
	try {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : defaultValue;
	} catch (error) {
		console.warn('Failed to load from localStorage:', error);
		return defaultValue;
	}
}

export function removeFromStorage(key: string): void {
	try {
		localStorage.removeItem(key);
	} catch (error) {
		console.warn('Failed to remove from localStorage:', error);
	}
}

export function capitalizeFirstLetter(string: string): string {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
