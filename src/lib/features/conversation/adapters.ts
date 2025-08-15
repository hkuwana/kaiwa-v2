// 🔌 External Service Adapters
// Clean interfaces to external services - easy to mock and test

export interface AudioAdapter {
	startRecording(): Promise<MediaRecorder>;
	stopRecording(recorder: MediaRecorder): Promise<ArrayBuffer>;
	play(audioData: ArrayBuffer): Promise<void>;
	getDevices(): Promise<MediaDeviceInfo[]>;
}

export interface AIAdapter {
	transcribe(audio: ArrayBuffer): Promise<string>;
	complete(prompt: string, history: Array<{ role: string; content: string }>): Promise<string>;
	textToSpeech(text: string): Promise<ArrayBuffer>;
}

export interface StorageAdapter {
	save(key: string, data: unknown): Promise<void>;
	load(key: string): Promise<unknown>;
	clear(key: string): Promise<void>;
}

// 🎤 Real-time Audio Streaming Interface
export interface RealtimeSession {
	sessionId: string;
	clientSecret: string;
	expiresAt: number;
}

export interface RealtimeAudioAdapter {
	startRealtimeSession(
		sessionId: string,
		language?: string,
		voice?: string
	): Promise<RealtimeSession>;
	stopRealtimeSession(): Promise<void>;
	streamAudio(audioChunk: ArrayBuffer): Promise<void>;
	onTranscript(callback: (transcript: string) => void): void;
	onResponse(callback: (response: string) => void): void;
	onAudioResponse(callback: (audioChunk: ArrayBuffer) => void): void;
	onError(callback: (error: string) => void): void;
}

// 🎤 Browser Audio Implementation
export const browserAudio: AudioAdapter = {
	async startRecording(): Promise<MediaRecorder> {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
					sampleRate: 16000
				}
			});

			return new MediaRecorder(stream, {
				mimeType: 'audio/webm;codecs=opus'
			});
		} catch (error) {
			throw new Error(`Failed to start recording: ${error}`);
		}
	},

	async stopRecording(recorder: MediaRecorder): Promise<ArrayBuffer> {
		return new Promise((resolve, reject) => {
			const chunks: BlobPart[] = [];

			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) {
					chunks.push(e.data);
				}
			};

			recorder.onstop = async () => {
				try {
					const blob = new Blob(chunks, { type: 'audio/webm' });
					const arrayBuffer = await blob.arrayBuffer();

					// Clean up stream
					recorder.stream.getTracks().forEach((track) => track.stop());

					resolve(arrayBuffer);
				} catch (error) {
					reject(error);
				}
			};

			recorder.onerror = (error) => reject(error);
			recorder.stop();
		});
	},

	async play(audioData: ArrayBuffer): Promise<void> {
		try {
			const audioContext = new AudioContext();
			const audioBuffer = await audioContext.decodeAudioData(audioData);

			const source = audioContext.createBufferSource();
			source.buffer = audioBuffer;
			source.connect(audioContext.destination);

			return new Promise((resolve) => {
				source.onended = () => resolve();
				source.start();
			});
		} catch {
			// Fallback to simple audio playback
			const blob = new Blob([audioData]);
			const url = URL.createObjectURL(blob);
			const audio = new Audio(url);

			return new Promise((resolve, reject) => {
				audio.onended = () => {
					URL.revokeObjectURL(url);
					resolve();
				};
				audio.onerror = reject;
				audio.play();
			});
		}
	},

	async getDevices(): Promise<MediaDeviceInfo[]> {
		const devices = await navigator.mediaDevices.enumerateDevices();
		return devices.filter((device) => device.kind === 'audioinput');
	}
};

// 🎤 Real-time Audio Streaming Implementation
export class OpenAIRealtimeAudioAdapter implements RealtimeAudioAdapter {
	private session: RealtimeSession | null = null;
	private eventSource: EventSource | null = null;
	private transcriptCallback: ((transcript: string) => void) | null = null;
	private responseCallback: ((response: string) => void) | null = null;
	private audioResponseCallback: ((audioChunk: ArrayBuffer) => void) | null = null;
	private errorCallback: ((error: string) => void) | null = null;

