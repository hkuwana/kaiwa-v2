import { browser } from '$app/environment';

type AudioMode = 'toggle' | 'push_to_talk';
type PressBehavior = 'tap_toggle' | 'press_hold';

type StoredUserSettings = {
	audioMode: AudioMode;
	pressBehavior: PressBehavior;
	updatedAt: string;
};

const STORAGE_KEY = 'kaiwa_user_settings';
const DEFAULT_SETTINGS: StoredUserSettings = {
	audioMode: 'push_to_talk',
	pressBehavior: 'press_hold',
	updatedAt: new Date().toISOString()
};

let cachedSettings: StoredUserSettings = { ...DEFAULT_SETTINGS };

if (browser) {
	const fromStorage = loadFromStorage();
	if (fromStorage) {
		cachedSettings = fromStorage;
	}
}

const listeners = new Set<(settings: StoredUserSettings) => void>();

function loadFromStorage(): StoredUserSettings | null {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return null;
		const parsed = JSON.parse(stored) as Partial<StoredUserSettings>;
		if (!parsed || typeof parsed !== 'object') return null;
		const audioMode = parsed.audioMode ?? DEFAULT_SETTINGS.audioMode;
		const pressBehavior = parsed.pressBehavior ?? DEFAULT_SETTINGS.pressBehavior;
		const updatedAt =
			typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString();
		return {
			audioMode,
			pressBehavior,
			updatedAt
		};
	} catch (error) {
		console.warn('Failed to load user settings from storage:', error);
		return null;
	}
}

function persist(settings: StoredUserSettings): void {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch (error) {
		console.warn('Failed to persist user settings:', error);
	}
}

function notify(): void {
	if (listeners.size === 0) return;
	const snapshot = { ...cachedSettings };
	for (const listener of listeners) {
		try {
			listener(snapshot);
		} catch (error) {
			console.warn('User settings listener error:', error);
		}
	}
}

export function getAudioSettings(): {
	audioMode: AudioMode;
	pressBehavior: PressBehavior;
} {
	return {
		audioMode: cachedSettings.audioMode,
		pressBehavior: cachedSettings.pressBehavior
	};
}

export function setAudioMode(mode: AudioMode): void {
	if (cachedSettings.audioMode === mode) return;

	cachedSettings = {
		...cachedSettings,
		audioMode: mode,
		updatedAt: new Date().toISOString()
	};
	persist(cachedSettings);
	notify();
}

export function setPressBehavior(behavior: PressBehavior): void {
	if (cachedSettings.pressBehavior === behavior) return;

	cachedSettings = {
		...cachedSettings,
		pressBehavior: behavior,
		updatedAt: new Date().toISOString()
	};
	persist(cachedSettings);
	notify();
}

export function subscribe(listener: (settings: StoredUserSettings) => void): () => void {
	listeners.add(listener);
	listener({ ...cachedSettings });

	return () => {
		listeners.delete(listener);
	};
}

export function hydrateFromServer(overrides: Partial<StoredUserSettings> | null): void {
	if (!overrides) return;

	const next: StoredUserSettings = {
		audioMode: overrides.audioMode ?? cachedSettings.audioMode,
		pressBehavior: overrides.pressBehavior ?? cachedSettings.pressBehavior,
		updatedAt: overrides.updatedAt ?? cachedSettings.updatedAt
	};

	const hasChanged =
		next.audioMode !== cachedSettings.audioMode ||
		next.pressBehavior !== cachedSettings.pressBehavior;

	if (!hasChanged) return;

	cachedSettings = next;
	persist(cachedSettings);
	notify();
}
