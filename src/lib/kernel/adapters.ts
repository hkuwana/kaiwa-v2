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
	storage: hybridStorage
};
