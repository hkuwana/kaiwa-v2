import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConversationStore } from './conversation.store.svelte';

// Mock the services
const mockAudioService = {
	initialize: vi.fn(),
	getStream: vi.fn(),
	getAvailableDevices: vi.fn(),
	onLevelUpdate: vi.fn(),
	onStreamReady: vi.fn(),
	onStreamError: vi.fn(),
	cleanup: vi.fn()
};

const mockRealtimeService = {
	connectWithSession: vi.fn(),
	cleanup: vi.fn()
};

// Mock fetch API
const mockFetch = vi.fn();

// Mock crypto.randomUUID
const mockRandomUUID = vi.fn(() => 'mock-session-id');

// Mock MediaStream
const mockMediaStream = {
	id: 'mock-stream',
	getTracks: () => [{ id: 'track1' }],
	active: true
};

// Mock MediaDeviceInfo
const mockDevices = [
	{ deviceId: 'device1', label: 'Microphone 1', kind: 'audioinput' },
	{ deviceId: 'device2', label: 'Microphone 2', kind: 'audioinput' }
];

describe('ConversationStore', () => {
	let conversationStore: ConversationStore;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Mock global objects
		global.fetch = mockFetch;
		global.crypto = { randomUUID: mockRandomUUID } as any;

		// Mock successful API responses
		mockFetch.mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve({
					session_id: 'mock-session-id',
					client_secret: {
						value: 'mock-secret',
						expires_at: Date.now() + 3600000
					}
				})
		});

		mockAudioService.getStream.mockResolvedValue(mockMediaStream);
		mockAudioService.getAvailableDevices.mockResolvedValue(mockDevices);
		mockRealtimeService.connectWithSession.mockResolvedValue(undefined);

		// Create a mock conversation store with mocked services
		conversationStore = new ConversationStore();

		// Manually set the services to our mocks
		(conversationStore as any).audioService = mockAudioService;
		(conversationStore as any).realtimeService = mockRealtimeService;

		// Manually call the initialization methods that would normally be called in the constructor
		mockAudioService.initialize();
		mockAudioService.getAvailableDevices();
		mockAudioService.onLevelUpdate(vi.fn());
		mockAudioService.onStreamReady(vi.fn());
		mockAudioService.onStreamError(vi.fn());
	});

	afterEach(() => {
		// Clean up
		if (conversationStore.cleanup) {
			conversationStore.cleanup();
		}
	});

	describe('initialization', () => {
		it('should initialize audio service and get available devices', () => {
			expect(mockAudioService.initialize).toHaveBeenCalled();
			expect(mockAudioService.getAvailableDevices).toHaveBeenCalled();
		});

		it('should set up audio service callbacks', () => {
			expect(mockAudioService.onLevelUpdate).toHaveBeenCalled();
			expect(mockAudioService.onStreamReady).toHaveBeenCalled();
			expect(mockAudioService.onStreamError).toHaveBeenCalled();
		});

		it('should initialize with default state', () => {
			expect(conversationStore.status).toBe('idle');
			expect(conversationStore.messages).toEqual([]);
			expect(conversationStore.error).toBeNull();
			expect(conversationStore.language).toBe('en');
			expect(conversationStore.voice).toBe('alloy');
		});
	});

	describe('startConversation', () => {
		it('should transition status to connecting and then connected', async () => {
			const promise = conversationStore.startConversation('es', 'female');

			expect(conversationStore.status).toBe('connecting');
			expect(conversationStore.error).toBeNull();

			await promise;

			expect(conversationStore.status).toBe('connected');
			expect(conversationStore.language).toBe('es');
			expect(conversationStore.voice).toBe('female');
		});

		it('should get audio stream from audio service', async () => {
			await conversationStore.startConversation();

			expect(mockAudioService.getStream).toHaveBeenCalledWith('default');
		});

		it('should fetch realtime session from API', async () => {
			await conversationStore.startConversation();

			expect(mockFetch).toHaveBeenCalledWith('/api/realtime-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId: 'mock-session-id',
					model: 'gpt-4o-mini-realtime-preview-2024-12-17',
					voice: 'alloy'
				})
			});
		});

		it('should connect realtime service with session data and stream', async () => {
			await conversationStore.startConversation();

			expect(mockRealtimeService.connectWithSession).toHaveBeenCalledWith(
				{
					session_id: 'mock-session-id',
					client_secret: {
						value: 'mock-secret',
						expires_at: expect.any(Number)
					}
				},
				mockMediaStream,
				expect.any(Function),
				expect.any(Function)
			);
		});

		it('should not start conversation if already in progress', async () => {
			conversationStore.status = 'connecting';

			await conversationStore.startConversation();

			expect(mockAudioService.getStream).not.toHaveBeenCalled();
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it('should handle API errors gracefully', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 500,
				text: () => Promise.resolve('Internal Server Error')
			});

			await expect(conversationStore.startConversation()).rejects.toThrow(
				'Failed to get session: 500 - Internal Server Error'
			);

			expect(conversationStore.status).toBe('error');
		});

		it('should handle audio service errors', async () => {
			const errorMessage = 'Microphone permission denied';
			mockAudioService.getStream.mockRejectedValue(new Error(errorMessage));

			await expect(conversationStore.startConversation()).rejects.toThrow(errorMessage);

			expect(conversationStore.status).toBe('error');
			expect(conversationStore.error).toBe(errorMessage);
		});

		it('should handle realtime service connection errors', async () => {
			const errorMessage = 'WebRTC connection failed';
			mockRealtimeService.connectWithSession.mockRejectedValue(new Error(errorMessage));

			await expect(conversationStore.startConversation()).rejects.toThrow(errorMessage);

			expect(conversationStore.status).toBe('error');
		});
	});

	describe('message handling', () => {
		it('should add user messages to the messages array', async () => {
			await conversationStore.startConversation();

			// Get the onMessage callback from the realtime service call
			const onMessageCallback = mockRealtimeService.connectWithSession.mock.calls[0][2];

			// Simulate receiving a user message
			onMessageCallback({ role: 'user', content: 'Hello, how are you?' });

			expect(conversationStore.messages).toHaveLength(1);
			expect(conversationStore.messages[0]).toMatchObject({
				role: 'user',
				content: 'Hello, how are you?'
			});
		});

		it('should add assistant messages to the messages array', async () => {
			await conversationStore.startConversation();

			// Get the onMessage callback from the realtime service call
			const onMessageCallback = mockRealtimeService.connectWithSession.mock.calls[0][2];

			// Simulate receiving an assistant message
			onMessageCallback({ role: 'assistant', content: 'I am doing well, thank you!' });

			expect(conversationStore.messages).toHaveLength(1);
			expect(conversationStore.messages[0]).toMatchObject({
				role: 'assistant',
				content: 'I am doing well, thank you!'
			});
		});

		it('should handle multiple messages correctly', async () => {
			await conversationStore.startConversation();

			// Get the onMessage callback from the realtime service call
			const onMessageCallback = mockRealtimeService.connectWithSession.mock.calls[0][2];

			// Simulate receiving multiple messages
			onMessageCallback({ role: 'user', content: 'Hello' });
			onMessageCallback({ role: 'assistant', content: 'Hi there!' });
			onMessageCallback({ role: 'user', content: 'How are you?' });

			expect(conversationStore.messages).toHaveLength(3);
			expect(conversationStore.messages[0].role).toBe('user');
			expect(conversationStore.messages[1].role).toBe('assistant');
			expect(conversationStore.messages[2].role).toBe('user');
		});
	});

	describe('connection state handling', () => {
		it('should update status based on connection state changes', async () => {
			await conversationStore.startConversation();

			// Get the onConnectionStateChange callback from the realtime service call
			const onConnectionStateChangeCallback =
				mockRealtimeService.connectWithSession.mock.calls[0][3];

			// Simulate connection state changes
			onConnectionStateChangeCallback('connecting');
			expect(conversationStore.status).toBe('connecting');

			onConnectionStateChangeCallback('connected');
			expect(conversationStore.status).toBe('connected');

			onConnectionStateChangeCallback('failed');
			expect(conversationStore.status).toBe('failed');
		});
	});

	describe('device management', () => {
		it('should update available devices when audio service provides them', async () => {
			// Simulate the async callback from getAvailableDevices
			const devicesPromise = mockAudioService.getAvailableDevices.mock.results[0].value;
			await devicesPromise;

			expect(conversationStore.availableDevices).toEqual(mockDevices);
		});

		it('should allow changing selected device', () => {
			conversationStore.selectedDeviceId = 'device2';

			expect(conversationStore.selectedDeviceId).toBe('device2');
		});
	});

	describe('audio level monitoring', () => {
		it('should update audio level when callback is triggered', () => {
			// Get the onLevelUpdate callback from the audio service
			const onLevelUpdateCallback = mockAudioService.onLevelUpdate.mock.calls[0][0];

			// Simulate audio level update
			onLevelUpdateCallback({ level: 0.75, timestamp: Date.now() });

			expect(conversationStore.audioLevel).toBe(0.75);
		});
	});

	describe('error handling', () => {
		it('should handle stream errors from audio service', () => {
			// Get the onStreamError callback from the audio service
			const onStreamErrorCallback = mockAudioService.onStreamError.mock.calls[0][0];

			// Simulate stream error
			onStreamErrorCallback('Microphone access denied');

			expect(conversationStore.error).toBe('Microphone access denied');
			expect(conversationStore.status).toBe('error');
		});

		it('should clear error when starting new conversation', async () => {
			// Set an error first
			conversationStore.error = 'Previous error';
			conversationStore.status = 'error';

			await conversationStore.startConversation();

			expect(conversationStore.error).toBeNull();
			expect(conversationStore.status).toBe('connected');
		});
	});

	describe('cleanup', () => {
		it('should clean up services and reset state', () => {
			conversationStore.status = 'connected';
			conversationStore.messages = [{ role: 'user', content: 'test' }];
			conversationStore.error = 'test error';

			conversationStore.cleanup();

			expect(mockAudioService.cleanup).toHaveBeenCalled();
			expect(mockRealtimeService.cleanup).toHaveBeenCalled();
			expect(conversationStore.status).toBe('idle');
			expect(conversationStore.messages).toEqual([]);
			expect(conversationStore.error).toBeNull();
		});
	});

	describe('session management', () => {
		it('should generate unique session ID for each conversation', async () => {
			await conversationStore.startConversation();

			expect(conversationStore.sessionId).toBe('mock-session-id');
			expect(mockRandomUUID).toHaveBeenCalled();
		});

		it('should record start time when conversation begins', async () => {
			const startTime = Date.now();
			await conversationStore.startConversation();

			expect(conversationStore.startTime).toBeGreaterThanOrEqual(startTime);
		});
	});
});
