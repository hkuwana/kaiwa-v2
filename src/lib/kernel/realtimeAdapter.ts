// 🔌 OpenAI Realtime API Adapter
// Streaming real-time conversation interface

export interface RealtimeAdapter {
	connect(config: RealtimeConfig): Promise<void>;
	disconnect(): Promise<void>;
	startAudioStream(): Promise<void>;
	stopAudioStream(): Promise<void>;
	sendAudio(audioData: ArrayBuffer): Promise<void>;
	onMessage(callback: (message: RealtimeMessage) => void): void;
	onAudioResponse(callback: (audioData: ArrayBuffer) => void): void;
	onError(callback: (error: Error) => void): void;
	getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' | 'error';
}

export interface RealtimeConfig {
	sessionId: string;
	model?: string;
	voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
	language?: string;
	instructions?: string;
	temperature?: number;
}

export interface RealtimeMessage {
	type: 'conversation.item.created' | 'response.audio.delta' | 'response.done' | 'error';
	data: unknown;
}

// 🌐 WebSocket-based OpenAI Realtime Implementation
export class OpenAIRealtimeAdapter implements RealtimeAdapter {
	private ws: WebSocket | null = null;
	private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
	private messageHandlers: Array<(message: RealtimeMessage) => void> = [];
	private audioHandlers: Array<(audioData: ArrayBuffer) => void> = [];
	private errorHandlers: Array<(error: Error) => void> = [];
	private audioContext: AudioContext | null = null;
	private mediaRecorder: MediaRecorder | null = null;
	private audioStream: MediaStream | null = null;