	async startRealtimeSession(
		sessionId: string,
		language: string = 'en',
		voice: string = 'alloy'
	): Promise<RealtimeSession> {
		try {
			// Create realtime session via our API
			const response = await fetch('/api/realtime-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId,
					language,
					voice,
					model: 'gpt-4o-realtime-preview-2024-10-01'
				})
			});

			if (!response.ok) {
				throw new Error(`Failed to create realtime session: ${response.statusText}`);
			}

			const sessionData = await response.json();
			this.session = {
				sessionId: sessionData.session_id,
				clientSecret: sessionData.client_secret.value,
				expiresAt: new Date(sessionData.client_secret.expires_at).getTime()
			};

			// Set up Server-Sent Events for real-time communication
			this.setupEventSource();

			return this.session;
		} catch (error) {
			throw new Error(`Failed to start realtime session: ${error}`);
		}
	}

	async stopRealtimeSession(): Promise<void> {
		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}
		this.session = null;
	}

	async streamAudio(audioChunk: ArrayBuffer): Promise<void> {
		if (!this.session) {
			throw new Error('No active realtime session');
		}

		try {
			// Stream audio chunk to OpenAI's realtime API
			const response = await fetch('https://api.openai.com/v1/realtime/sessions/audio', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.session.clientSecret}`,
					'Content-Type': 'application/octet-stream'
				},
				body: audioChunk
			});

			if (!response.ok) {
				throw new Error(`Failed to stream audio: ${response.statusText}`);
			}
		} catch (error) {
			if (this.errorCallback) {
				this.errorCallback(`Audio streaming failed: ${error}`);
			}
		}
	}

	onTranscript(callback: (transcript: string) => void): void {
		this.transcriptCallback = callback;
	}

	onResponse(callback: (response: string) => void): void {
		this.responseCallback = callback;
	}

	onAudioResponse(callback: (audioChunk: ArrayBuffer) => void): void {
		this.audioResponseCallback = callback;
	}

	onError(callback: (error: string) => void): void {
		this.errorCallback = callback;
	}

	private setupEventSource(): void {
		if (!this.session) return;

		// Create EventSource for real-time updates
		this.eventSource = new EventSource(`/api/realtime-session/${this.session.sessionId}/events`);

		this.eventSource.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);

				switch (data.type) {
					case 'transcript':
						if (this.transcriptCallback) {
							this.transcriptCallback(data.text);
						}
						break;

					case 'response':
						if (this.responseCallback) {
							this.responseCallback(data.text);
						}
						break;

					case 'audio_response':
						if (this.audioResponseCallback) {
							// Convert base64 audio to ArrayBuffer
							const audioData = this.base64ToArrayBuffer(data.audio);
							this.audioResponseCallback(audioData);
						}
						break;

					case 'error':
						if (this.errorCallback) {
							this.errorCallback(data.message);
						}
						break;
				}
			} catch (error) {
				if (this.errorCallback) {
					this.errorCallback(`Event parsing failed: ${error}`);
				}
			}
		};

		this.eventSource.onerror = (error) => {
			if (this.errorCallback) {
				this.errorCallback(`EventSource error: ${error}`);
			}
		};
	}

	private base64ToArrayBuffer(base64: string): ArrayBuffer {
		const binaryString = atob(base64);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes.buffer;
	}
}

// 🤖 OpenAI Implementation (with fallbacks)
export const openAI: AIAdapter = {
	async transcribe(audio: ArrayBuffer): Promise<string> {
		try {
			const formData = new FormData();
			formData.append('file', new Blob([audio], { type: 'audio/webm' }), 'audio.webm');
			formData.append('model', 'whisper-1');
			formData.append('language', 'en'); // TODO: Make configurable

			const response = await fetch('/api/transcribe', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error(`Transcription failed: ${response.statusText}`);
			}

			const data = await response.json();
			return data.text || data.transcript || '';
		} catch {
			// Fallback to browser Speech Recognition
			return browserSpeechRecognition(audio);
		}
	},

	async complete(
		prompt: string,
		history: Array<{ role: string; content: string }>
	): Promise<string> {
		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: [
						{
							role: 'system',
							content:
								'You are a helpful language tutor. Keep responses conversational and encouraging. Limit responses to 2-3 sentences.'
						},
						...history,
						{ role: 'user', content: prompt }
					],
					model: 'gpt-3.5-turbo',
					max_tokens: 100,
					temperature: 0.7
				})
			});

			if (!response.ok) {
				throw new Error(`Chat completion failed: ${response.statusText}`);
			}

			const data = await response.json();
			return (
				data.choices?.[0]?.message?.content ||
				"I apologize, I didn't understand that. Could you try again?"
			);
		} catch {
			// Fallback response
			return `I heard: "${prompt}". That's great! Keep practicing.`;
		}
	},

	async textToSpeech(text: string): Promise<ArrayBuffer> {
		try {
			const response = await fetch('/api/tts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text, voice: 'alloy' })
			});

			if (!response.ok) {
				throw new Error(`TTS failed: ${response.statusText}`);
			}

			return await response.arrayBuffer();
		} catch {
			// Fallback to browser Speech Synthesis
			return browserTextToSpeech(text);
		}
	}
};

// 💾 LocalStorage with Cloud Backup
export const hybridStorage: StorageAdapter = {
	async save(key: string, data: unknown): Promise<void> {
		// Always save locally first
		localStorage.setItem(key, JSON.stringify(data));

		// Try to save to cloud (don't block on failure)
		try {
			await fetch('/api/storage', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ key, data })
			});
		} catch {
			// Cloud save failed, but local save succeeded
		}
	},

	async load(key: string): Promise<unknown> {
		try {
			// Try cloud first (if user is authenticated)
			const response = await fetch(`/api/storage/${key}`);
			if (response.ok) {
				const data = await response.json();
				// Update local storage with cloud data
				localStorage.setItem(key, JSON.stringify(data));
				return data;
			}
		} catch {
			// Fall through to local storage
		}

		// Fallback to local storage
		const data = localStorage.getItem(key);
		return data ? JSON.parse(data) : null;
	},

	async clear(key: string): Promise<void> {
		localStorage.removeItem(key);

		try {
			await fetch(`/api/storage/${key}`, { method: 'DELETE' });
		} catch {
			// Cloud clear failed, but local clear succeeded
		}
	}
};

// 🔄 Fallback implementations
async function browserSpeechRecognition(_audio: ArrayBuffer): Promise<string> {
	// TODO: Implement Web Speech API fallback
	return 'Sorry, transcription is not available right now.';
}

async function browserTextToSpeech(text: string): Promise<ArrayBuffer> {
	return new Promise((resolve) => {
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.onend = () => {
			// Return empty buffer since browser TTS doesn't return audio data
			resolve(new ArrayBuffer(0));
		};
		speechSynthesis.speak(utterance);
	});
}

// 🎯 Default adapter configuration
export const adapters = {
	audio: browserAudio,
	ai: openAI,
	storage: hybridStorage,
	realtimeAudio: new OpenAIRealtimeAudioAdapter()
};
