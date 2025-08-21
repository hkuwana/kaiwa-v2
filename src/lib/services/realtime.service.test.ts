import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RealtimeService } from './realtime.service';

// Mock WebRTC APIs
const mockRTCPeerConnection = vi.fn();
const mockRTCDataChannel = vi.fn();
const mockAudioElement = {
	autoplay: false,
	style: { display: 'none' },
	srcObject: null,
	remove: vi.fn()
};

// Mock DOM APIs
const mockCreateElement = vi.fn(() => mockAudioElement);
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

// Mock fetch API
const mockFetch = vi.fn();

// Mock crypto.randomUUID
const mockRandomUUID = vi.fn(() => 'mock-uuid');

// Mock timers
const mockSetTimeout = vi.fn(() => 123);
const mockClearTimeout = vi.fn();

describe('RealtimeService', () => {
	let realtimeService: RealtimeService;
	let mockPeerConnection: any;
	let mockDataChannel: any;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Mock global objects
		global.document = {
			createElement: mockCreateElement,
			body: { appendChild: mockAppendChild, removeChild: mockRemoveChild }
		} as any;

		global.fetch = mockFetch;
		global.crypto = { randomUUID: mockRandomUUID } as any;
		global.setTimeout = mockSetTimeout;
		global.clearTimeout = mockClearTimeout;

		// Mock fetch to return a proper Response object
		mockFetch.mockResolvedValue({
			ok: true,
			text: () => Promise.resolve('mock-response'),
			json: () => Promise.resolve({ success: true })
		} as any);

		// Mock RTCPeerConnection
		mockPeerConnection = {
			addTrack: vi.fn(),
			ontrack: null,
			onconnectionstatechange: null,
			oniceconnectionstatechange: null,
			onicecandidate: null,
			connectionState: 'new',
			iceConnectionState: 'new',
			createOffer: vi.fn(),
			createAnswer: vi.fn(),
			setLocalDescription: vi.fn(),
			setRemoteDescription: vi.fn(),
			addIceCandidate: vi.fn(),
			createDataChannel: vi.fn(() => mockDataChannel),
			close: vi.fn()
		};

		mockDataChannel = {
			onopen: null,
			onmessage: null,
			onclose: null,
			onerror: null,
			send: vi.fn(),
			close: vi.fn(),
			readyState: 'open'
		};

		mockRTCPeerConnection.mockReturnValue(mockPeerConnection);
		global.RTCPeerConnection = mockRTCPeerConnection as any;
		global.RTCDataChannel = mockRTCDataChannel as any;

		realtimeService = new RealtimeService();
	});

	afterEach(() => {
		// Clean up
		realtimeService.cleanup();
	});

	describe('connectWithSession', () => {
		const mockSessionData = {
			client_secret: {
				value: 'test-secret-key',
				expires_at: Date.now() + 3600000 // 1 hour from now
			}
		};

		const mockStream = {
			id: 'mock-stream',
			getTracks: () => [{ id: 'track1' }],
			active: true
		};

		const mockOnMessage = vi.fn();
		const mockOnConnectionStateChange = vi.fn();

		it('should set up connection with session data and stream', async () => {
			// Mock successful connection setup
			mockPeerConnection.createOffer.mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
			mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);

			await realtimeService.connectWithSession(
				mockSessionData,
				mockStream,
				mockOnMessage,
				mockOnConnectionStateChange
			);

			expect(mockRTCPeerConnection).toHaveBeenCalledWith({
				iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
			});
			expect(mockPeerConnection.addTrack).toHaveBeenCalledWith({ id: 'track1' }, mockStream);
			expect(mockCreateElement).toHaveBeenCalledWith('audio');
			expect(mockAppendChild).toHaveBeenCalledWith(mockAudioElement);
			expect(mockOnConnectionStateChange).toHaveBeenCalledWith('connecting');
		});

		it('should handle connection setup errors', async () => {
			const error = new Error('Connection failed');
			mockPeerConnection.createOffer.mockRejectedValue(error);

			await expect(
				realtimeService.connectWithSession(
					mockSessionData,
					mockStream,
					mockOnMessage,
					mockOnConnectionStateChange
				)
			).rejects.toThrow('Connection failed');
		});

		it('should schedule reconnect before session expiry', async () => {
			const futureExpiry = Date.now() + 3600000; // 1 hour from now
			const sessionWithFutureExpiry = {
				client_secret: {
					value: 'test-secret-key',
					expires_at: futureExpiry
				}
			};

			mockPeerConnection.createOffer.mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
			mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);

			await realtimeService.connectWithSession(
				sessionWithFutureExpiry,
				mockStream,
				mockOnMessage,
				mockOnConnectionStateChange
			);

			expect(mockSetTimeout).toHaveBeenCalled();
		});
	});

	describe('WebRTC event handling', () => {
		it('should handle connection state changes', async () => {
			const mockStream = {
				id: 'mock-stream',
				getTracks: () => [{ id: 'track1' }],
				active: true
			};

			const mockOnConnectionStateChange = vi.fn();
			const mockOnMessage = vi.fn();

			// Set up the connection
			mockPeerConnection.createOffer.mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
			mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);

			await realtimeService.connectWithSession(
				{ client_secret: { value: 'test', expires_at: Date.now() + 3600000 } },
				mockStream,
				mockOnMessage,
				mockOnConnectionStateChange
			);

			// Simulate connection state change
			mockPeerConnection.connectionState = 'connected';
			if (mockPeerConnection.onconnectionstatechange) {
				mockPeerConnection.onconnectionstatechange();
			}

			expect(mockOnConnectionStateChange).toHaveBeenCalledWith('connected');
		});

		it('should handle ICE connection state changes', async () => {
			const mockStream = {
				id: 'mock-stream',
				getTracks: () => [{ id: 'track1' }],
				active: true
			};

			const mockOnConnectionStateChange = vi.fn();
			const mockOnMessage = vi.fn();

			// Set up the connection
			mockPeerConnection.createOffer.mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
			mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);

			await realtimeService.connectWithSession(
				{ client_secret: { value: 'test', expires_at: Date.now() + 3600000 } },
				mockStream,
				mockOnMessage,
				mockOnConnectionStateChange
			);

			// Simulate ICE connection state change
			mockPeerConnection.iceConnectionState = 'connected';
			if (mockPeerConnection.oniceconnectionstatechange) {
				mockPeerConnection.oniceconnectionstatechange();
			}

			expect(mockOnConnectionStateChange).toHaveBeenCalledWith('connected');
		});

		it('should handle incoming audio tracks', async () => {
			const mockStream = {
				id: 'mock-stream',
				getTracks: () => [{ id: 'track1' }],
				active: true
			};

			const mockRemoteStream = {
				id: 'remote-stream',
				getTracks: () => [{ id: 'remote-track' }]
			};

			const mockOnConnectionStateChange = vi.fn();
			const mockOnMessage = vi.fn();

			// Set up the connection
			mockPeerConnection.createOffer.mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
			mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);

			await realtimeService.connectWithSession(
				{ client_secret: { value: 'test', expires_at: Date.now() + 3600000 } },
				mockStream,
				mockOnMessage,
				mockOnConnectionStateChange
			);

			// Simulate incoming track
			if (mockPeerConnection.ontrack) {
				mockPeerConnection.ontrack({ streams: [mockRemoteStream] });
			}

			expect(mockAudioElement.srcObject).toBe(mockRemoteStream);
		});
	});

	describe('data channel handling', () => {
		it('should set up data channel event handlers', async () => {
			const mockStream = {
				id: 'mock-stream',
				getTracks: () => [{ id: 'track1' }],
				active: true
			};

			const mockOnConnectionStateChange = vi.fn();
			const mockOnMessage = vi.fn();

			// Mock data channel creation
			mockPeerConnection.createDataChannel = vi.fn(() => mockDataChannel);

			// Set up the connection
			mockPeerConnection.createOffer.mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
			mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);

			await realtimeService.connectWithSession(
				{ client_secret: { value: 'test', expires_at: Date.now() + 3600000 } },
				mockStream,
				mockOnMessage,
				mockOnConnectionStateChange
			);

			expect(mockPeerConnection.createDataChannel).toHaveBeenCalledWith('chat', {
				ordered: true
			});
		});

		it('should handle data channel messages', async () => {
			const mockStream = {
				id: 'mock-stream',
				getTracks: () => [{ id: 'track1' }],
				active: true
			};

			const mockOnConnectionStateChange = vi.fn();
			const mockOnMessage = vi.fn();

			// Mock data channel creation
			mockPeerConnection.createDataChannel = vi.fn(() => mockDataChannel);

			// Set up the connection
			mockPeerConnection.createOffer.mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
			mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);

			await realtimeService.connectWithSession(
				{ client_secret: { value: 'test', expires_at: Date.now() + 3600000 } },
				mockStream,
				mockOnMessage,
				mockOnConnectionStateChange
			);

			// Simulate data channel message
			const mockMessage = { role: 'user', content: 'Hello' };
			if (mockDataChannel.onmessage) {
				mockDataChannel.onmessage({ data: JSON.stringify(mockMessage) });
			}

			expect(mockOnMessage).toHaveBeenCalledWith(mockMessage);
		});
	});

	describe('cleanup', () => {
		it('should close peer connection and clean up resources', async () => {
			const mockStream = {
				id: 'mock-stream',
				getTracks: () => [{ id: 'track1' }],
				active: true
			};

			// Set up the connection
			mockPeerConnection.createOffer.mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
			mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);

			await realtimeService.connectWithSession(
				{ client_secret: { value: 'test', expires_at: Date.now() + 3600000 } },
				mockStream,
				vi.fn(),
				vi.fn()
			);

			realtimeService.cleanup();

			expect(mockPeerConnection.close).toHaveBeenCalled();
			expect(mockRemoveChild).toHaveBeenCalledWith(mockAudioElement);
			expect(mockClearTimeout).toHaveBeenCalled();
		});
	});

	describe('reconnection', () => {
		it('should attempt reconnection when scheduled', async () => {
			const mockStream = {
				id: 'mock-stream',
				getTracks: () => [{ id: 'track1' }],
				active: true
			};

			// Set up the connection
			mockPeerConnection.createOffer.mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
			mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);

			await realtimeService.connectWithSession(
				{ client_secret: { value: 'test', expires_at: Date.now() + 3600000 } },
				mockStream,
				vi.fn(),
				vi.fn()
			);

			// Get the scheduled reconnection function
			const reconnectionFunction = mockSetTimeout.mock.calls[0][0];

			// Mock successful reconnection
			mockPeerConnection.createOffer.mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
			mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);

			// Execute the reconnection function
			await reconnectionFunction();

			expect(mockRTCPeerConnection).toHaveBeenCalledTimes(2); // Initial + reconnection
		});
	});

	describe('error handling', () => {
		it('should handle peer connection errors gracefully', async () => {
			const mockStream = {
				id: 'mock-stream',
				getTracks: () => [{ id: 'track1' }],
				active: true
			};

			// Mock connection failure
			mockPeerConnection.createOffer.mockRejectedValue(new Error('WebRTC error'));

			await expect(
				realtimeService.connectWithSession(
					{ client_secret: { value: 'test', expires_at: Date.now() + 3600000 } },
					mockStream,
					vi.fn(),
					vi.fn()
				)
			).rejects.toThrow('WebRTC error');
		});
	});
});