	async connect(config: RealtimeConfig): Promise<void> {
		if (this.connectionStatus === 'connected' || this.connectionStatus === 'connecting') {
			return;
		}

		this.connectionStatus = 'connecting';

		try {
			// Get ephemeral token from backend
			const tokenResponse = await fetch('/api/realtime-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(config)
			});

			if (!tokenResponse.ok) {
				throw new Error(`Failed to get realtime token: ${tokenResponse.statusText}`);
			}

			const tokenData = await tokenResponse.json();
			const ephemeralKey = tokenData.client_secret?.value;

			if (!ephemeralKey) {
				throw new Error('No ephemeral key received from server');
			}

			// Establish WebSocket connection
			const wsUrl = `wss://api.openai.com/v1/realtime?model=${config.model || 'gpt-4o-realtime-preview-2024-10-01'}`;
			this.ws = new WebSocket(wsUrl);

			// Set up WebSocket event handlers
			this.setupWebSocketHandlers();

			// Wait for connection
			await this.waitForConnection();

			// Configure session
			await this.configureSession(config);

			this.connectionStatus = 'connected';
		} catch (error) {
			this.connectionStatus = 'error';
			this.notifyError(error instanceof Error ? error : new Error(String(error)));
			throw error;
		}
	}

	async disconnect(): Promise<void> {
		if (this.audioStream) {
			this.audioStream.getTracks().forEach((track) => track.stop());
			this.audioStream = null;
		}

		if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
			this.mediaRecorder.stop();
			this.mediaRecorder = null;
		}

		if (this.audioContext) {
			await this.audioContext.close();
			this.audioContext = null;
		}

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		this.connectionStatus = 'disconnected';
	}

	async startAudioStream(): Promise<void> {
		if (!this.ws || this.connectionStatus !== 'connected') {
			throw new Error('Not connected to realtime API');
		}

		try {
			// Get user audio stream
			this.audioStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
					sampleRate: 24000
				}
			});

			// Set up audio context for processing
			this.audioContext = new AudioContext({ sampleRate: 24000 });
			const source = this.audioContext.createMediaStreamSource(this.audioStream);

			// Create processor for real-time audio streaming
			const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
			processor.onaudioprocess = (event) => {
				const inputData = event.inputBuffer.getChannelData(0);
				const pcm16 = this.convertToPCM16(inputData);
				this.sendAudioChunk(pcm16);
			};

			source.connect(processor);
			processor.connect(this.audioContext.destination);
		} catch (error) {
			throw new Error(`Failed to start audio stream: ${error}`);
		}
	}

	async stopAudioStream(): Promise<void> {
		if (this.audioStream) {
			this.audioStream.getTracks().forEach((track) => track.stop());
			this.audioStream = null;
		}

		if (this.audioContext) {
			await this.audioContext.close();
			this.audioContext = null;
		}
	}

	async sendAudio(audioData: ArrayBuffer): Promise<void> {
		if (!this.ws || this.connectionStatus !== 'connected') {
			throw new Error('Not connected to realtime API');
		}

		// Convert to base64 for WebSocket transmission
		const base64Audio = this.arrayBufferToBase64(audioData);

		const message = {
			type: 'input_audio_buffer.append',
			audio: base64Audio
		};

		this.ws.send(JSON.stringify(message));
	}

	onMessage(callback: (message: RealtimeMessage) => void): void {
		this.messageHandlers.push(callback);
	}

	onAudioResponse(callback: (audioData: ArrayBuffer) => void): void {
		this.audioHandlers.push(callback);
	}

	onError(callback: (error: Error) => void): void {
		this.errorHandlers.push(callback);
	}

	getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' | 'error' {
		return this.connectionStatus;
	}

	// Private helper methods

	private setupWebSocketHandlers(): void {
		if (!this.ws) return;

		this.ws.onopen = () => {
			console.log('Realtime WebSocket connected');
		};

		this.ws.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data);
				this.handleRealtimeMessage(message);
			} catch (error) {
				console.error('Failed to parse realtime message:', error);
			}
		};

		this.ws.onerror = (error) => {
			console.error('WebSocket error:', error);
			this.connectionStatus = 'error';
			this.notifyError(new Error('WebSocket connection error'));
		};

		this.ws.onclose = (event) => {
			console.log('WebSocket closed:', event.code, event.reason);
			this.connectionStatus = 'disconnected';
		};
	}

	private handleRealtimeMessage(message: unknown): void {
		// Type guard for message structure
		if (typeof message !== 'object' || message === null || !('type' in message)) {
			return;
		}

		const messageObj = message as { type: string; delta?: string; [key: string]: unknown };

		const realtimeMessage: RealtimeMessage = {
			type: messageObj.type as RealtimeMessage['type'],
			data: message
		};

		// Handle audio responses
		if (messageObj.type === 'response.audio.delta' && messageObj.delta) {
			const audioData = this.base64ToArrayBuffer(messageObj.delta);
			this.audioHandlers.forEach((handler) => handler(audioData));
		}

		// Notify message handlers
		this.messageHandlers.forEach((handler) => handler(realtimeMessage));
	}

	private async waitForConnection(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.ws) {
				reject(new Error('No WebSocket connection'));
				return;
			}

			const timeout = setTimeout(() => {
				reject(new Error('Connection timeout'));
			}, 10000);

			this.ws.onopen = () => {
				clearTimeout(timeout);
				resolve();
			};

			this.ws.onerror = (error) => {
				clearTimeout(timeout);
				reject(error);
			};
		});
	}

	private async configureSession(config: RealtimeConfig): Promise<void> {
		if (!this.ws) return;

		// Language-specific instructions for better tutoring
		const getLanguageInstructions = (language?: string) => {
			const baseInstruction =
				'You are a helpful language tutor. Keep responses conversational and encouraging.';

			if (!language || language === 'en') {
				return baseInstruction;
			}

			const languageMap: Record<string, string> = {
				es: `${baseInstruction} You are teaching Spanish. Respond in Spanish, but keep it simple for beginners. Use basic vocabulary and grammar.`,
				fr: `${baseInstruction} You are teaching French. Respond in French, but keep it simple for beginners. Use basic vocabulary and grammar.`,
				de: `${baseInstruction} You are teaching German. Respond in German, but keep it simple for beginners. Use basic vocabulary and grammar.`,
				it: `${baseInstruction} You are teaching Italian. Respond in Italian, but keep it simple for beginners. Use basic vocabulary and grammar.`,
				pt: `${baseInstruction} You are teaching Portuguese. Respond in Portuguese, but keep it simple for beginners. Use basic vocabulary and grammar.`,
				ja: `${baseInstruction} You are teaching Japanese. Respond in Japanese, but keep it simple for beginners. Use basic vocabulary and grammar.`,
				ko: `${baseInstruction} You are teaching Korean. Respond in Korean, but keep it simple for beginners. Use basic vocabulary and grammar.`,
				zh: `${baseInstruction} You are teaching Chinese. Respond in Chinese, but keep it simple for beginners. Use basic vocabulary and grammar.`,
				ar: `${baseInstruction} You are teaching Arabic. Respond in Arabic, but keep it simple for beginners. Use basic vocabulary and grammar.`,
				hi: `${baseInstruction} You are teaching Hindi. Respond in Hindi, but keep it simple for beginners. Use basic vocabulary and grammar.`,
				ru: `${baseInstruction} You are teaching Russian. Respond in Russian, but keep it simple for beginners. Use basic vocabulary and grammar.`
			};

			return languageMap[language] || baseInstruction;
		};

		const sessionConfig = {
			type: 'session.update',
			session: {
				modalities: ['text', 'audio'],
				instructions: getLanguageInstructions(config.language),
				voice: config.voice || 'alloy',
				input_audio_format: 'pcm16',
				output_audio_format: 'pcm16',
				input_audio_transcription: {
					model: 'whisper-1'
				},
				turn_detection: {
					type: 'server_vad',
					threshold: 0.5,
					prefix_padding_ms: 300,
					silence_duration_ms: 200
				},
				temperature: config.temperature || 0.8,
				max_response_output_tokens: 4096
			}
		};

		this.ws.send(JSON.stringify(sessionConfig));
	}

	private sendAudioChunk(audioData: ArrayBuffer): void {
		if (!this.ws || this.connectionStatus !== 'connected') return;

		const base64Audio = this.arrayBufferToBase64(audioData);
		const message = {
			type: 'input_audio_buffer.append',
			audio: base64Audio
		};

		this.ws.send(JSON.stringify(message));
	}

	private convertToPCM16(float32Array: Float32Array): ArrayBuffer {
		const buffer = new ArrayBuffer(float32Array.length * 2);
		const view = new DataView(buffer);

		for (let i = 0; i < float32Array.length; i++) {
			const sample = Math.max(-1, Math.min(1, float32Array[i]));
			view.setInt16(i * 2, sample * 0x7fff, true);
		}

		return buffer;
	}

	private arrayBufferToBase64(buffer: ArrayBuffer): string {
		const bytes = new Uint8Array(buffer);
		let binary = '';
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	private base64ToArrayBuffer(base64: string): ArrayBuffer {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes.buffer;
	}

	private notifyError(error: Error): void {
		this.errorHandlers.forEach((handler) => handler(error));
	}
}

// 🎯 Default realtime adapter
export const realtimeAdapter = new OpenAIRealtimeAdapter();
